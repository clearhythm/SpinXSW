define(['jquery', 'app/remote'],
function ($, remote) {
  var numLights = 18;
  var currentColor = 'rgb(102,255,255)'; // aqua
  var lightIncrement = 360 / numLights;
  var currentLight;

  var simpleInstallationMock = {
    showLights: function(){
      var i;

      // only add if they don't already exist
      if ($('#lights').length === 0) {
        $('#installation_ui').append('<div id="lights"></div>');
        var $lights = $('#lights');
        $lights.width(numLights * 46); // note: '46' is a magic number which can be replaced with width + margin + border of each light
        for (i = 0; i < numLights; i++) {
          $lights.append('<div class="light" id="light_' + i + '"></div>');
        }
        $('#light_0').append('<div class="led"></div>');
        $('.led').css('background-color', currentColor);
        simpleInstallationMock.setLightsListener();
      }
    },

    setLightsListener: function(){
      if (typeof currentLight === 'undefined') currentLight = 0; // set first light to show

      remote.onmessage(function (event) { // respond to node.js notifications coming back
        var message = JSON.parse(event.data);
        if (window.location.search === '?verbose') {
          console.log('onmessage', event, message);
        }
        var degrees = parseInt(message.data);
        var active_light = Math.floor(degrees / lightIncrement);
        // for now, only update the lights if user moves into a new light quadrant
        if (active_light !== currentLight) {
          currentLight = active_light;
          $('.led').remove();
          $('#light_' + active_light).append('<div class="led"></div>');
          $('.led').css('background-color', currentColor);
        }
      });
    }
  };

  return simpleInstallationMock;
});