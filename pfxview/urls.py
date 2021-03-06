from django.conf import settings
from django.conf.urls import include, url  # noqa
from django.contrib import admin
from django.views.generic import TemplateView
import django_js_reverse.views

from pfxview.views import AtbatView, GameView, PitchView


urlpatterns = [
    url(r'^admin/', admin.site.urls),
    url(r'^jsreverse/$', django_js_reverse.views.urls_js, name='js_reverse'),

    url(r'^$', TemplateView.as_view(template_name='exampleapp/itworks.html'), name='home'),

    url('^game/(?P<gid>[^/]+)/$', GameView.as_view()),
    url('^atbats/(?P<game_id>\d+)/$', AtbatView.as_view()),
    url('^pitches/(?P<atbat>\d+)/$', PitchView.as_view()),
]

if settings.DEBUG:
    import debug_toolbar
    urlpatterns = [
        url(r'^__debug__/', include(debug_toolbar.urls)),
    ] + urlpatterns
