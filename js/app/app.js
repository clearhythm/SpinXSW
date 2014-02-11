define(['jquery', 'reconnecting-websocket', 'app/utils'],
function ($, ReconnectingWebSocket, utils) {
  var ws;
  var data_frequency = 1; // polling interval at which to send client device data, '1' sends all data, '10' would be send every 10th data point
  var num_lights = 18;
  var current_color = 'rgb(102,255,255)'; // aqua
  var light_increment = 360 / num_lights;
  var current_light, rotations, starting_angle;

  var app = {
    init: function(){
      app.openWebSocket();
      // Mobile Clients & Installation get different UIs and data logic
      if (utils.isMobile){
        // :: Mobile Logic
        app.initSwitcher('client');
        app.showClientUI();
        if (window.DeviceOrientationEvent) {
         // listen for device orientation changes
         window.addEventListener('deviceorientation', function(e) {
           var client_angle = e.alpha;
           if (client_angle !== null) {
             // normalize compass direction across devices
             if (typeof(window.starting_angle) === 'undefined') window.starting_angle = client_angle;
             var client_angle = Math.floor(Math.abs(client_angle - window.starting_angle));
             var client_angle = Math.abs(360 - client_angle); // flip orientation so angles go more positive as user rotates clockwise
             // send compass angle to node server, and update screen to reflect which way user is pointing
             app.sendSensorData(client_angle);
             app.updateScreenCoordinates(client_angle);
           } else {
             app.removeEventListener('deviceorientation', arguments.callee, false);
             app.fallback();
           }
         }, false);
        } else {
         app.fallback();
        }
      } else {
        // :: Installation Logic (& mock desktop light rig)
        app.initSwitcher('installation')
        app.showInstallationUI();
      }
    },

    initSwitcher: function (current_view) {
      app.setSwitcherLabel(current_view);
      $('.switcher button').click(function(e){
        var $span = $('#switcher_view');
        var new_view = $span.html();
        if (new_view == 'Client') {
          app.showClientUI();
          $span.html('Installation');
        } else {
          app.showInstallationUI();
          $span.html('Client');
        }
      });
    },

    openWebSocket: function(){
      var host = location.origin.replace(/^http/, 'ws');
      ws = new ReconnectingWebSocket(host);
    },

    setSwitcherLabel: function (current_view) {
      var new_view = (current_view == 'installation') ? 'Client' : 'Installation';
      $('#switcher_view').html(new_view);
    },

    showClientUI: function(){
      $('#installation_ui').hide();
      $('#client_ui').show();
      ws.onopen = function(){
        console.log('registering self as client');
        ws.send(JSON.stringify({register: 'client'}));
      };
    },

    showInstallationUI: function(){
      $('#client_ui').hide();
      $('#installation_ui').show();
      app.showLights();
      ws.onopen = function(){
        console.log('registering self as installation');
        ws.send(JSON.stringify({register: 'installation'}));
      };
    },

    // Mobile Client Functions
    fallback: function(){
      $('#client_ui h1').html('Sorry, your device is not supported!');
    },

    sendSensorData: function (deg) {
      ws.send(deg);
    },

    showCurrentAngle: function (deg) {
      $('#client_angle').html(deg);
    },

    showTotalArc: function (deg) {
      // TODO: need to do some math here to set a threshold: when deg goes from 340-360 to 0-20 (or vice versa) we keep adding to the arc
      var total_arc = deg;
      $('#arc').html(total_arc);
      return total_arc;
    },

    showTotalRotations: function (arc) {
      var rotations = Math.floor(arc/360);
      $('#rotations').html(rotations);
      return rotations;
    },

    updateScreenCoordinates: function (deg) {
      app.showCurrentAngle(deg);
      var arc = app.showTotalArc(deg);
      app.showTotalRotations(arc);
    },

    // Installation Functions
    showLights: function(){ // mock light rig for desktop testing of installation
      var i;
      // only add if they don't already exist
      if ($('#lights').length === 0) {
        $('#installation_ui').append('<div id="lights"></div>');
        var $lights = $('#lights');
        $lights.width(num_lights * 46); // note: '46' is a magic number which can be replaced with width + margin + border of each light
        for (i = 0; i < num_lights; i++) {
          $lights.append('<div class="light" id="light_' + i + '"></div>');
        }
        $('#light_0').append('<div class="led"></div>');
        $('.led').css('background-color', current_color);
        app.setLightsListener();
      }
    },

    setLightsListener: function(){
      if (typeof current_light === 'undefined') current_light = 0; // set first light to show
      ws.onmessage = function (event) { // respond to node.js notifications coming back
        var message = JSON.parse(event.data);
        if (window.location.search === '?verbose') {
          console.log('onmessage', event, message);
        }
        var degrees = parseInt(message.data);
        var active_light = Math.floor(degrees / light_increment);
        // for now, only update the lights if user moves into a new light quadrant
        if (active_light !== current_light) {
          current_light = active_light;
          $('.led').remove();
          $('#light_'+active_light).append('<div class="led"></div>');
          $('.led').css('background-color',current_color);
        }
      };
    }
  };

  return app;
});