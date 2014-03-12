require.config({
  paths: {
    jquery: ['//ajax.googleapis.com/ajax/libs/jquery/2.1.0/jquery.min', 'lib/jquery-2.1.0.min'],
    reconnectingwebsocket: 'lib/reconnecting-websocket.e86719bb55',
    lodash: ['//cdnjs.cloudflare.com/ajax/libs/lodash.js/2.4.1/lodash.min', 'lib/lodash-2.4.1.min'], // Very similar to underscore
    shake: 'lib/shake.9fb2c4d3ab', // todo: could use a shim!

    jqueryui: ['//ajax.googleapis.com/ajax/libs/jqueryui/1.10.4/jquery-ui.min', 'lib/jquery-ui-1.10.4.min'],

    // THREE core + components (add-ons & plugins)
    three: 'lib/three/three-aggregate',
    threeCore: 'lib/three/three-r65.min',
    TrackballControls: 'lib/three/controls/TrackballControls',

    // THREE extras / helpers
    detector: 'lib/three/Detector',
    stats: 'lib/three/stats.min',
    ThreeBSP: 'lib/three/ThreeCSG.fd2c5a65ce',
  },

  shim: {
    reconnectingwebsocket: { exports: 'ReconnectingWebSocket' },

    threeCore: { exports: 'THREE' },
    TrackballControls: { deps: ['threeCore'], exports: 'THREE' },
    detector: { exports: 'Detector' },
    stats: { exports: 'Stats' },
    ThreeBSP: { exports: 'ThreeBSP' }
  },

  waitSeconds: 60
});



// Catch timeout errors & tell the user

requirejs.onError = function (err) {
  if (err.requireType === 'timeout') {
    // To do: better error, better handling.
    alert('Error: Load timeout. Please reload or check your connection.');
  }

  throw err;
};



// Let's kick off the application

require([
  'app/app'
], function(app){
  app.init();
});