require.config({
  paths: {
    jquery: ['//ajax.googleapis.com/ajax/libs/jquery/2.1.0/jquery.min', 'lib/jquery-2.1.0.min'],
    reconnectingwebsocket: 'lib/reconnecting-websocket.e86719bb55',
  },

  shim: {
    reconnectingwebsocket: { exports: 'ReconnectingWebSocket' }
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