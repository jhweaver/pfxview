import datetime

from django.core.management.base import BaseCommand
from pfxview.tasks import get_games_for_range, process_games


class Command(BaseCommand):
    help = 'Import games between two dates'

    def add_arguments(self, parser):
        parser.add_argument('start_date', type=str, help='YYYY-MM-DD')
        parser.add_argument('end_date', type=str, help='YYYY-MM-DD')
        parser.add_argument(
            '--parallel',
            action='store_true',
            help='Import games using celery for concurrency'
        )


    def handle(self, *args, **options):
        start_date = datetime.date(
            int(options['start_date'][0:4]),
            int(options['start_date'][5:7]),
            int(options['start_date'][8:10]),
        )
        end_date = datetime.date(
            int(options['end_date'][0:4]),
            int(options['end_date'][5:7]),
            int(options['end_date'][8:10]),
        )

        parallel = True if options['parallel'] else False
        games = get_games_for_range(start_date, end_date)
        process_games(games, parallel)
