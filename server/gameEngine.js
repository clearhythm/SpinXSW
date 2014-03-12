var gameToLightEngine = require('./gameToLightEngine').gameToLightEngine;
var wss;
var _ = require('./lib/lodash-2.4.1.min');
useVirtual = true;

var games = [
  { // 0: Move dot by alpha, shake to change rings
    // Currently needs older light engine
    animateContinously: false
  },
  { // 1: Trigger presets. tilt to select a preset, shake to trigger the selected preset.
    animateContinously: true
  },
  { // 2: Rain
    // Needs newer light engine
    animateContinously: true
  },
  { // 3: Move dot by alpha, shake to change rings, with fading trail
    // Currently needs older light engine
    animateContinously: true
  }
];
var whichGame = 1;
var gameOptions = games[whichGame];

var players = {};
var cullIntervalID;
var cullInterval = 15 * 1000; // remove players after 15 seconds of inactivity
var colorPallete = [
  {hue: 0,    name: 'red', r: 255, g: 0, b: 0},
  {hue: 0.30, name: 'green', r: 52, g: 255, b: 0},
  {hue: 0.66, name: 'blue', r: 0, g: 13, b: 255},
  {hue: 0.17, name: 'yellow', r: 251, g: 255, b: 0},
//   {hue: 0.48, name: 'teal'}, //, rgb: [, , ]
//   {hue: 0.83, name: 'pink'},
//   {hue: 0.09, name: 'orange'},
//   {hue: 0.76, name: 'purple'},
//   {hue: 0.54, name: 'light blue'}
];
var numOfRings = 7;

/*
3:
	5,6,7: with 2:~232 (2 over 3)
	22,23: with 1:215 (3 over 1)
	57: with 0:? & 6:?
*/

var intersections = [
  [ // Rings 0-5
    {
      positions: [5, 6, 7],
      intersects: [{
        ringOffset: -1,
        positions: [232]
      }]
    },
    {
      positions: [22, 23],
      intersects: [{
        ringOffset: -2,
        positions: [215]
      }]
    },
    {
      positions: [57, 58],
      intersects: [
        {
          ringOffset: -3,
          positions: [182, 183] // todo: confirm
        },
        {
          ring: 6,
          positions: [22, 23]
        }
      ]
    },
    {
      positions: [215],
      intersects: [{
        ringOffset: 2,
        positions: [22, 23]
      }]
    },
    {
      positions: [232],
      intersects: [{
        ringOffset: 1,
        positions: [5, 6, 7]
      }]
    },
  ],
  [ // Ring 6
    {
      positions: [],
    },
  ],
];

