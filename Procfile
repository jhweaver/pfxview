web: gunicorn pfxview.wsgi --limit-request-line 8188 --log-file -
worker: celery worker --app=pfxview --loglevel=info
