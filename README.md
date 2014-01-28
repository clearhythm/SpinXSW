# Spin

A tiny POC using the [einaros/ws](http://einaros.github.io/ws/) WebSockets implementation.

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