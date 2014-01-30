// -------------------------------------
// SpinXSW
// :: Interactive Lighting Installation
// -------------------------------------
//
// Set Global Vars
var ws;
var isMobile = navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry)/) || false;
var data_frequency = 1; // polling interval at which to send client device data, '1' sends all data, '10' would be send every 10th data point
// 
var num_lights = 8;
var current_light = 0;
var current_color = 'rgb(0,255,255)'; // aqua
var rotations, starting_angle;

// Universal Functions
var init = function(){
	openWebSocket();
	initSwitcher();
	// Mobile Clients & Installation get different UIs and data logic
	if (isMobile){
		// :: Mobile Logic
    showClientUI();
		if (window.DeviceOrientationEvent) {
			// listen for device orientation changes
			window.addEventListener('deviceorientation', function(e) {
				var client_angle = e.alpha;
				if (client_angle != null) {
					// if compass direction is available, send data to node server, and update screen to reflect which way user is pointing
					if (typeof(window.starting_angle) == "undefined") window.starting_angle = deg;
					client_angle = client_angle - window.starting_angle;
					sendSensorData(client_angle);
					updateScreenCoordinates(client_angle);
				}
				else {
					this.removeEventListener('deviceorientation',arguments.callee,false);
					fallback();
				}
			}, false);
		} else {
			fallback();
		}
	} else { 
		// :: Installation Logic (& mock desktop light rig)
    showInstallationUI();
		$(document).ready(function(){
			showMockLightRig();
			ws.onmessage = function (event) { // respond to node.js notifications coming back
				console.log('onmessage', event);
			};
		});
	}
}

var initSwitcher = function(){
  $(document).ready(function(){
    $('.switcher button').click(function(e){
      var $span = $(this).find('span');
      var my_view = $span.data('view');
      if (my_view == 'client') {
        $('#client_ui').hide();
        $('#installation_ui').show();
        $span.data('view', 'installation');
      } else {
        $('#installation_ui').hide();
        $('#client_ui').show();
        $span.data('view', 'client');
      }
      console.log(my_view);
    });
  });
}

var openWebSocket = function(){
	var host = location.origin.replace(/^http/, 'ws');
	ws = new ReconnectingWebSocket(host);
};

var showClientUI = function(){
  $('#installation_ui').hide();
  $('#client_ui').show();
  $('.switcher button span').data('view', 'installation');
  $('.switcher button span').html('installation');
}

var showInstallationUI = function(){
  $('#client_ui').hide();
  $('#installation_ui').show();
  $('.switcher button span').data('view', 'client');
  $('.switcher button span').html('client');
}

// Mobile Client Functions
var fallback = function(){
	$('#client_ui').html('<h2>Sorry, your device is not supported!</h2>');
}

var sendSensorData = function(deg) {
	ws.send(deg);
}

var showCurrentAngle = function(deg){
	$('#client_angle').html(deg);
}

var showTotalArc = function(deg){
	// TODO: need to do some math here to set a threshold: when deg goes from 340-360 to 0-20 (or vice versa) we keep adding to the arc
	var total_arc = deg;
	$('#arc').html(total_arc);
	return total_arc;
}

var showTotalRotations = function(arc){
	rotations = Math.floor(arc/360);
	$('#rotations').html(rotations);
	return rotations;
}

var updateScreenCoordinates = function(deg) {
	showCurrentAngle(deg);
	var arc = showTotalArc(deg);
	showTotalRotations(arc);
}

// Installation Functions
var drawLights = function(num_lights){
	var $lights = $('#lights');
	$lights.width(num_lights*46); // note: '46' is a magic number which can be replaced with width + margin + border of each light
	for (var i=0;i<num_lights;i++) {
		$lights.append('<div class="light" id="light_'+i+'"></div>');
	}
}

var showMockLightRig = function(){
	$('#client_ui').hide();
	$('#installation_ui').show();
	drawLights(num_lights); // mock light rig for desktop browser mode
}

// Init
init();