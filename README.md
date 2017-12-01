# PFX Viewer

This is a reeeeeally small webapp that showcases some of Django's backend capabilities and some of Reacts cool modular features. It can crawl and store MLBAM's PITCHf/x data, serve JSON representations of pitches/atbats/games, and show it in a fun little interactive strike zone viewer.

There is an example hosted [here](https://www.harperweaver.com) that serves one game and is viewable per half inning. It's also pictured below.

![pictured](http://harperweaver.com/static/preview.png)

## Frontend

### The example app

The front end of this app is written in React. The relevant code is in ```assets/js/containers``` and ```assets/js/components```.

The components are:
- The RadioButtonSet which makes a styles radio button set out of an iterable object and provides feedback to its parent component using a callback. Two of these are used in the example app to filter the overall list of pitches by inning and half inning.
- The Strikezone which takes a list of pitches and draws them on an HTML5 canvas. It color codes them based on pitch type and uses different shapes for different outcomes.
- And the Legend component. While it's less interesting than the other two, the app isn't all that interpretable without it.

The same components could be reused over and over to build several views of this app. You could add more RadioButtonSets to filter on pitcher, batter, pitch result, home/away, or really anything you want simply by writing a simple callback function that filters the app's list of pitches.

It would, of course, be more useful if it had a mechanism for dynamically loading different games instead of being hard coded to load gid_2017_08_21_bosmlb_clemlb_1. I chose to focus on the reusability and style portions of it rather than add features that are essentially functions that make AJAX calls.

### Styles

All of the components use flexbox styles. This is an approach that really easily makes them responsive and performant, but doesn't work for every browser (yet). If you use Chrome or Firefox or pretty much anything other than Safari you can resize your browser to very small size and the layout adapts to keep you from having to scroll left or right to find the end of the radio button selections.

## Backend

The backend is built in python using Django, Django Rest Framework, and Celery. The models (```pfxview/models.py```) is used by every part of the backend. It defines the stucture of and relation between the objects that created from the PITCHf/x data.

### Rest Endpoints

There are a few really simple REST endpoints included to serve data. They are super, super simple endpoints that just respond to GET requests (since the data used by the app is crawled as described below, there isn't really any need for POST, PATCH, DELETE, etc endpoints for any of these resources).

The endpoints themselves are defined in the ```pfxview/views.py``` file , the routes to them are defined in the ```pfxview/urls.py``` file, and the serializers for them are defined in the ```pfxview/serializers.py``` file. The only endpoint that is actually used in the example is the /game/<game_id> endpoint, which has a serializer configured to return all the atbats and every pitch for each atbat.

### Crawling

The logic for crawling the PITCHf/x data is in the ```pfxview/tasks.py``` file. There are functions for finding links to xml files for games given dates, and functions that use those links to gather the data necessary to crawl and store the data. The process_game function is registered as celery shared task calls which can be sent to a queue and distributed if necessary.

There is a Django management function (```pfxview/management/commands/import_games.py```) command that makes it easy to run these tasks. It takes a start/end date (YYYY-MM-DD) and an optional --parallel parameter. It crawls all of the games during or after the start date (inclusice) and before (not inclusive) the end date. For example, ```python manage.py import_games 2017-04-01 2017-11-01 --parallel``` will crawl and store the 2017 regular season and distribute it using celery.

## Boilerplate

This app was made using [this](https://github.com/gryevns/django-react-bootstrap) bootstrapping repo. 10/10. Would recommend.

## Install / Run

- Install the python packages (probably in a virtualenv) ```pip install -r requirements.txt```
- Install the node packages ```npm install```
- Configure the database (and any other settings you'd like) for Django in the config files in ```pfxview/settings/```
- To start webpack, run ```npm start``` (hot reloading is already included with the boilerplate config)
- To start the application server, fire up Django with ```python manage.py runserver```
