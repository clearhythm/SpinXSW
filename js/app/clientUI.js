// TODO: clients don't know when they've been disconnected due to timeout

define(['jquery', 'shake', 'app/remote'],
function ($, shake, remote) {
  var data_frequency = 1; // todo: polling interval at which to send client device data, '1' sends all data, '10' would be send every 10th data point
  var total_arc;
  var colorPallete = [
    {hue: 0,    name: 'red'},
    {hue: 0.30, name: 'green'},
    {hue: 0.66, name: 'blue'},
    {hue: 0.17, name: 'yellow'},
    {hue: 0.48, name: 'teal'},
    {hue: 0.83, name: 'pink'},
    {hue: 0.09, name: 'orange'},
    {hue: 0.76, name: 'purple'},
    {hue: 0.54, name: 'light blue'}
  ];
  var playerColor;
  var score = 0;
  var lastAngle;

  var clientUI = {
    init: function(){
      if (window.DeviceOrientationEvent) {
        remote.init();

        remote.onmessage(function (event) {
          var message = JSON.parse(event.data);

          console.log('onmessage', event, message);

          if (message.clientTypeCounts) {
            if (message.clientTypeCounts.installation > 0) {
              clientUI.pickColor();
            } else {
              clientUI.fallback(2);
            }
          }
        });

        remote.registerSelfAs('client');
      } else {
        clientUI.fallback(0);
      }
    },

    fallback: function (which) {
      var messages = [
        'Sorry, your device is not supported! [0]',
        'Sorry, your device is not supported! [1]',
        'The installation is currently offline. [2]'
      ];
      $('#client_ui h1').html(messages[which]);
    },

    pickColor: function(){
      var i, l;
      $('#client_ui').append('<div class="colorPicker"></div>');
      for (i = 0, l = colorPallete.length; i < l; i++) {
        $('#client_ui .colorPicker').append('<button name="' + colorPallete[i].name + '" style="background: hsl(' + Math.round(colorPallete[i].hue * 360) + ', 100%, 50%)"></button>');
      }
      $('#client_ui .colorPicker button').on('click', function(){
        $('.colorPicker').remove();
        $('.score').show();
        playerColor = $(this).attr('name');
        remote.send({ color: playerColor });

        // todo: this overwrites the first, or are there two now?
        remote.registerSelfAs('client', {color: playerColor});

        clientUI.listenSensors();
      });
    },

    listenSensors: function(){
      // listen for device orientation changes
      window.addEventListener('deviceorientation', clientUI.eventListener, false);

      window.addEventListener('shake', function(){
        clientUI.sendGesture('shake');
        $('#last-gesture').clearQueue().stop().hide(0).html('<h2 class="achievement">Shake it up!</h2>').fadeIn().delay(3000).fadeOut(6000);
        clientUI.changeScore(50);
      }, false);
    },

    changeScore: function (change) {
      score += change;
      $('#score').text(score);
    },

    eventListener: function (e) {
      var angleAlpha = e.alpha;
      if (typeof angleAlpha === 'number') {
        angleAlpha = Math.round(angleAlpha);

        if (angleAlpha !== lastAngle) {
          // send compass angle to node server, and update screen to reflect which way user is pointing
          clientUI.sendSensorData(angleAlpha);
          clientUI.updateScreenCoordinates(angleAlpha);
          lastAngle = angleAlpha;
        }
      } else {
        this.removeEventListener('deviceorientation', clientUI.eventListener, false);
        clientUI.fallback(1);
      }
    },

    sendGesture: function (name) {
      remote.send({gesture: name});
    },

    sendSensorData: function (deg) {
      remote.send(deg);
    },

    showCurrentAngle: function (deg) {
      $('#client_angle').html(deg);
    },

    showTotalArc: function (deg) {
      // TODO: need to do some math here to set a threshold: when deg goes from 340-360 to 0-20 (or vice versa) we keep adding to the arc
      total_arc += deg;
      $('#arc').html(total_arc);
      return total_arc;
    },

    showTotalRotations: function (arc) {
      var rotations = Math.floor(arc / 360);
      $('#rotations').html(rotations);
      return rotations;
    },

    updateScreenCoordinates: function (deg) {
      clientUI.showCurrentAngle(deg);
      var arc = clientUI.showTotalArc(deg);
      clientUI.showTotalRotations(arc);
    }
  };

  return clientUI;
});