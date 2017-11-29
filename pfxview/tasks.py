import datetime
import re
import requests
import xml.etree.ElementTree as ET

from celery import shared_task

from pfxview.models import Atbat, Defense, Game, Pitch, Player, Team


def get_games_for_range(start_date, end_date):
    """
    Get a list of all game links in an inclusive date range
    """

    games_list = []
    current_date = start_date

    while current_date < end_date and current_date < datetime.date.today():
        games_list = games_list + get_games_for_day(current_date)
        current_date = current_date + datetime.timedelta(days=1)

    return games_list


def get_games_for_day(date=datetime.date.today() - datetime.timedelta(days=1)):
    """
    Get a list of game links for a certain day
    """

    url = 'http://gd2.mlb.com/components/game/mlb/year_{}/month_{:02}/day_{:02}'.format(date.year, date.month, date.day)
    r = requests.get(url)
    games = re.findall(r'href="(gid_\d{4}_\d{2}_\d{2}_[^_]{6}_[^_]{6}_\d)', r.text)
    game_links = [url + '/' + x for x in games]
    return game_links


def process_games(game_links, parallel=False):
    """
    Import data from multiple games given their links
    """

    for game_link in game_links:
        if parallel:
            process_game.delay(game_link)
        else:
            process_game(game_link)


def process_pitch(pitch_elem, atbat, balls, strikes):
    """
    Create a pitch object from an xml node

    Returns (pitch_object, is_new) where pitch_object is the Pitch object
            and is_new is a boolean that is True only if a new pitch
            needs to be created for this object
    """

    kwargs = pitch_elem.attrib

    # had to rename invalid column names in model.
    for reserved_word in Pitch.reserved_fixes.keys():
        kwargs[Pitch.reserved_fixes[reserved_word]] = kwargs[reserved_word]
        del(kwargs[reserved_word])

    kwargs['balls'] = balls
    kwargs['strikes'] = strikes
    kwargs['atbat_num'] = atbat.num
    kwargs['game_id'] = atbat.game.id

    pitch = Pitch(**kwargs)
    return pitch


def process_atbat(atbat_elem, top_bottom, inning, game, defense):
    """
    Create an atbat object from an xml node.
    Call process_pitch for every pitch in that atbat
    """
    kwargs = atbat_elem.attrib
    kwargs['inning'] = inning
    kwargs['top_bottom'] = top_bottom
    kwargs['game'] = game
    kwargs['defense'] = defense

    for delete_blank in Atbat.delete_blanks:
        if delete_blank in kwargs and kwargs[delete_blank] == '':
            del(kwargs[delete_blank])

    atbat = Atbat(**kwargs)

    balls = 0
    strikes = 0

    pitches = []

    for pitch_elem in atbat_elem:
        if pitch_elem.tag == 'pitch':
            pitch = process_pitch(pitch_elem, atbat, balls, strikes)
            pitches.append(pitch)
            if pitch.pitch_type == 'B':
                balls += 1
            else:
                if strikes < 2:
                    strikes += 1

    return (atbat, pitches,)


def process_players(player_root_elem):
    """
    Make sure all the players are in the DB prior to processing game.
    Return Defense objects with starting line ups.
    """
    away_defense = Defense()
    home_defense = Defense()

    position_to_position = {
        'C': 'catcher',
        '1B': 'first_base',
        '2B': 'second_base',
        '3B': 'third_base',
        'SS': 'shortstop',
        'LF': 'left_field',
        'CF': 'center_field',
        'RF': 'right_field',
    }

    for team_elem in player_root_elem:
        for player_elem in team_elem:
            player_kwargs = {}
            player_kwargs['first'] = player_elem.attrib.get('first')
            player_kwargs['last'] = player_elem.attrib.get('last')
            player_kwargs['boxname'] = player_elem.attrib.get('boxname')
            player_kwargs['rl'] = player_elem.attrib.get('rl')
            player_kwargs['bats'] = player_elem.attrib.get('bats')
            player, create = Player.objects.get_or_create(
                id=player_elem.attrib['id'],
                defaults=player_kwargs,
            )
            if team_elem.tag == 'team' and team_elem.attrib['type'] == 'away':
                if player_elem.attrib.get('game_position') in position_to_position:
                    setattr(
                        away_defense,
                        position_to_position[player_elem.attrib['game_position']],
                        player,
                    )
            elif team_elem.tag == 'team' and team_elem.attrib['type'] == 'home':
                if player_elem.attrib.get('game_position') in position_to_position:
                    setattr(
                        home_defense,
                        position_to_position[player_elem.attrib['game_position']],
                        player,
                    )

    return (away_defense, home_defense)


