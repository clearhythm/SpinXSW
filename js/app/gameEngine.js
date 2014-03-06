define(['app/remote', 'app/utils', 'lodash'],
function (remote, utils, _) {
  var defaultOptions = {
    config: 3,
    mode: 'auto', // 'auto', 'full', 'random', 'listen'
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