var gameEngine = {
  init: function (serverWss) {
    var options = {};

    if (gameOptions.animateContinously) {
      options.animateContinously = true;
    }

    wss = serverWss;

    if (useVirtual) {
      options.useVirtual = useVirtual;
      options.wss = wss;
    }

    gameToLightEngine.init(options);


    if (whichGame === 3) {
      setInterval(function(){
        var player, i, l, previousPosition, color;
        for (pName in players) {
          player = players[pName];
          for (i = 0, l = player.previousPositions.length; i < l; i++) {
            previousPosition = player.previousPositions[i];
            previousPosition.opacity -= 0.025;
            if (previousPosition.opacity <= 0) {
              // Set to black
              gameToLightEngine.setLight(previousPosition.ring, previousPosition.position, { r: 0, g: 0, b: 0});

              // Remove
              player.previousPositions.splice(i, 1);
              i--;
              l--;
            } else {
              color = gameEngine.fadeColor(player.color, previousPosition.opacity);
              console.log('faded color', player.color, previousPosition.opacity, color);
              gameToLightEngine.setLight(previousPosition.ring, previousPosition.position, color);
            }
          }
        }
      }, 250);
    }
  },

  respondToClient: function (pName, message) {
    if (whichGame === 0) {
      // Moving dot

      if (message.color !== void 0) {
        gameEngine.addNewPlayer0(pName, { color: message.color });
      } else if (message.alpha !== void 0) {
        gameEngine.movePlayer(pName, -1, Math.round(message.alpha * 239 / 359));
      } else if (message.intensityA !== void 0) {
        gameEngine.movePlayer(pName, -1, Math.round(message.intensityA * 239 / 1000));

      } else if (message.gesture !== void 0 && message.gesture === 'shake') {
        gameEngine.changePlayerRing(pName);
      } else {
        console.log('gameEngine.respondToClient: unknown message:', message);
      }
    } else if (whichGame === 1) {
      // Trigger presets

      if (players[pName] === void 0) {
        gameEngine.addNewPlayer1(pName);
      }
      var player = players[pName];

      if (message.intensityA !== void 0) {
        player.intensityA = message.intensityA;
      } else if (message.intensityB !== void 0) {
        player.intensityB = message.intensityB;
      } else if (message.gesture !== void 0 && message.gesture === 'shake') {
        console.log(player.intensityA, player.intensityB);
        var presetNum;
        if (player.intensityB < 500) {
          presetNum = 2;
       } else if (player.intensityA < 500) {
          presetNum = 0;
        } else {
          presetNum = 1;
        }

        gameToLightEngine.triggerPreset(presetNum);
      } else {
        console.log('gameEngine.respondToClient: unknown message:', message);
      }
    } else if (whichGame === 2) {
      // Rain

      if (players[pName] === void 0) {
        gameEngine.addNewPlayer2(pName);
      }
      var player = players[pName];

      if (message.intensityA !== void 0) {
        player.intensityA = message.intensityA;

        gameToLightEngine.changeRainA(player.intensityA);
      } else if (message.intensityB !== void 0) {
        player.intensityB = message.intensityB;

        gameToLightEngine.changeRainB(player.intensityB);
      } else {
        console.log('gameEngine.respondToClient: unknown message:', message);
      }
    } else if (whichGame === 3) {
      // Moving dot, with fading trail

      if (players[pName] === void 0) {
        gameEngine.addNewPlayer3(pName, { color: 'foo' });
      }
      var player = players[pName];

      if (message.alpha !== void 0) {
        gameEngine.movePlayer3(pName, -1, Math.round(message.alpha * 239 / 359));
      } else if (message.intensityA !== void 0) {
        gameEngine.movePlayer3(pName, -1, Math.round(message.intensityA * 239 / 1000));

      } else if (message.gesture !== void 0 && message.gesture === 'shake') {
        gameEngine.changePlayerRing(pName);
      } else {
        console.log('gameEngine.respondToClient: unknown message:', message);
      }
    }
  },

  // GAME 0

  addNewPlayer0: function (pName, playerData) {
    var colorChoice = colorPallete[_.findIndex(colorPallete, {name: playerData.color})];
    if (colorChoice === void 0) {
      // todo: handle this
      console.error('Unknown color, assigning random', pName, playerData);
      colorChoice = _.sample(colorPallete);
    }

    //if (typeof cullIntervalID === 'undefined') {
    //  // This is only fired once, when the first player is added
    //  cullIntervalID = setInterval(gameEngine.cullIdlePlayers, cullInterval);
    //}

    var whichRing = _.random(numOfRings - 1);

    console.log('pName, colorChoice, whichRing', pName, colorChoice, whichRing);

    players[pName] = {
      position: 35,
      ring: whichRing,
      active: true,
      color: colorChoice
    };

    console.log('addNewPlayer0 gameToLightEngine.setLight', whichRing, 35, colorChoice);
    gameToLightEngine.setLight(whichRing, 35, colorChoice);
  },

  movePlayer: function (pName, newRing, newPosition) {
    var player = players[pName];

    if (player === void 0) return;

    if (newRing === -1) {
      newRing = player.ring;
    }

    if (player.ring === newRing && player.position === newPosition) {
      // Do nothing
      return;
    }

    // remove previous dot
    gameToLightEngine.setLight( player.ring, player.position, { r: 0, g: 0, b: 0} );

    // update position
    player.ring = newRing;
    player.position = newPosition;

    // draw new dot
    console.log('movePlayer gameToLightEngine.setLight', player.ring, player.position, player.color);
    gameToLightEngine.setLight( player.ring, player.position, player.color );
  },

  changePlayerRing: function (pName) {
    var player = players[pName];

    var newRing = _.random(numOfRings - 2);
    if (newRing >= player.ring) newRing += 1;
    console.log('Changing rings: from ' + player.ring + ' to ' + newRing);

    gameEngine.movePlayer(pName, newRing, player.position);
  },

  // GAME 1

  addNewPlayer1: function (pName) {
    players[pName] = {
      intensityA: 50,
      intensityB: 50,
      active: true
    };
  },

  cullIdlePlayers: function () {
    var playerID, player;

    for (playerID in players) {
      player = players[playerID];
      if (player.active === false) {
        console.log('Culling idle player "' + playerID + '"');
        gameToLightEngine.setLight( player.ring, player.position, { r: 0, g: 0, b: 0} );
        delete players[playerID];
      } else {
        player.active = false;
      }
    }
  },

  // GAME 2

  addNewPlayer2: function (pName) {
    players[pName] = {
      intensityA: 50,
      intensityB: 50,
      active: true
    };

    gameToLightEngine.addRain(pName);
  },

  // GAME 3

  addNewPlayer3: function (pName, playerData) {
    var colorChoice = colorPallete[_.findIndex(colorPallete, {name: playerData.color})];
    if (colorChoice === void 0) {
      // todo: handle this
      console.error('Unknown color, assigning random', pName, playerData);
      colorChoice = _.sample(colorPallete);
    }

    //if (typeof cullIntervalID === 'undefined') {
    //  // This is only fired once, when the first player is added
    //  cullIntervalID = setInterval(gameEngine.cullIdlePlayers, cullInterval);
    //}

    var whichRing = _.random(numOfRings - 1);

    console.log('pName, colorChoice, whichRing', pName, colorChoice, whichRing);

    players[pName] = {
      position: 35,
      ring: whichRing,
      active: true,
      color: colorChoice,
      previousPositions: []
    };

    console.log('addNewPlayer0 gameToLightEngine.setLight', whichRing, 35, colorChoice);
    gameToLightEngine.setLight(whichRing, 35, colorChoice);
  },

  movePlayer3: function (pName, newRing, newPosition) {
    var player = players[pName];

    if (player === void 0) return;

    if (newRing === -1) {
      newRing = player.ring;
    }

    if (player.ring === newRing && player.position === newPosition) {
      // Do nothing
      return;
    }

    // Set previous position to black
    gameToLightEngine.setLight(player.ring, player.position, { r: 0, g: 0, b: 0});

    // make previous position a fading dot
    player.previousPositions.push({ring: player.ring, position: player.position, opacity: 0.25});

    // destroy any fading dots under new position
    // todo: and between previous and current position?
    var aPlayer, i, l, aPreviousPosition, color;
    for (pName in players) {
      aPlayer = players[pName];
      for (i = 0, l = aPlayer.previousPositions.length; i < l; i++) {
        aPreviousPosition = aPlayer.previousPositions[i];
        if (aPreviousPosition.ring === newRing && aPreviousPosition.position === newPosition) {
          // Remove
          aPlayer.previousPositions.splice(i, 1);
          i--;
          l--;
        }
      }
    }

    // update position
    player.ring = newRing;
    player.position = newPosition;

    // draw new dot
    console.log('movePlayer gameToLightEngine.setLight', player.ring, player.position, player.color);
    gameToLightEngine.setLight( player.ring, player.position, player.color );
  },

  fadeColor: function (color, opacity) {
    var newColor = {};

    newColor.r = color.r * opacity;
    newColor.g = color.g * opacity;
    newColor.b = color.b * opacity;

    return newColor;
  },

};



exports.gameEngine = gameEngine;