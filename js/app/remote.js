define(['reconnectingwebsocket', 'lodash'],
function (ReconnectingWebSocket, _) {
  var ws;

  var remote = {
    init: function (host) {
      if (host === void 0) host = location.origin.replace(/^http/, 'ws');
      ws = new ReconnectingWebSocket(host);
      window.ws = ws;
    },

    getState: function(){
      // https://developer.mozilla.org/en-US/docs/Web/API/WebSocket#Ready_state_constants
      return ws.readyState;
    },

    onmessage: function (func) {
      console.log('remote.onmessage');
      ws.onmessage = func;
      /* ws.onmessage = function (e) {
        console.log('test onmessage', e);
      }; */
    },

    registerSelfAs: function (aType, extra) {
      var message = {register: aType};
      if (extra) _.merge(message, extra);

      ws.onopen = function(){
        console.log('Registering self as "' + aType + '"');
        remote.send(message);
      };
    },

    send: function(message){
      if (remote.getState() !== 1) {
        // Do nothing
        return;
      }

      if (typeof message === 'object') {
        message = JSON.stringify(message);
      }

      ws.send(message);
    }
  };

  return remote;
});