define(['jquery', 'app/remote'],
function ($, remote) {
  var data_frequency = 1; // todo: polling interval at which to send client device data, '1' sends all data, '10' would be send every 10th data point
  var total_arc;

  var clientUI = {
    init: function(){
      if (window.DeviceOrientationEvent) {
       // listen for device orientation changes
       window.addEventListener('deviceorientation', function(e) {
         var client_angle = e.alpha;
         if (client_angle !== null) {
           client_angle = Math.round(client_angle);
           // normalize compass direction across devices
           //if (typeof(window.starting_angle) === 'undefined') window.starting_angle = client_angle;
           //var client_angle = Math.floor(Math.abs(client_angle - window.starting_angle));
           //var client_angle = Math.abs(360 - client_angle); // flip orientation so angles go more positive as user rotates clockwise
           // send compass angle to node server, and update screen to reflect which way user is pointing
           clientUI.sendSensorData(client_angle);
           clientUI.updateScreenCoordinates(client_angle);
         } else {
           this.removeEventListener('deviceorientation', arguments.callee, false);
           clientUI.fallback();
         }
       }, false);
      } else {
       clientUI.fallback();
      }
    },

    fallback: function(){
      $('#client_ui h1').html('Sorry, your device is not supported!');
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