@shared_task
def process_game(game_link):
        """
        Create a Game object. Query the mlbam gameday xml files for that game.
        Call process_atbat for each atbat in that game
        """

        inning_url = game_link + '/inning/inning_all.xml'
        inning_r = requests.get(inning_url)
        if inning_r.status_code != 200:
            return
        root = ET.fromstring(inning_r.text.replace(u'\xed', '').encode('utf-8').strip())

        match = re.search(r'(gid_(\d{4})_(\d{2})_(\d{2})_[^_]{6}_[^_]{6}_\d)', game_link)
        gid = match.group(1)
        date = datetime.date(int(match.group(2)), int(match.group(3)), int(match.group(4)))

        teams = re.findall(r'_([^_]{3})[^_]{3}', gid)

        try:
            away_team = Team.objects.get(short=teams[0])
            home_team = Team.objects.get(short=teams[1])
        except Team.DoesNotExist:
            return

        # Get the player data for the game. This is needed to create player models, and to set
        # up initial defenses.
        player_link = game_link + "/players.xml"
        player_r = requests.get(player_link)

        if player_r.status_code != 200:
            return
        player_root = ET.fromstring(player_r.text.replace(u'\xed', '').encode('utf-8').strip())
        away_defense, home_defense = process_players(player_root)
        away_defense.save()
        home_defense.save()

        Game.objects.filter(gid=gid).delete()

        game = Game(
            gid=gid,
            date=date,
            home_team=home_team,
            away_team=away_team,
        )
        game.save()

        as_the_position_map = {
            'catcher': 'catcher',
            'first base': 'first_base',
            'second base': 'second_base',
            'third base': 'third_base',
            'first baseman': 'first_base',
            'second baseman': 'second_base',
            'third baseman': 'third_base',
            'shortstop': 'shortstop',
            'left fielder': 'left_field',
            'center fielder': 'center_field',
            'right fielder': 'right_field',
            'left field': 'left_field',
            'center field': 'center_field',
            'right field': 'right_field',
        }
        position_map = {
            'catcher': 'catcher',
            'first base': 'first_base',
            'second base': 'second_base',
            'third base': 'third_base',
            'first baseman': 'first_base',
            'second baseman': 'second_base',
            'third baseman': 'third_base',
            'shortstop': 'shortstop',
            'left field': 'left_field',
            'center field': 'center_field',
            'right fielder': 'right_field',
            'left fielder': 'left_field',
            'center fielder': 'center_field',
            'right field': 'right_field',
        }

        atbats = []
        pitches = []

        # Innings and top/bottom are tedious and meaningless relationships.
        # We're just going to pin them in to the at bats.
        for inning_elem in root:
            inning = inning_elem.attrib['num']
            for top_bottom_elem in inning_elem:
                top_bottom = 1
                if top_bottom_elem.tag == 'bottom':
                    top_bottom = 0
                for atbat_elem in top_bottom_elem:
                    if atbat_elem.tag == 'atbat':
                        if top_bottom == 1:
                            (ab, ps) = process_atbat(atbat_elem, top_bottom, inning, game, home_defense)
                            atbats.append(ab)
                            pitches.extend(ps)
                        else:
                            (ab, ps) = process_atbat(atbat_elem, top_bottom, inning, game, away_defense)
                            atbats.append(ab)
                            pitches.extend(ps)
                    # This is pretty messy, but we don't really have a choice. MLBAM
                    # did a terrible job formatting this. The only way the identified
                    # which player is getting subbed out is by name.
                    elif atbat_elem.tag == 'action' and re.search(r'^Offensive Substitution', atbat_elem.attrib['des']):
                        match = re.search(r'^Offensive Substitution.*replaces (\S+)\s+(\S+)', atbat_elem.attrib['des'])
                        first = match.group(1)
                        last = match.group(2)
                        new_player = Player.objects.get(id=atbat_elem.attrib['player'])
                        if top_bottom == 1:
                            new_home_defense = Defense(
                                catcher=home_defense.catcher,
                                first_base=home_defense.first_base,
                                second_base=home_defense.second_base,
                                third_base=home_defense.third_base,
                                shortstop=home_defense.shortstop,
                                left_field=home_defense.left_field,
                                center_field=home_defense.center_field,
                                right_field=home_defense.right_field,
                            )
                            if home_defense.catcher.first == first and home_defense.catcher.last == last:
                                new_home_defense.catcher = new_player
                                new_home_defense.save()
                                home_defense = new_home_defense
                            elif home_defense.first_base.first == first and home_defense.first_base.last == last:
                                new_home_defense.first_base = new_player
                                new_home_defense.save()
                                home_defense = new_home_defense
                            elif home_defense.second_base.first == first and home_defense.second_base.last == last:
                                new_home_defense.second_base = new_player
                                new_home_defense.save()
                                home_defense = new_home_defense
                            elif home_defense.third_base.first == first and home_defense.third_base.last == last:
                                new_home_defense.third_base = new_player
                                new_home_defense.save()
                                home_defense = new_home_defense
                            elif home_defense.shortstop.first == first and home_defense.shortstop.last == last:
                                new_home_defense.shortstop = new_player
                                new_home_defense.save()
                                home_defense = new_home_defense
                            elif home_defense.left_field.first == first and home_defense.left_field.last == last:
                                new_home_defense.left_field = new_player
                                new_home_defense.save()
                                home_defense = new_home_defense
                            elif home_defense.center_field.first == first and home_defense.center_field.last == last:
                                new_home_defense.center_field = new_player
                                new_home_defense.save()
                                home_defense = new_home_defense
                            elif home_defense.right_field.first == first and home_defense.right_field.last == last:
                                new_home_defense.right_field = new_player
                                new_home_defense.save()
                                home_defense = new_home_defense
                        else:
                            new_away_defense = Defense(
                                catcher=away_defense.catcher,
                                first_base=away_defense.first_base,
                                second_base=away_defense.second_base,
                                third_base=away_defense.third_base,
                                shortstop=away_defense.shortstop,
                                left_field=away_defense.left_field,
                                center_field=away_defense.center_field,
                                right_field=away_defense.right_field,
                            )
                            if away_defense.catcher.first == first and away_defense.catcher.last == last:
                                new_away_defense.catcher = new_player
                                new_away_defense.save()
                                away_defense = new_away_defense
                            elif away_defense.first_base.first == first and away_defense.first_base.last == last:
                                new_away_defense.first_base = new_player
                                new_away_defense.save()
                                away_defense = new_away_defense
                            elif away_defense.second_base.first == first and away_defense.second_base.last == last:
                                new_away_defense.second_base = new_player
                                new_away_defense.save()
                                away_defense = new_away_defense
                            elif away_defense.third_base.first == first and away_defense.third_base.last == last:
                                new_away_defense.third_base = new_player
                                new_away_defense.save()
                                away_defense = new_away_defense
                            elif away_defense.shortstop.first == first and away_defense.shortstop.last == last:
                                new_away_defense.shortstop = new_player
                                new_away_defense.save()
                                away_defense = new_away_defense
                            elif away_defense.left_field.first == first and away_defense.left_field.last == last:
                                new_away_defense.left_field = new_player
                                new_away_defense.save()
                                away_defense = new_away_defense
                            elif away_defense.center_field.first == first and away_defense.center_field.last == last:
                                new_away_defense.center_field = new_player
                                new_away_defense.save()
                                away_defense = new_away_defense
                            elif away_defense.right_field.first == first and away_defense.right_field.last == last:
                                new_away_defense.right_field = new_player
                                new_away_defense.save()
                                away_defense = new_away_defense
                    elif atbat_elem.tag == 'action' and re.search(r'^Defensive switch', atbat_elem.attrib['des']):
                        match = re.search(r'^Defensive switch from .+ to (.+) for', atbat_elem.attrib['des'])
                        to_position = position_map[match.group(1)]
                        new_player = Player.objects.get(id=atbat_elem.attrib['player'])
                        if top_bottom == 1:
                            new_home_defense = Defense(
                                catcher=home_defense.catcher,
                                first_base=home_defense.first_base,
                                second_base=home_defense.second_base,
                                third_base=home_defense.third_base,
                                shortstop=home_defense.shortstop,
                                left_field=home_defense.left_field,
                                center_field=home_defense.center_field,
                                right_field=home_defense.right_field,
                            )
                            setattr(new_home_defense, to_position, new_player)
                            new_home_defense.save()
                            home_defense = new_home_defense
                        else:
                            new_away_defense = Defense(
                                catcher=away_defense.catcher,
                                first_base=away_defense.first_base,
                                second_base=away_defense.second_base,
                                third_base=away_defense.third_base,
                                shortstop=away_defense.shortstop,
                                left_field=away_defense.left_field,
                                center_field=away_defense.center_field,
                                right_field=away_defense.right_field,
                            )
                            setattr(new_away_defense, to_position, new_player)
                            new_away_defense.save()
                            away_defense = new_away_defense
                    elif atbat_elem.tag == 'action' and atbat_elem.attrib['event'] == 'Defensive Switch':
                        match = re.search(r'remains in the game at ([^\.]+)', atbat_elem.attrib['des'])
                        if match is None:
                            match = re.search(r'remains in the game as the ([^\.]+)', atbat_elem.attrib['des'])
                        if match.group(1) not in ['designated hitter']:
                            to_position = as_the_position_map[match.group(1)]
                            new_player = Player.objects.get(id=atbat_elem.attrib['player'])
                            if top_bottom == 1:
                                new_home_defense = Defense(
                                    catcher=home_defense.catcher,
                                    first_base=home_defense.first_base,
                                    second_base=home_defense.second_base,
                                    third_base=home_defense.third_base,
                                    shortstop=home_defense.shortstop,
                                    left_field=home_defense.left_field,
                                    center_field=home_defense.center_field,
                                    right_field=home_defense.right_field,
                                )
                                setattr(new_home_defense, to_position, new_player)
                                new_home_defense.save()
                                home_defense = new_home_defense
                            else:
                                new_away_defense = Defense(
                                    catcher=away_defense.catcher,
                                    first_base=away_defense.first_base,
                                    second_base=away_defense.second_base,
                                    third_base=away_defense.third_base,
                                    shortstop=away_defense.shortstop,
                                    left_field=away_defense.left_field,
                                    center_field=away_defense.center_field,
                                    right_field=away_defense.right_field,
                                )
                                setattr(new_away_defense, to_position, new_player)
                                new_away_defense.save()
                                away_defense = new_away_defense

        Atbat.objects.bulk_create(atbats)
        Pitch.objects.bulk_create(pitches)
