var events = require('events')
  , PixelPusher = require('./pixelpusher')
  , WebSocket = require('faye-websocket');

var wsURL = process.argv[2];

if (!wsURL || !wsURL.substring || wsURL.substring(0, 5) !== 'ws://') {
  console.log('websocket server URL must be provided, e.g. `node server.js ws://still-beyond-4935.herokuapp.com`');
  process.exit(1);
} else {
  console.log('ws server:', wsURL);
}

var eventEmitter = new events.EventEmitter();

var ws = new WebSocket.Client(wsURL);

ws.on('open', function(event) {
  console.log('ws open');
});

ws.on('message', function(event) {
  console.log('ws message', event.data);
  eventEmitter.emit('newAngle', parseInt(event.data));
});

ws.on('error', function (e) {
  console.log('ws error', e);
});

ws.on('close', function(event) {
  console.log('ws close', event.code, event.reason);
  ws = null;
});

new PixelPusher().on('discover', function(controller) {
  var timer = null;

  console.log('discover: ' + JSON.stringify(controller.params.pixelpusher));

  controller.on('update', function() {
    console.log ({ updatePeriod  : this.params.pixelpusher.updatePeriod
                 , deltaSequence : this.params.pixelpusher.deltaSequence
                 , powerTotal    : this.params.pixelpusher.powerTotal
                 });
  }).on('timeout', function() {
    console.log('controller ' + controller.params.ipAddress + ' (' + controller.params.macAddress + '): timeout');

    if (!!timer) clearInterval(timer);
  });

  eventEmitter.on('newAngle', function(angle){
    var pixels = controller.params.pixelpusher.pixelsPerStrip;
    var targetPixel = Math.round(pixels * angle / 360);

    console.log('newAngle, targetPixel', angle, targetPixel);

    var r, g, b;

    var i, j, strips;

    strips = [];
    strips[0] = { number: 0, data: new Buffer(3 * controller.params.pixelpusher.pixelsPerStrip) };
    strips[0].data.fill(0x00);
    for (i = 0; i < controller.params.pixelpusher.pixelsPerStrip; i += 1) {
      j = i * 3;
      if (i === targetPixel) {
        r = g = b = 255;
      } else {
        r = g = b = 0;
      }
      strips[0].data[j]   = r;
      strips[0].data[j+1] = g;
      strips[0].data[j+2] = b;
    }
   
    controller.refresh(strips);
  });
}).on('error', function(err) {
  console.log('oops: ' + err.message);
});