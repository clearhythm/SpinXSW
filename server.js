var http = require('http')
  , express = require('express')
  , app = express()
  , port = process.env.PORT || 5000
  , gameEngine = require('./server/gameEngine').gameEngine;
  // Note: there are two require calls below

app.use(express.static(__dirname + '/'));
var server = http.createServer(app);
server.listen(port);
console.log('http server listening on %d', port);

var wsURL = process.argv[2];

if (!wsURL || !wsURL.substring || wsURL.substring(0, 5) !== 'ws://') {
  console.log('No websocket server URL provided, running as a websocket server.');

  var WebSocketServer = require('ws').Server;

  var wss = new WebSocketServer({server: server});
  console.log('websocket server created');

  gameEngine.init(wss);
  console.log('gameEngine initialized');

  var count = 0;
  var clients = {};
  var clientTypeCounts = {unknown: 0};

  wss.on('connection', function(ws) {
    var id = (count++).toString();
    clients[id] = {
      type: 'unknown',
      ws: ws
    };
    clientTypeCounts.unknown += 1;

    console.log('websocket connection open, id=' + id);

    ws.on('message', function(data, flags) {
      //console.log('received from id=' + id +', the following message: ' + data);
      var message = JSON.parse(data);

      if (message.register) {
        clientTypeCounts[clients[id].type] -= 1;
        clients[id].type = message.register;
        clientTypeCounts[clients[id].type] = clientTypeCounts[clients[id].type] ? clientTypeCounts[clients[id].type] + 1 : 1;
        console.log('Registered client id=' + id + ' as type=' + message.register);

        if (clients[id].type === 'client') {
          if (message.color) {
            clients[id].color = message.color;
          }

          // Used by clients to determine if an installation is "listening" or not
          ws.send(JSON.stringify({clientTypeCounts: clientTypeCounts}));
        } else if (clients[id].type === 'installation') {
          // Used by installations to add existing clients to the "game"
          var clientList = [], i;
          for (i in clients) {
            if (clients[i].type === 'client') {
              console.log('client.color', clients[i].color);
              clientList.push({id: i, color: clients[i].color});
            }
          }
          ws.send(JSON.stringify({ clients: clientList }));
        }
      } else {
        gameEngine.respondToClient('p' + id, message);
      }
    });

    ws.on('close', function() {
      console.log('websocket connection closed, id=' + id);
      clientTypeCounts[clients[id].type] -= 1;
      delete clients[id];
    });
  });

  wss.broadcast = function(data, senderID) {
    var broadcast_data = JSON.stringify({
      data: data,
      senderID: senderID
    });
    for (var id in clients) {
      if (clients[id].type && clients[id].type === 'installation' && id !== senderID) {
        //console.log('Broadcasting message to client id=' + id);
        //console.log(broadcast_data);
        clients[id].ws.send(broadcast_data);
      }
    }
  };
} else {
  console.log('Running as a websocket client, websocket server URL is', wsURL);

  var WebSocketClient = require('faye-websocket').Client;

  var ws = new WebSocketClient(wsURL);
  console.log('websocket client initialized');

  gameEngine.init({});
  console.log('gameEngine initialized');

  ws.on('open', function(event) {
    console.log('ws open');
    ws.send(JSON.stringify({register: 'installation'}));
  });
  ws.on('error', function (e) {
    console.error('ws error', e);
  });
  ws.on('close', function(event) {
    console.log('ws close', event.code, event.reason);
    ws = null;
  });
  ws.on('message', function(event) {
    var data = JSON.parse(event.data);

    if (data.data === void 0) {
      console.erroe('Ignoring unsupported message', data);
      return;
    }

    var message = JSON.parse(data.data);
    var senderID = data.senderID;

    gameEngine.respondToClient('p' + senderID, message);
  });
}