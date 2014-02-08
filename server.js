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
  clients[id] = ws;

  console.log('websocket connection open, id=' + id);

  ws.on('message', function(data, flags) {
    console.log('received from id=' + id +', the following message: ' + data);
    wss.broadcast(data, id);
  });

  ws.on('close', function() {
    console.log('websocket connection closed, id=' + id);
    delete clients[id];
  });
});

wss.broadcast = function(data, senderID) {
  var broadcast_data = new Object();
  broadcast_data.data = data;
  broadcast_data.senderID = senderID;
  for (var i in clients) {
    if (i !== senderID) {
      console.log('Broadcasting message to client id=' + i);
      console.log(broadcast_data);
      clients[i].send(broadcast_data);
    }
  }
};