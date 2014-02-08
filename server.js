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

wss.on('connection', function(ws) {
  var id = (count++).toString();
  clients[id] = {
    ws: ws
  };

  console.log('websocket connection open, id=' + id);

  ws.on('message', function(data, flags) {
    console.log('received from id=' + id +', the following message: ' + data);
    var message = JSON.parse(data);
    if (message.register) {
      clients[id].type = message.register;
      console.log('Registered client id=' + id + ' as type=' + message.register);
    } else {
      wss.broadcast(data, id);
    }
  });

  ws.on('close', function() {
    console.log('websocket connection closed, id=' + id);
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