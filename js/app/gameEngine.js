define(['app/remote', 'app/utils', 'lodash'],
function (remote, utils, _) {
  var defaultOptions = {
    config: '7,2',
    mode: 'auto', // 'auto', 'full', 'random', 'listen', 'listen2'
    lpr: 128 // Lights per ring
  };
  var o = {};
  var players = {};
  var cullIntervalID;
  var cullInterval = 15 * 1000; // remove players after 15 seconds of inactivity
  var gestureMapping = {
    'shake': 'changePlayerRing'
  };
  var lightEngine;
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
  var numOfRings;

  var gameEngine = {
    init: function () {
      var options, option;

      options = utils.getToObject();
      for (option in options) {
        options[option] = utils.stringToType(options[option]);
      }
      _.merge(o, defaultOptions, options);
      console.log('o', o);

      if (_.isNumber(o.config)) {
        numOfRings = o.config;
      } else {
        numOfRings = parseInt(o.config.split(',')[0]);
      }

      gameEngine.startLightEngine();

      window.listener2 = gameEngine.listener2; // temp, debugging
    },

    startLightEngine: function(){
      require(['app/threeInstallationMock'], function (threeInstallationMock) {
        lightEngine = threeInstallationMock;
        if (lightEngine.init()) {
          $('#installation_ui h1').hide();
          
          if (o.mode === 'listen') {
            remote.init();
            gameEngine.listen();
            remote.registerSelfAs('installation');
          } else if (o.mode === 'listen2') {
            remote.init();
            gameEngine.listen2();
            remote.registerSelfAs('installation');
          }
        }
      });
    },

    listen: function(){
      remote.onmessage(function (event) { // respond to node.js notifications coming back
        var message = JSON.parse(event.data);

        if (message.clients) {
          console.log('adding existing clients', message.clients);
          var i, l, client;
          for (i = 0, l = message.clients.length; i < l; i++) {
            client = message.clients[i];
            gameEngine.addNewPlayer('p' + client.id, {color: client.color});
          }
          return;
        }

        var senderID = message.senderID;
        var pName = 'p' + senderID;

        message.data = JSON.parse(message.data);

        if (!players[pName]) {
          console.log('onmessage', event, message);

          if (!message.data.color) {
            // todo, crude: ignoring, assuming it's a sensor message that raced ahead of the initial color message.
            console.log('ignoring');
            return;
          }

          gameEngine.addNewPlayer(pName, message.data);

          return;
        }

        var player = players[pName];
        var position = player.position;

        if (message.data.gesture !== void 0) {
          var gesture = message.data.gesture;
          if (typeof gameEngine[gestureMapping[gesture]] === 'function') {
            gameEngine[gestureMapping[gesture]](pName);
          } else {
          // todo: huh?
            console.error('Unknown gesture', gesture, typeof gesture);
            return;
          }
        } else {
          position = Math.floor(message.data / 360 * parseInt(o.lpr));
        }

        if (position !== player.position) {
          lightEngine.changePlayerPosition(pName, position);
          player.position = position;
        }

        // mark player as active (used by `cullIdlePlayers`)
        player.active = true;
      });
    },

    listen2: function(){
      remote.onmessage(gameEngine.listener2); // respond to node.js notifications coming back
    },

    listener2: function (event) {
      var startTime = Date.now();

      var msg = JSON.parse(event.data).data;
      if (msg === void 0 ) return;
      //console.log( 'Got ' + msg );

      var c = 0;
      var n = msg.length;
      var remaining;

      var lightsChanged = 0;

      while ( c < n ) {
        remaining = n - c;

        if ( ( remaining >= 15 ) && ( msg.substring( c, c + 2 ) == '#L' ) ) {
          // e.g. #L0078228028017 --> 0078, 228, 028, 017
          var l = parseInt( msg.substring( c + 2, c + 6 ) );
          var r = parseInt( msg.substring( c + 6, c + 9 ) );
          var g = parseInt( msg.substring( c + 9, c + 12 ) );
          var b = parseInt( msg.substring( c + 12, c + 15 ) );

          //console.log( 'Got Light ' + l + ', r=' + r + ', g=' + g + ', b=' + b );
          lightEngine.setLight( l, r, g, b );
          lightsChanged += 1;
          c += 15;
        } else if ( ( remaining >= 11 ) && ( msg.substring( c, c + 11 ) == '#F000000000' ) ) {
          // todo: support more colors?
          lightEngine.setAllLights( 0, 0, 0 );
          c += 11;
        } else if ( ( remaining >= 2 ) && ( msg.substring( c, c + 2 ) == '#D' ) ) {
          console.log( 'Got TERMINATE' );
          c += 2;
          break;
        } else if ( ( remaining >= 2 ) && ( msg.substring( c, c + 2 ) == '#N' ) ) {
          console.log( 'Got #N, terminating' );
          c += 2;
          break;
        } else if ( ( remaining >= 2 ) && ( msg.substring( c, c + 2 ) == '##' ) ) { // skip first of double pounds if any
          c += 1;
        } else {
          console.error('Huh?', msg.substring( c, c + 15 ));
          break;
        }
        //console.log( 'C=' + c + ', N=' + n + ', REM: ' + ( n - c ) );
      }

      console.log('lightsChanged', lightsChanged, 'took', Date.now() - startTime, 'ms');
    },

    addNewPlayer: function (pName, playerData) {
      var colorChoice = colorPallete[_.findIndex(colorPallete, {name: playerData.color})];
      if (colorChoice === void 0) {
        // todo: handle this
        console.error('Unknown color, assigning random', pName, playerData);
        colorChoice = _.sample(colorPallete);
      }

      if (typeof cullIntervalID === 'undefined') {
        // This is only fired once, when the first player is added
        cullIntervalID = window.setInterval(gameEngine.cullIdlePlayers, cullInterval);
      }

      var whichRing = _.random(numOfRings - 1);

      console.log('pName, colorChoice, whichRing', pName, colorChoice, whichRing);

      players[pName] = {
        position: 0,
        ring: whichRing,
        active: true
      };

      lightEngine.addNewPlayer(pName, whichRing, colorChoice);
    },

    changePlayerRing: function (pName) {
      var player = players[pName];

      var newRing = _.random(numOfRings - 2);
      if (newRing >= player.ring) newRing += 1;
      console.log('Changing rings: from ' + player.ring + ' to ' + newRing);

      player.ring = newRing;
      lightEngine.changePlayerRing(pName);
    },

    cullIdlePlayers: function () {
      var playerID, player;

      for (playerID in players) {
        player = players[playerID];
        if (player.active === false) {
          console.log('Culling idle player "' + playerID + '"');
          lightEngine.removePlayer(playerID);
          delete players[playerID];
        } else {
          player.active = false;
        }
      }
    }
  };

  return gameEngine;
});