# Spin

A tiny POC.

# Node libraries

* [events](http://nodejs.org/api/events.html): event emitter (built-in)
* [http](http://nodejs.org/api/http.html): HTTP server and client (built-in)
* [visionmedia/express](http://expressjs.com/): web application framework for node
* [einaros/ws](http://einaros.github.io/ws/): WebSocket server implementation
* [faye/faye-websocket-node](https://github.com/faye/faye-websocket-node): WebSocket client and server
* [TheThingSystem/node-pixelpusher](https://github.com/TheThingSystem/node-pixelpusher): interface with Heroic Robotics' Pixel Pusher

# Front-end libraries

* [jQuery](http://jquery.com/)
* [Flot](www.flotcharts.org): plotting
* [joewalnes/reconnecting-websocket](https://github.com/joewalnes/reconnecting-websocket)

# Running Locally

``` bash
npm install
foreman start
```

# Running on Heroku

``` bash
heroku create
heroku labs:enable websockets
git push heroku master
heroku open
```

# Updating Heroku & viewing log output

``` bash
git add .
git commit -m "Foo"
git push heroku master
heroku logs --tail
```

# Running node-to-pixelpusher server

``` bash
cd node-client-to-pp
node server.js ws://still-beyond-4935.herokuapp.com
```