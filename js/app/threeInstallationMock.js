// todo: make sure all ".clones()" are necessary, and faster than just recreating geometry (probably)

define(['detector', 'app/three/container', 'three', 'app/three/camera', 'app/three/controls', 'app/three/geometry', 'app/three/light', 'app/three/material', 'app/three/renderer', 'app/three/scene', 'lib/three/stats.min', 'app/remote', 'app/utils', 'lodash'],
function (Detector, container, THREE, camera, controls, geometry, light, material, renderer, scene, stats, remote, utils, _) {
  var allOptions = {
    configs: ['2', '3', '3,1', '3,2(s)', '4', '4,1', '4,2(s)', '5', '5,1', '6', '6,1', '6,2', '7', '7,1', '7,2', '8', '8,1', '8,2', '8,3', '8,4', '8,5', '9', '9,1', '16'],
    modes: ['auto', 'full', 'random', 'listen'],
    //lprs: {min: 2, max: 960},
    sss: ['soft', 'star'],
  };
  var o = {
    config: '3',
    mode: 'auto', // 'auto', 'full', 'random', 'listen'
    lpr: 128, // Lights per ring
    ss: 'soft', // sprite style: 'soft', 'star',
    cover: false, // light cover
    lightOnly: false // no sprite
  };
  var ringRadius = 59;
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
  var rings = [];
  var ringMeshes = new THREE.Object3D();
  var circles = [];
  var coloredLights = new THREE.Object3D();
  var counter = 0;
  var counterMax;
  var totalCounter = 0;
  var players = {};
  var verbose = (window.location.search.search('verbose') !== -1);
  var stats;
  var spriteMesh;
  var cullIntervalID;
  var cullInterval = 5 * 1000; // remove players after 5 seconds of inactivity

  var threeInstallationMock = {
    stats: null,

    init: function () { // todo: this method is too big!
      var options, ringMesh, circleGeometry, circle, arrangement, i, l, ring, j, m;

      if (!Detector.webgl) {
        container.innerHTML = '<h2>Having WebGL problems? I feel bad for you.</h2>';
        return;
      }

      options = utils.getToObject();
      _.merge(o, options);
      console.log('o', o);

      // LIGHTS

      light.addDirectional();
      light.addAmbient();

      // RINGS

      ringMesh = new THREE.Mesh(geometry.makeRing(), material.whitePlastic);

      circleGeometry = geometry.makeCircle({ segments: parseInt(o.lpr) });
      circle = new THREE.Line(circleGeometry, material.line);
      circle.rotation.x = Math.PI / 2;
      circle.visible = false;
      counterMax = circle.geometry.vertices.length;
      ringMesh.add(circle); // .clone()?

      if (o.cover) { // todo
        var torusMesh = new THREE.Mesh(geometry.makeTorus(), material.frostedPlastic);
        torusMesh.rotation.x = Math.PI / 2;
        ringMesh.add(torusMesh); // .clone()?
      }

      numOfRings = parseInt(o.config.split(',')[0]);
      arrangement = o.config.split(',')[1];
      if (typeof arrangement === 'undefined') {
        arrangement = 0;
      } else {
        arrangement = parseInt(arrangement);
      }

      for (i = 0, l = numOfRings; i < l; i++) {
        ring = ringMesh.clone();

        ring.position.y = 0; // todo: needed?
        ring.rotation.y = 0; // todo: needed?
        ring.overdraw = true; // todo: needed?
        ring.doubleSided = true; // todo: needed?

        rings.push(ring);
        ringMeshes.add(ring);
        circles.push(ring);
      }

      if (arrangement === 0) {
        threeInstallationMock.arrangeRingsRadially();
      } else if (numOfRings === 3) {
        if (arrangement === 1) {
          ringMeshes.children[1].rotation.x = Math.PI * 1 / 2;
          ringMeshes.children[2].rotation.z = Math.PI * 1 / 2;
        } else { // 2
          ringMeshes.children[1].rotation.x = Math.PI * 1 / 3;
          ringMeshes.children[1].position.x = 0.5;
          ringMeshes.children[2].rotation.x = Math.PI * 2 / 3;
          ringMeshes.children[2].position.x = -0.5;
        }
      } else if (numOfRings === 4) {
        if (arrangement === 1) {
          ringMeshes.children[1].rotation.x = Math.PI * 1 / 3;
          ringMeshes.children[2].rotation.x = Math.PI * 2 / 3;
          ringMeshes.children[3].rotation.z = Math.PI * 1 / 2;
        } else { // 2
          ringMeshes.children[1].rotation.x = Math.PI * 1 / 4;
          ringMeshes.children[1].position.x = 0.5;
          ringMeshes.children[2].rotation.x = Math.PI * 2 / 4;
          ringMeshes.children[2].position.x = -0.5;
          ringMeshes.children[3].rotation.x = Math.PI * 3 / 4;
          ringMeshes.children[3].position.x = 1;
        }
      } else if (numOfRings === 5) {
        // 1
        ringMeshes.children[1].rotation.x = Math.PI * 1 / 2;
        ringMeshes.children[2].rotation.z = Math.PI * 1 / 2;
        ringMeshes.children[3].rotation.z = Math.PI * 1 / 2;
        ringMeshes.children[3].rotation.z = Math.PI * 1 / 4;
        ringMeshes.children[4].rotation.z = Math.PI * 1 / 2;
        ringMeshes.children[4].rotation.z = Math.PI * 3 / 4;
      } else if (numOfRings === 6) {
        if (arrangement === 1 || arrangement === 2) {
          ringMeshes.children[1].rotation.x = Math.PI * 1 / 3;
          ringMeshes.children[2].rotation.x = Math.PI * 2 / 3;
          var ringGroup = new THREE.Object3D();
          ringMeshes.remove(rings[3]);
          ringMeshes.remove(rings[4]);
          ringMeshes.remove(rings[5]);
          ringGroup.add(rings[3]);
          ringGroup.add(rings[4]);
          ringGroup.add(rings[5]);
          ringMeshes.add(ringGroup);
          ringMeshes.children[3].children[1].rotation.x = Math.PI * 1 / 3;
          ringMeshes.children[3].children[2].rotation.x = Math.PI * 2 / 3;
          ringGroup.rotation.z = Math.PI * 1 / 2;

          if (arrangement === 2) {
            ringGroup.scale = new THREE.Vector3(0.9, 0.9, 0.9);
          }
        }
      } else if (numOfRings === 7) {
        if (arrangement === 1) {
          ringMeshes.children[1].rotation.x = Math.PI * 1 / 4;
          ringMeshes.children[2].rotation.x = Math.PI * 2 / 4;
          ringMeshes.children[3].rotation.x = Math.PI * 3 / 4;
          var ringGroup = new THREE.Object3D();
          ringMeshes.remove(rings[4]);
          ringMeshes.remove(rings[5]);
          ringMeshes.remove(rings[6]);
          ringGroup.add(rings[4]);
          ringGroup.add(rings[5]);
          ringGroup.add(rings[6]);
          ringMeshes.add(ringGroup);
          ringMeshes.children[4].children[1].rotation.x = Math.PI * 1 / 4;
          ringMeshes.children[4].children[2].rotation.x = Math.PI * 3 / 4;
          ringGroup.rotation.z = Math.PI * 1 / 2;
        } else { // 2
          ringMeshes.children[1].rotation.x = Math.PI * 1 / 3;
          ringMeshes.children[2].rotation.x = Math.PI * 2 / 3;

          var ringGroup = new THREE.Object3D();
          ringMeshes.remove(rings[3]);
          ringMeshes.remove(rings[4]);
          ringGroup.add(rings[3]);
          ringGroup.add(rings[4]);

          var ringGroup2 = new THREE.Object3D();
          ringMeshes.remove(rings[5]);
          ringMeshes.remove(rings[6]);
          ringGroup2.add(rings[5]);
          ringGroup2.add(rings[6]);

          ringMeshes.add(ringGroup);
          ringMeshes.children[3].children[0].rotation.x = Math.PI * 1 / 3;
          ringMeshes.children[3].children[1].rotation.x = Math.PI * 2 / 3;
          ringGroup.rotation.y = Math.PI * 1 / 3;

          ringMeshes.add(ringGroup2);
          ringMeshes.children[4].children[0].rotation.x = Math.PI * 1 / 3;
          ringMeshes.children[4].children[1].rotation.x = Math.PI * 2 / 3;
          ringGroup2.rotation.y = Math.PI * 2 / 3;
        }
      } else if (numOfRings === 8) {
        if (arrangement === 1) {
          ringMeshes.children[1].rotation.x = Math.PI * 1 / 4;
          ringMeshes.children[2].rotation.x = Math.PI * 2 / 4;
          ringMeshes.children[3].rotation.x = Math.PI * 3 / 4;
          var ringGroup = new THREE.Object3D();
          ringMeshes.remove(rings[4]);
          ringMeshes.remove(rings[5]);
          ringMeshes.remove(rings[6]);
          ringMeshes.remove(rings[7]);
          ringGroup.add(rings[4]);
          ringGroup.add(rings[5]);
          ringGroup.add(rings[6]);
          ringGroup.add(rings[7]);
          ringGroup.scale = new THREE.Vector3(0.9, 0.9, 0.9);
          ringMeshes.add(ringGroup);
          ringMeshes.children[4].children[1].rotation.x = Math.PI * 1 / 4;
          ringMeshes.children[4].children[2].rotation.x = Math.PI * 2 / 4;
          ringMeshes.children[4].children[3].rotation.x = Math.PI * 3 / 4;
          ringGroup.rotation.z = Math.PI * 1 / 2;
        } else if (arrangement === 2) {
          ringMeshes.children[1].rotation.x = Math.PI * 1 / 3;
          ringMeshes.children[2].rotation.x = Math.PI * 2 / 3;

          var ringGroup = new THREE.Object3D();
          ringMeshes.remove(rings[3]);
          ringMeshes.remove(rings[4]);
          ringMeshes.remove(rings[5]);
          ringGroup.add(rings[3]);
          ringGroup.add(rings[4]);
          ringGroup.add(rings[5]);

          var ringGroup2 = new THREE.Object3D();
          ringMeshes.remove(rings[6]);
          ringMeshes.remove(rings[7]);
          ringGroup2.add(rings[6]);
          ringGroup2.add(rings[7]);

          ringMeshes.add(ringGroup);
          ringMeshes.children[3].children[1].rotation.x = Math.PI * 1 / 3;
          ringMeshes.children[3].children[2].rotation.x = Math.PI * 2 / 3;
          ringGroup.rotation.z = Math.PI * 1 / 2;

          ringMeshes.add(ringGroup2);
          ringMeshes.children[4].children[0].rotation.x = Math.PI * 1 / 3;
          ringMeshes.children[4].children[1].rotation.x = Math.PI * 2 / 3;
          ringGroup2.rotation.y = Math.PI * 1 / 2;
        } else if (arrangement === 3) {
          ringMeshes.children[1].rotation.x = Math.PI * 1 / 3;
          ringMeshes.children[2].rotation.x = Math.PI * 2 / 3;

          var ringGroup = new THREE.Object3D();
          ringMeshes.remove(rings[3]);
          ringMeshes.remove(rings[4]);
          ringMeshes.remove(rings[5]);
          ringGroup.add(rings[3]);
          ringGroup.add(rings[4]);
          ringGroup.add(rings[5]);

          var ringGroup2 = new THREE.Object3D();
          ringMeshes.remove(rings[6]);
          ringMeshes.remove(rings[7]);
          ringGroup2.add(rings[6]);
          ringGroup2.add(rings[7]);

          ringMeshes.add(ringGroup);
          ringMeshes.children[3].children[0].rotation.x = Math.PI * 1 / 12;
          ringMeshes.children[3].children[1].rotation.x = Math.PI * 5 / 12;
          ringMeshes.children[3].children[2].rotation.x = Math.PI * 9 / 12;
          ringGroup.rotation.z = Math.PI * 1 / 2;

          ringMeshes.add(ringGroup2);
          ringMeshes.children[4].children[0].rotation.x = Math.PI * 1 / 3;
          ringMeshes.children[4].children[1].rotation.x = Math.PI * 2 / 3;
          ringGroup2.rotation.y = Math.PI * 1 / 2;
        } else if (arrangement === 4) {
          ringMeshes.children[1].rotation.x = Math.PI * 1 / 4;
          ringMeshes.children[2].rotation.x = Math.PI * 2 / 4;
          ringMeshes.children[3].rotation.x = Math.PI * 3 / 4;

          var ringGroup = new THREE.Object3D();
          ringMeshes.remove(rings[4]);
          ringMeshes.remove(rings[5]);
          ringMeshes.remove(rings[6]);
          ringMeshes.remove(rings[7]);
          ringGroup.add(rings[4]);
          ringGroup.add(rings[5]);
          ringGroup.add(rings[6]);
          ringGroup.add(rings[7]);

          ringMeshes.add(ringGroup);
          ringMeshes.children[4].children[1].rotation.x = Math.PI * 1 / 4;
          ringMeshes.children[4].children[2].rotation.x = Math.PI * 2 / 4;
          ringMeshes.children[4].children[3].rotation.x = Math.PI * 3 / 4;
          ringGroup.rotation.x = Math.PI * 1 / 8;
          ringGroup.rotation.y = Math.PI * 1 / 8;
          ringGroup.rotation.z = Math.PI * 1 / 2;
        } else if (arrangement === 5) {
          var angle1 = 1 + Math.round(Math.random() * 6); // 1 - 7
          var angle2 = 1 + Math.round(Math.random() * 6); // 1 - 7

          angle2 = prompt('angle1, angle2', angle1 + ',' + angle2);
          angle1 = parseInt(angle2.split(',')[0]);
          angle2 = parseInt(angle2.split(',')[1]);
          console.log('angle1, angle2', angle1, angle2);

          var angle3 = 16 - angle1;
          var angle4 = 16 - angle2;

          ringMeshes.children[0].rotation.x = Math.PI * angle1 / 16;
          ringMeshes.children[1].rotation.x = Math.PI * angle3 / 16;

          var ringGroup = new THREE.Object3D();
          ringMeshes.remove(rings[2]);
          ringMeshes.remove(rings[3]);
          ringGroup.add(rings[2]);
          ringGroup.add(rings[3]);

          var ringGroup2 = new THREE.Object3D();
          ringMeshes.remove(rings[4]);
          ringMeshes.remove(rings[5]);
          ringGroup2.add(rings[4]);
          ringGroup2.add(rings[5]);

          var ringGroup3 = new THREE.Object3D();
          ringMeshes.remove(rings[6]);
          ringMeshes.remove(rings[7]);
          ringGroup3.add(rings[6]);
          ringGroup3.add(rings[7]);


          ringMeshes.add(ringGroup);
          ringMeshes.children[2].children[0].rotation.x = Math.PI * angle2 / 16;
          ringMeshes.children[2].children[1].rotation.x = Math.PI * angle4 / 16;
          ringGroup.rotation.y = Math.PI * 1 / 4;

          ringMeshes.add(ringGroup2);
          ringMeshes.children[3].children[0].rotation.x = Math.PI * angle1 / 16;
          ringMeshes.children[3].children[1].rotation.x = Math.PI * angle3 / 16;
          ringGroup2.rotation.y = Math.PI * 2 / 4;

          ringMeshes.add(ringGroup3);
          ringMeshes.children[4].children[0].rotation.x = Math.PI * angle2 / 16;
          ringMeshes.children[4].children[1].rotation.x = Math.PI * angle4 / 16;
          ringGroup3.rotation.y = Math.PI * 3 / 4;
        }
      } else if (numOfRings === 9) {
        // 1
        ringMeshes.children[1].rotation.x = Math.PI * 1 / 4;
        ringMeshes.children[2].rotation.x = Math.PI * 2 / 4;
        ringMeshes.children[3].rotation.x = Math.PI * 3 / 4;

        var ringGroup = new THREE.Object3D();
        ringMeshes.remove(rings[4]);
        ringMeshes.remove(rings[5]);
        ringMeshes.remove(rings[6]);
        ringGroup.add(rings[4]);
        ringGroup.add(rings[5]);
        ringGroup.add(rings[6]);

        var ringGroup2 = new THREE.Object3D();
        ringMeshes.remove(rings[7]);
        ringMeshes.remove(rings[8]);
        ringGroup2.add(rings[7]);
        ringGroup2.add(rings[8]);

        ringMeshes.add(ringGroup);
        ringMeshes.children[4].children[1].rotation.x = Math.PI * 1 / 4;
        ringMeshes.children[4].children[2].rotation.x = Math.PI * 3 / 4;
        ringGroup.rotation.z = Math.PI * 1 / 2;

        ringMeshes.add(ringGroup2);
        ringMeshes.children[5].children[0].rotation.x = Math.PI * 1 / 4;
        ringMeshes.children[5].children[1].rotation.x = Math.PI * 3 / 4;
        ringGroup2.rotation.y = Math.PI * 1 / 2;
      }

      scene.add(ringMeshes);

      // PARTICLES

      if (o.ss === 'star') {
        spriteMesh = new THREE.Sprite(material.starSprite);
        spriteMesh.scale.set(6, 6, 6); // todo: not hard-coded
      } else {
        spriteMesh = new THREE.Sprite(material.softSprite);
        spriteMesh.scale.set(4, 4, 4); // todo: not hard-coded
      }

      if (o.mode === 'auto') {
        for (i = 0, l = numOfRings; i < l; i++) {
          if (o.cover) {
            threeInstallationMock.addSprite(colorPallete[i % colorPallete.length].hue, 1, 0.5, 0, 0, 0, 1.5, true, 5, 5);
          } else {
            threeInstallationMock.addSprite(colorPallete[i % colorPallete.length].hue, 1, 0.5, 0, 0, 0, 1.5, true, 5, 375);
          }
        }
      } else if (o.mode === 'full') {
        scene.updateMatrixWorld();
        for (i = 0, l = numOfRings; i < l; i++) {
          var circle = circles[i].children[0];
          for (j = 0, m = counterMax; j < m; j++) {
            //var coords = circle.geometry.vertices[j].clone();
            //coords.applyMatrix4(circle.matrixWorld);
            var coords = circle.localToWorld(circle.geometry.vertices[j].clone());
            var hue = j / m;
            threeInstallationMock.addSprite(hue, 1, 0.5, coords.x, coords.y, coords.z, 1, false);
          }
        }
      } else if (o.mode === 'random') {
        scene.updateMatrixWorld();
        for (i = 0, l = numOfRings; i < l; i++) {
          var startPosition = Math.round(Math.random() * counterMax);
          var direction = Math.round(Math.random()) * 2 - 1;
          var length = Math.round(Math.random() * counterMax / 8);
          var circle = circles[i].children[0];
          console.log('i, startPosition, direction, length', i, startPosition, direction, length);
          for (j = 0, m = length; j < m; j++) {
            var vIndex = (startPosition + (direction * j)) % counterMax;
            if (vIndex < 0) vIndex = counterMax + vIndex;
            var lightness = (1 - (j / length)) / 2;
            console.log('i, j, vIndex, counterMax, lightness', i, j, vIndex, counterMax, lightness);
            var coords = circle.localToWorld(circle.geometry.vertices[vIndex].clone());
            threeInstallationMock.addSprite(colorPallete[i % colorPallete.length].hue, 1, lightness, coords.x, coords.y, coords.z, 1, true, 5 * lightness, 250);
          }
        }
      }

      scene.add(coloredLights);

      window.scene = scene; // temp, for debugging

      // STATS

      stats = new Stats();
      container.appendChild(stats.domElement);

      threeInstallationMock.animate();
      if (o.mode === 'listen') {
        threeInstallationMock.listen();
      }

      threeInstallationMock.insertControls();

      return true;
    },

    arrangeRingsRadially: function(){
      var i, l;
      for (i = 1, l = numOfRings; i < l; i++) {
        ringMeshes.children[i].rotation.x = Math.PI * i / l;
      }
    },

    addSprite: function (h, s, l, x, y, z, scale, withLight, intensity, distance) {
      var light, sprite;

      if (withLight === true) {
        light = new THREE.PointLight(0xffffff, intensity, distance); // todo: move to app/three/light.js?
        light.color.setHSL( h, s, l );
      }

      if (o.lightOnly === true) {
        light.position.set( x, y, z );
        coloredLights.add(light);
        return;
      }

      sprite = spriteMesh.clone(); // todo: needed? pretty sure it is.
      sprite.position.set( x, y, z );
      if (scale !== 1) {
        var scaledSize = sprite.scale.x * scale;
        sprite.scale.set( scaledSize, scaledSize, scaledSize );
      }
      sprite.material = sprite.material.clone(); // todo: ditto?
      sprite.material.color.setHSL(h, s, l);
      //sprite.opacity = 0.5; // translucent particles
      //sprite.transparent = true; // translucent particles
      sprite.material.blending = THREE.AdditiveBlending; // "glowing" particles

      if (withLight === true) {
        light.position = sprite.position;
        sprite.add(light);
      }

      coloredLights.add(sprite);
    },

    insertControls: function(){
      $(container).parent().append('<div id="threeOptions"></div>');
      $('#threeOptions').html('<form>\
        <label for="config">Ring configuration:</label><select name="config"></select>\
        <label for="mode">Mode:</label><select name="mode"></select>\
        <label for="ss">Sprite style:</label><select name="ss"></select>\
        <label for="lpr">Lights per ring:</label><input type="text" name="lpr" value="' + o.lpr + '">\
        <input type="submit" value="Apply" disabled="disabled">\
      </form>');

      threeInstallationMock.addOptionsToSelect('config', 'configs');
      threeInstallationMock.addOptionsToSelect('mode', 'modes');
      threeInstallationMock.addOptionsToSelect('ss', 'sss');

      $('#threeOptions form').on('change input', function(){
        $('#threeOptions form input[type=submit]').removeAttr('disabled');
      });
    },

    addOptionsToSelect: function(singular, plural){
      for (i = 0, l = allOptions[plural].length; i < l; i++) {
        $('#threeOptions select[name=' + singular + ']').append('<option value="' + allOptions[plural][i] + '">' + allOptions[plural][i] + '</option>');
        if (o[singular] === allOptions[plural][i]) {
          $('#threeOptions select[name=' + singular + '] option:last-child').attr('selected', true);
        }
      }
    },

    listen: function(){
      remote.onmessage(function (event) { // respond to node.js notifications coming back
        var message = JSON.parse(event.data);
        if (verbose) {
          console.log('onmessage', event, message);
        }

        var senderID = message.senderID;
        var pName = 'p' + senderID;

        if (!players[pName]) {
          if (typeof cullIntervalID === 'undefined') {
            cullIntervalID = window.setInterval(threeInstallationMock.cullIdlePlayers, cullInterval);
          }

          var i = coloredLights.children.length;

          // todo: why don't these sprites have lights?
          threeInstallationMock.addSprite(colorPallete[i % colorPallete.length].hue, 1, 0.5, 0, 0, 0, 1.5, true, 5, 375);

          var whichRing = Math.round((numOfRings - 1) * Math.random());

          console.log('pName, i, whichRing', pName, i, whichRing);

          players[pName] = {
            sprite: coloredLights.children[i],
            position: 0,
            circle: ringMeshes.children[whichRing].children[0],
            active: true
          };
        }

        var player = players[pName];

        var degrees = parseInt(message.data);
        var position = Math.floor(degrees / 360 * parseInt(o.lpr));

        //console.log('message.data, degrees, position', message.data, degrees, position);

        // for now, only update the lights if user moves into a new light quadrant
        if (position !== player.position) {
          player.position = position;
          var coords = player.circle.localToWorld(player.circle.geometry.vertices[position].clone());
          player.sprite.position.x = coords.x;
          player.sprite.position.y = coords.y;
          player.sprite.position.z = coords.z;
        }

        // mark player as active (used by `cullIdlePlayers`)
        player.active = true;
      });
    },

    cullIdlePlayers: function () {
      var playerID, player;

      for (playerID in players) {
        player = players[playerID];
        if (player.active === false) {
          console.log('Culling idle player "' + playerID + '"');
          coloredLights.remove(players[playerID].sprite);
          delete players[playerID];
        } else {
          player.active = false;
        }
      }
    },

    animate: function () {
      var i, l, circle, coords, j, m;

      window.requestAnimationFrame(threeInstallationMock.animate);
      controls.update();

      if (o.mode === 'auto') {
        for (i = 0, l = numOfRings; i < l; i++) {
          circle = circles[i].children[0];
          coords = circle.localToWorld(circle.geometry.vertices[Math.floor(counter / 10)].clone());
          if (totalCounter < 11 && counter === 10) {
            console.log('i, coords', i, coords);
          }
          coloredLights.children[i].position.x = coords.x;
          coloredLights.children[i].position.y = coords.y;
          coloredLights.children[i].position.z = coords.z;
        }

        counter++;
        totalCounter++;
        if (counter % (counterMax * 10) === 0) {
          counter = 0;
        }
      }

      renderer.render(scene, camera);

      stats.update();
    }
  };

  return threeInstallationMock;
});