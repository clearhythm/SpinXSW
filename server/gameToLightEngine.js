var lightEngineAddon = require('../light_engine_addon/build/release/addon.node');
var lightEngine;
var lastFrame;
var sendFrameIntID;
var _ = require('./lib/lodash-2.4.1.min');
var animateContinously = false;
var dirty = true;
var dirtyDouble = false;
var useVirtual;
var wss;

var gameToLightEngine = {
  init: function (options) {
    lightEngine = new lightEngineAddon.LightEngine(7, 240);

    console.log('lightEngine.getNumPresets()', lightEngine.getNumPresets());

    if (options.animateContinously) {
      animateContinously = true;
    }

    if (options.useVirtual) {
      useVirtual = options.useVirtual;
      wss = options.wss;
    }

    // Todo: HACK
    setTimeout(function(){
      lightEngine.entDirect('autopreset', 0);
      lightEngine.clear();
      lightEngine.fillLights();
      gameToLightEngine.startSendingFrames();
    }, 5000);

    console.log('lightEngine created');
  },

  sendFrame: function(){
    if (animateContinously) {
      lightEngine.calcLights();
      if (useVirtual) {
        var msg = lightEngine.getLights();
        wss.broadcast( msg, -1 );
      }
    } else if (dirty || dirtyDouble) {
      lightEngine.calcLights();
      if (useVirtual) {
        var msg = lightEngine.getLights();
        wss.broadcast( msg, -1 );
      }
      console.log('gameToLightEngine.sendFrame: called lightEngine.calcLights');

      if (dirty) {
        dirty = false;
        dirtyDouble = true;
      } else {
        dirtyDouble = false;
      }
    }
  },

  startSendingFrames: function(){
    var frameInterval = 50;
    if (useVirtual) {
      frameInterval = 50;
    }
    gameToLightEngine.stopSendingFrames();
    sendFrameIntID = setInterval(gameToLightEngine.sendFrame, frameInterval);
  },

  stopSendingFrames: function(){
    if (sendFrameIntID !== void 0) {
      clearInterval(sendFrameIntID);
      sendFrameIntID = void 0;
    }
  },

  setLight: function (ring, position, color) {
    var r10 = Math.round(color.r * 1023 / 255);
    var g10 = Math.round(color.g * 1023 / 255);
    var b10 = Math.round(color.b * 1023 / 255);

    //console.log('gameToLightEngine.setLight: calling lightEngine.setLight', color, r10, g10, b10);
    lightEngine.setLight(ring, position, r10, g10, b10);

    dirty = true;
  },

  triggerPreset: function (presetNum) {
    lightEngine.addPresetNum(presetNum);
    console.log('gameToLightEngine.triggerPreset: called lightEngine.addPresetNum', presetNum);

    dirty = true;
  },

  addRain: function (entName) {
    lightEngine.entNew(entName, 'rain');
    lightEngine.setCurrentEnt(entName);
  },

  changeRainA: function (entName, aValue) {
    lightEngine.setCurrentEnt(entName);
    lightEngine.entDirect('A', aValue * 1023 / 1000);
  },

  changeRainB: function (entName, bValue) {
    lightEngine.setCurrentEnt(entName);
    lightEngine.entDirect('B', bValue * 1023 / 1000);
  }

};



exports.gameToLightEngine = gameToLightEngine;