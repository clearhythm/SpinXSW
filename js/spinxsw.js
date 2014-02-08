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
var num_lights = 18;
var current_color = 'rgb(102,255,255)'; // aqua
var light_increment = 360 / num_lights;
var current_light, rotations, starting_angle;

// Universal Functions
var init = function(){
	openWebSocket();
	// Mobile Clients & Installation get different UIs and data logic
  $(document).ready(function(){
  	if (isMobile){
  		// :: Mobile Logic
    	initSwitcher('client');
      showClientUI();
      if (window.DeviceOrientationEvent) {
       // listen for device orientation changes
       window.addEventListener('deviceorientation', function(e) {
         var client_angle = e.alpha;
         if (client_angle != null) {
           // normalize compass direction across devices
           if (typeof(window.starting_angle) == "undefined") window.starting_angle = client_angle;
           var client_angle = Math.floor(Math.abs(client_angle - window.starting_angle));
           var client_angle = Math.abs(360 - client_angle); // flip orientation so angles go more positive as user rotates clockwise
           // send compass angle to node server, and update screen to reflect which way user is pointing
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
      initSwitcher('installation')
      showInstallationUI();
  	}
  });
}

var initSwitcher = function(current_view){
  setSwitcherLabel(current_view);
  $('.switcher button').click(function(e){
    var $span = $('#switcher_view');
    var new_view = $span.html();
    if (new_view == 'Client') {
      showClientUI();
      $span.html('Installation');
    } else {
      showInstallationUI();
      $span.html('Client');
    }
  });
}

var openWebSocket = function(){
	var host = location.origin.replace(/^http/, 'ws');
	ws = new ReconnectingWebSocket(host);
};

var setSwitcherLabel = function(current_view){
  var new_view = (current_view == 'installation') ? 'Client' : 'Installation';
  $('#switcher_view').html(new_view);
}

var showClientUI = function(){
  $('#installation_ui').hide();
  $('#client_ui').show();
}

var showInstallationUI = function(){
  $('#client_ui').hide();
  $('#installation_ui').show();
	showLights();
}

// Mobile Client Functions
var fallback = function(){
	$('#client_ui h1').html('Sorry, your device is not supported!');
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
var showLights = function(){ // mock light rig for desktop testing of installation
  // only add if they don't already exist
	if ($('#lights').length == 0) {
	  $('#installation_ui').append('<div id="lights"></div>');
    var $lights = $('#lights');
  	$lights.width(num_lights*46); // note: '46' is a magic number which can be replaced with width + margin + border of each light
  	for (var i=0;i<num_lights;i++) {
  		$lights.append('<div class="light" id="light_'+i+'"></div>');
  	}
    $('#light_0').append('<div class="led"></div>');
    $('.led').css('background-color',current_color);
    setLightsListener();
  }
}

var setLightsListener = function(){
  if (typeof(current_light) == "undefined") current_light = 0; // set first light to show
  ws.onmessage = function (event) { // respond to node.js notifications coming back
   // console.log('onmessage', event);
   var degrees = event.broadcast_data.data;
   console.log('event data', event.broadcast_data);
   active_light = Math.floor(degrees / light_increment);
   // for now, only update the lights if user moves into a new light quadrant
   if (active_light != current_light) {
     current_light = active_light;
     $('.led').remove();
     $('#light_'+active_light).append('<div class="led"></div>');
     $('.led').css('background-color',current_color);
   }
  };
}

// Init
init();