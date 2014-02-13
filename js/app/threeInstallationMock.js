// todo: make sure all ".clones()" are necessary, and faster than just recreating geometry (probably)

define(['detector', 'app/three/container', 'three', 'app/three/camera', 'app/three/controls', 'app/three/geometry', 'app/three/light', 'app/three/material', 'app/three/renderer', 'app/three/scene', 'lib/three/stats.min', 'lodash'],
function (Detector, container, THREE, camera, controls, geometry, light, material, renderer, scene, stats, _) {
  var o = {
    numOfRings: 2,
    configuration: 0,
    mode: 'auto',
    lpr: 128
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
  var rings = new THREE.Object3D();
  var coloredLights = new THREE.Object3D();
  var counter = 0;
  var counterMax;
  var totalCounter = 0;

  var threeInstallationMock = {
    stats: null,

    init: function () {
      var options, ringMesh, circleGeometry, circle, i, l, ring, spriteMesh, addSprite, j, m;

      if (!Detector.webgl) {
        container.innerHTML = '<h2>Having WebGL problems? I feel bad for you.</h2>';
        return;
      }

      if (window.location.search.substring(0, 3) === '?o=') {
        options = JSON.parse(decodeURIComponent(
          window.location.search.substring(1).split('&')[0].split('=')[1]
        ));
        _.merge(o, options);
      }
      console.log('options', o);

      // RINGS

      ringMesh = new THREE.Mesh(geometry.makeRing(), material.whitePlastic);

      circleGeometry = geometry.makeCircle({ segments: o.lpr });
      circle = new THREE.Line(circleGeometry, material.line);
      circle.rotation.x = Math.PI / 2;
      circle.visible = false;
      counterMax = circle.geometry.vertices.length;
      ringMesh.add(circle); // .clone()?

      for (i = 0, l = o.numOfRings; i < l; i++) {
        ring = ringMesh.clone();

        ring.position.y = 0; // todo: needed?
        ring.rotation.y = 0; // todo: needed?
        ring.overdraw = true; // todo: needed?
        ring.doubleSided = true; // todo: needed?

        rings.add(ring);
      }

      if (o.numOfRings === 2) { // 2 rings
        rings.children[1].rotation.x = Math.PI * 1 / 2;
      } else if (o.numOfRings === 3) {
        if (o.configuration === 0) {
          rings.children[1].rotation.x = Math.PI * 1 / 3;
          rings.children[2].rotation.x = Math.PI * 2 / 3;
        } else if (o.configuration === 1) {
          rings.children[1].rotation.x = Math.PI * 1 / 2;
          rings.children[2].rotation.z = Math.PI * 1 / 2;
        } else {
          rings.children[1].rotation.x = Math.PI * 1 / 3;
          rings.children[1].position.x = 0.5;
          rings.children[2].rotation.x = Math.PI * 2 / 3;
          rings.children[2].position.x = -0.5;
        }
      } else if (o.numOfRings === 4) {
        if (o.configuration === 0) {
          rings.children[1].rotation.x = Math.PI * 1 / 4;
          rings.children[2].rotation.x = Math.PI * 2 / 4;
          rings.children[3].rotation.x = Math.PI * 3 / 4;
        } else if (o.configuration === 1) {
          rings.children[1].rotation.x = Math.PI * 1 / 3;
          rings.children[2].rotation.x = Math.PI * 2 / 3;
          rings.children[3].rotation.z = Math.PI * 1 / 2;
        } else {
          rings.children[1].rotation.x = Math.PI * 1 / 4;
          rings.children[1].position.x = 0.5;
          rings.children[2].rotation.x = Math.PI * 2 / 4;
          rings.children[2].position.x = -0.5;
          rings.children[3].rotation.x = Math.PI * 3 / 4;
          rings.children[3].position.x = 1;
        }
      } else if (o.numOfRings === 5) {
        rings.children[1].rotation.x = Math.PI * 1 / 2;
        rings.children[2].rotation.z = Math.PI * 1 / 2;
        rings.children[3].rotation.z = Math.PI * 1 / 2;
        rings.children[3].rotation.z = Math.PI * 1 / 4;
        rings.children[4].rotation.z = Math.PI * 1 / 2;
        rings.children[4].rotation.z = Math.PI * 3 / 4;
      } else if (o.numOfRings === 6) {
        if (o.configuration === 0) {
          rings.children[1].rotation.x = Math.PI * 1 / 6;
          rings.children[2].rotation.x = Math.PI * 2 / 6;
          rings.children[3].rotation.x = Math.PI * 3 / 6;
          rings.children[4].rotation.x = Math.PI * 4 / 6;
          rings.children[5].rotation.x = Math.PI * 5 / 6;
        } else if (o.configuration === 1) {
          rings.children[1].rotation.x = Math.PI * 1 / 3;
          rings.children[2].rotation.x = Math.PI * 2 / 3;
          var ringGroup = new THREE.Object3D();
          rings.remove(rings.children[3]);
          rings.remove(rings.children[4]);
          rings.remove(rings.children[5]);
          ringGroup.add(rings.children[3]);
          ringGroup.add(rings.children[4]);
          ringGroup.add(rings.children[5]);
          rings.add(ringGroup);
          rings.children[4].rotation.x = Math.PI * 1 / 3;
          rings.children[5].rotation.x = Math.PI * 2 / 3;
          ringGroup.rotation.z = Math.PI * 1 / 2;
        } else {
          rings.children[1].rotation.x = Math.PI * 1 / 3;
          rings.children[2].rotation.x = Math.PI * 2 / 3;
          var ringGroup = new THREE.Object3D();
          rings.remove(rings.children[3]);
          rings.remove(rings.children[4]);
          rings.remove(rings.children[5]);
          ringGroup.add(rings.children[3]);
          ringGroup.add(rings.children[4]);
          ringGroup.add(rings.children[5]);
          ringGroup.scale = new THREE.Vector3(0.9, 0.9, 0.9);
          rings.add(ringGroup);
          rings.children[4].rotation.x = Math.PI * 1 / 3;
          rings.children[5].rotation.x = Math.PI * 2 / 3;
          ringGroup.rotation.z = Math.PI * 1 / 2;

        }
      } else if (o.numOfRings === 7) {
        rings.children[1].rotation.x = Math.PI * 1 / 4;
        rings.children[2].rotation.x = Math.PI * 2 / 4;
        rings.children[3].rotation.x = Math.PI * 3 / 4;
        var ringGroup = new THREE.Object3D();
        rings.remove(rings.children[4]);
        rings.remove(rings.children[5]);
        rings.remove(rings.children[6]);
        ringGroup.add(rings.children[4]);
        ringGroup.add(rings.children[5]);
        ringGroup.add(rings.children[6]);
        rings.add(ringGroup);
        rings.children[5].rotation.x = Math.PI * 1 / 4;
        rings.children[6].rotation.x = Math.PI * 3 / 4;
        ringGroup.rotation.z = Math.PI * 1 / 2;
      } else if (o.numOfRings === 8) {
        if (o.configuration === 0) {
          rings.children[1].rotation.x = Math.PI * 1 / 8;
          rings.children[2].rotation.x = Math.PI * 2 / 8;
          rings.children[3].rotation.x = Math.PI * 3 / 8;
          rings.children[4].rotation.x = Math.PI * 4 / 8;
          rings.children[5].rotation.x = Math.PI * 5 / 8;
          rings.children[6].rotation.x = Math.PI * 6 / 8;
          rings.children[7].rotation.x = Math.PI * 7 / 8;
        } else if (o.configuration === 1) {
          rings.children[1].rotation.x = Math.PI * 1 / 4;
          rings.children[2].rotation.x = Math.PI * 2 / 4;
          rings.children[3].rotation.x = Math.PI * 3 / 4;
          var ringGroup = new THREE.Object3D();
          rings.remove(rings.children[4]);
          rings.remove(rings.children[5]);
          rings.remove(rings.children[6]);
          rings.remove(rings.children[7]);
          ringGroup.add(rings.children[4]);
          ringGroup.add(rings.children[5]);
          ringGroup.add(rings.children[6]);
          ringGroup.add(rings.children[7]);
          ringGroup.scale = new THREE.Vector3(0.9, 0.9, 0.9);
          rings.add(ringGroup);
          rings.children[5].rotation.x = Math.PI * 1 / 4;
          rings.children[6].rotation.x = Math.PI * 2 / 4;
          rings.children[7].rotation.x = Math.PI * 3 / 4;
          ringGroup.rotation.z = Math.PI * 1 / 2;
        } else {
          rings.children[1].rotation.x = Math.PI * 1 / 3;
          rings.children[2].rotation.x = Math.PI * 2 / 3;
          var ringGroup = new THREE.Object3D();
          rings.remove(rings.children[3]);
          rings.remove(rings.children[4]);
          rings.remove(rings.children[5]);
          ringGroup.add(rings.children[3]);
          ringGroup.add(rings.children[4]);
          ringGroup.add(rings.children[5]);
          rings.add(ringGroup);
          rings.children[4].rotation.x = Math.PI * 1 / 3;
          rings.children[5].rotation.x = Math.PI * 2 / 3;
          ringGroup.rotation.z = Math.PI * 1 / 2;
          var ringGroup2 = new THREE.Object3D();
          rings.remove(rings.children[6]);
          rings.remove(rings.children[7]);
          ringGroup2.add(rings.children[6]);
          ringGroup2.add(rings.children[7]);
          rings.add(ringGroup2);
          rings.children[6].rotation.x = Math.PI * 1 / 3;
          rings.children[7].rotation.x = Math.PI * 2 / 3;
          ringGroup2.rotation.y = Math.PI * 1 / 2;
        }
      } else if (o.numOfRings === 9) {
        rings.children[1].rotation.x = Math.PI * 1 / 9;
        rings.children[2].rotation.x = Math.PI * 2 / 9;
        rings.children[3].rotation.x = Math.PI * 3 / 9;
        rings.children[4].rotation.x = Math.PI * 4 / 9;
        rings.children[5].rotation.x = Math.PI * 5 / 9;
        rings.children[6].rotation.x = Math.PI * 6 / 9;
        rings.children[7].rotation.x = Math.PI * 7 / 9;
        rings.children[8].rotation.x = Math.PI * 8 / 9;
      }

      scene.add(rings);

      // PARTICLES

      spriteMesh = new THREE.Sprite(material.sparkSprite);
      spriteMesh.scale.set(4, 4, 4); // todo: not hard-coded

      addSprite = function(h, s, l, x, y, z, withLight){
        var light, sprite;

        if (withLight === true) {
          light = new THREE.PointLight(0xffffff, 1.5, 4500); // todo: move to app/three/light.js?
          light.color.setHSL( h, s, l );
          light.position.set( x, y, z );
        }

        sprite = spriteMesh.clone(); // todo: needed? pretty sure it is.
        sprite.material = sprite.material.clone(); // todo: ditto?
        sprite.material.color.setHSL(h, s, l);
        // sprite.opacity = 0.80; // translucent particles
        sprite.material.blending = THREE.AdditiveBlending; // "glowing" particles

        if (withLight === true) {
          sprite.position = light.position;
          sprite.add(light);
        }

        coloredLights.add(sprite);
      }

      if (o.mode === 'auto') {
        for (i = 0, l = o.numOfRings; i < l; i++) {
          addSprite(colorPallete[i].hue, 1, 0.5, 0, 0, 0, true);
        }
      } else if (o.mode === 'full') {
        for (i = 0, l = o.numOfRings; i < l; i++) {
          for (j = 0, m = counterMax; j < m; j++) {
            addSprite(colorPallete[i].hue, 1, 0.5, 0, 0, 0, false);
          }
        }
      }

      scene.add(coloredLights);

      window.scene = scene; // temp, for debugging

      // STATS

      threeInstallationMock.stats = new Stats();
      container.appendChild(threeInstallationMock.stats.domElement);

      return true; // todo: better to just move the initial ".animate()" call here? Or...?
    },

    animate: function () {
      var i, l, circle, coords, j, m;

      window.requestAnimationFrame(threeInstallationMock.animate);
      controls.update();

      if (o.mode === 'auto') {
        for (i = 0, l = coloredLights.children.length; i < l; i++) {
          circle = rings.children[i].children[0];
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
      } else if (o.mode === 'full' && totalCounter < 2) {
        for (i = 0, l = o.numOfRings; i < l; i++) {
          circle = rings.children[i].children[0];
          for (j = 0, m = counterMax; j < m; j++) {
            coords = circle.localToWorld(circle.geometry.vertices[j].clone());
            if (j % 10 === 0) {
              console.log('i, j, coords', i, j, coords);
            }
            coloredLights.children[i * counterMax + j].position = new THREE.Vector3(coords.x, coords.y, coords.z);
          }
        }

        totalCounter++;
      }

      renderer.render(scene, camera);

      threeInstallationMock.stats.update();
    }
  };

  return threeInstallationMock;
});