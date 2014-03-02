var WebSocketServer = require('ws').Server
  , http = require('http')
  , express = require('express')
  , app = express()
  , port = process.env.PORT || 5000;

app.use(express.static(__dirname + '/'));

var server = http.createServer(app);
server.listen(port);

console.log('http server listening on %d', port);

var wss = new WebSocketServer({server: server});
console.log('websocket server created');

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
    console.log('received from id=' + id +', the following message: ' + data);
    var message = JSON.parse(data);
    if (message.register) {
      clientTypeCounts[clients[id].type] -= 1;
      clients[id].type = message.register;
      clientTypeCounts[clients[id].type] = clientTypeCounts[clients[id].type] ? clientTypeCounts[clients[id].type] + 1 : 1;
      console.log('Registered client id=' + id + ' as type=' + message.register);
      ws.send(JSON.stringify({clientTypeCounts: clientTypeCounts}));
      console.log('Sent to client id=' + id + ' this message: ' + JSON.stringify({clientTypeCounts: clientTypeCounts}));
    } else {
      wss.broadcast(data, id);
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
      console.log('Broadcasting message to client id=' + id);
      console.log(broadcast_data);
      clients[id].ws.send(broadcast_data);
    }
  }
};