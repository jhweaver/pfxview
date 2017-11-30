from rest_framework import serializers

from pfxview.models import Atbat, Game, Pitch, Player

class PlayerSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Player
        fields = ('id', 'first', 'last')

class PitchSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Pitch
        fields = ('result_type', 'des', 'pitch_type', 'code', 'px', 'pz', 'sz_top', 'sz_bot', 'external_id')

class AtbatSerializer(serializers.HyperlinkedModelSerializer):
    pitches = PitchSerializer(many=True, read_only=True)
    pitcher = PlayerSerializer(many=False, read_only=True)
    batter = PlayerSerializer(many=False, read_only=True)

    class Meta:
        model = Atbat
        fields = ('inning', 'top_bottom', 'stand', 'p_throws', 'event_num', 'pitches', 'pitcher', 'batter')

class GameSerializer(serializers.HyperlinkedModelSerializer):
    atbats = AtbatSerializer(many=True, read_only=True)

    class Meta:
        model = Game
        fields = ('gid', 'id', 'atbats')
