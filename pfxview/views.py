from rest_framework.generics import ListAPIView

from pfxview.models import Atbat, Game, Pitch
from pfxview.serializers import AtbatSerializer, GameSerializer, PitchSerializer

class PitchView(ListAPIView):
    serializer_class = PitchSerializer

    def get_queryset(self):
        atbat_id = int(self.kwargs['atbat'])
        return Pitch.objects.filter(atbat__id=atbat_id)

class AtbatView(ListAPIView):
    serializer_class = AtbatSerializer

    def get_queryset(self):
        game_id = int(self.kwargs['game_id'])
        return Atbat.objects.filter(game__id=game_id).prefetch_related('batter', 'pitcher', 'pitches')

class GameView(ListAPIView):
    serializer_class = GameSerializer

    def get_queryset(self):
        gid = self.kwargs['gid']
        return Game.objects.filter(gid=gid).prefetch_related('atbats', 'atbats__batter', 'atbats__pitcher', 'atbats__pitches')
