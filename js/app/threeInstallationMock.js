// todo: make sure all ".clones()" are necessary, and faster than just recreating geometry (probably)

define(['detector', 'app/three/container', 'three', 'app/three/camera', 'app/three/controls', 'app/three/geometry', 'app/three/light', 'app/three/material', 'app/three/renderer', 'app/three/scene', 'lib/three/stats.min', 'app/utils', 'lodash'],
function (Detector, container, THREE, camera, controls, geometry, light, material, renderer, scene, stats, utils, _) {
  var allOptions = {
    configs: [2, 3, '3,1', '3,2(staggered)', 4, '4,1', '4,2(staggered)', 5, '5,1', 6, '6,1', '6,2(scaled)', '6,3(tetra)', 7, '7,1', '7,2', '7,3(options)', 8, '8,1(scaled)', '8,2', '8,3', '8,4', '8,5(options)', '8,6', 9, '9,1', '9,2(options)', '9,3(globe)', '9,4(globe)', '9,5(globe)', '9,6(globe)', '10,1', '12,1(tetra)', '12,2', 16],
    modes: ['auto', 'full', 'random', 'listen', 'listen2'],
    sss: ['soft', 'star'],
    showRingss: [true, false],
    useDirectionalLights: [true, false],
    useAmbientLights: [true, false],
    hueTypes: [0, 1, 2, 3, 4, 5]
  };
  var defaultOptions = {
    config: '7,2',
    mode: 'auto',
    lpr: 128, // Lights per ring
    ss: 'soft',
    cover: false, // light cover
    showRings: true,
    lightOnly: false, // no sprite
    useDirectionalLight: true,
    useAmbientLight: true,
    ringRadius: 59,
    ringWidth: 1.5,
    ringDepth: 0.5,
    spriteGap: 2, // distance between sprite and ring
    spriteScale: 6,
    hueType: 0 // only affects o.mode === 'full'
  };
  var o = {};
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
  var coloredLightsLength;
  var counter = 0;
  var counterMax;
  var players = {};
  var stats;
  var spriteMesh;

  var threeInstallationMock = {
    stats: null,

    init: function () { // todo: this method is too big!
      var options, option, ringMesh, circleGeometry, circle, arrangement, i, l, ring, j, m;

      if (!Detector.webgl) {
        container.innerHTML = '<h2>Having WebGL problems? I feel bad for you.</h2>';
        return;
      }

      options = utils.getToObject();
      for (option in options) {
        options[option] = utils.stringToType(options[option]);
      }
      _.merge(o, defaultOptions, options);
      console.log('o', o);

      // LIGHTS

      if (o.useDirectionalLight && o.showRings) {
        light.addDirectional();
      }
      if (o.useAmbientLight && o.showRings) {
        light.addAmbient();
      }

      // RINGS

      ringMesh = new THREE.Mesh(geometry.makeRing({ radius: o.ringRadius, width: o.ringWidth, depth: o.ringDepth }), material.whitePlastic);

      if (o.showRings === false) {
        ringMesh.visible = false;
      }

      circleGeometry = geometry.makeCircle({ radius: o.ringRadius + o.spriteGap, segments: parseInt(o.lpr) });
      circle = new THREE.Line(circleGeometry, material.line);
      circle.rotation.x = Math.PI / 2;
      circle.rotation.z = Math.PI * 1 / 2; // changes the starting position to the bottom (as per physical sculpture)
      circle.visible = false;
      counterMax = circle.geometry.vertices.length - 1;
      ringMesh.add(circle); // .clone()?

      if (o.cover) { // todo
        var torusMesh = new THREE.Mesh(geometry.makeTorus(), material.frostedPlastic);
        torusMesh.rotation.x = Math.PI / 2;
        ringMesh.add(torusMesh); // .clone()?
      }

      if (_.isNumber(o.config)) {
        numOfRings = o.config;
        arrangement = 0;
      } else {
        numOfRings = parseInt(o.config.split(',')[0]);
        arrangement = parseInt(o.config.split(',')[1]);
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
        threeInstallationMock.arrangeRingsRadially(numOfRings);
      } else if (numOfRings === 3) {
        if (arrangement === 1) {
          ringMeshes.children[1].rotation.x = Math.PI * 1 / 2;
          ringMeshes.children[2].rotation.z = Math.PI * 1 / 2;
        } else if (arrangement === 2) {
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
        } else if (arrangement === 2) {
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
        } else if (arrangement === 3) {
          ringMeshes.children[0].rotateZ(Math.PI * 1 / 6);
          ringMeshes.children[1].rotateZ(Math.PI * 3 / 6);
          ringMeshes.children[2].rotateZ(Math.PI * 5 / 6);

          var ringGroup = new THREE.Object3D();
          ringMeshes.remove(rings[3]);
          ringMeshes.remove(rings[4]);
          ringGroup.add(rings[3]);
          ringGroup.add(rings[4]);

          var ringGroup2 = new THREE.Object3D();
          ringMeshes.remove(rings[5]);
          ringGroup2.add(rings[5]);

          ringMeshes.add(ringGroup);
          ringMeshes.add(ringGroup2);

          ringMeshes.children[3].rotation.x = Math.acos(-1 / 3);
          ringMeshes.children[3].children[0].rotateZ(Math.PI * 1 / 6);
          ringMeshes.children[3].children[1].rotateZ(Math.PI * 5 / 6);

          ringMeshes.children[4].rotation.z = Math.PI / 3;
          ringMeshes.children[4].rotateX(Math.acos(1 / 3));
          ringMeshes.children[4].children[0].rotateZ(Math.PI * 5 / 6);

          // for reference, temp
          var tetraMesh = new THREE.Mesh(new THREE.TetrahedronGeometry(60.5), new THREE.MeshBasicMaterial({ wireframe: true}));
          tetraMesh.rotation.y = Math.PI / 4;
          tetraMesh.rotation.x = -0.615;
          tetraMesh.opacity = 0.25;
          tetraMesh.transparent = true;
          window.showTetrahedron = function(){
            scene.add(tetraMesh);
          };
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
        } else  if (arrangement === 2) {
          ringMeshes.children[0].rotation.x = Math.PI * 1 / 3;
          ringMeshes.children[1].rotation.x = Math.PI * 2 / 3;

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

          ringMeshes.add(ringGroup);
          ringMeshes.children[3].children[0].rotation.x = Math.PI * 1 / 3;
          ringMeshes.children[3].children[1].rotation.x = Math.PI * 2 / 3;
          ringGroup.rotation.y = Math.PI * 1 / 3;

          ringMeshes.add(ringGroup2);
          ringMeshes.children[4].children[0].rotation.x = Math.PI * 1 / 3;
          ringMeshes.children[4].children[1].rotation.x = Math.PI * 2 / 3;
          ringGroup2.rotation.y = Math.PI * 2 / 3;
        } else  if (arrangement === 3) {
          var angle1 = _.random(1, 7);

          angle1 = parseFloat(prompt('angle1 (range: 1-7)', angle1));
          window.setTimeout(function(){ // hack
            $('select[name=config]').after('(' + angle1 + ')');
          }, 0);

          rings[0].rotation.x = Math.PI * angle1 / 16;

          ringMeshes.remove(rings[1]);
          ringMeshes.remove(rings[2]);
          ringMeshes.remove(rings[3]);
          ringMeshes.remove(rings[4]);
          ringMeshes.remove(rings[5]);
          ringMeshes.remove(rings[6]);

          var ringGroups = new THREE.Object3D();

          for (i = 1, l = numOfRings; i < l; i++) {
            rings[i].rotation.x = Math.PI * angle1 / 16;
            ringGroups.add(new THREE.Object3D());
            ringGroups.children[i - 1].add(rings[i]);
            ringGroups.children[i - 1].rotation.y = Math.PI * i / 3.5;
          }
          ringMeshes.add(ringGroups);
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
          var angle1 = _.random(1, 7);
          var angle2 = _.random(1, 7);

          angle2 = prompt('angle1, angle2 (1-7)', angle1 + ',' + angle2);
          angle1 = parseFloat(angle2.split(',')[0]);
          angle2 = parseFloat(angle2.split(',')[1]);
          window.setTimeout(function(){ // hack
            $('select[name=config]').after('(' + angle1 + ',' + angle2 + ')');
          }, 0);

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
        } else if (arrangement === 6) {
          threeInstallationMock.arrangeRingsRadially(6);

          var ringGroup = new THREE.Object3D();
          ringMeshes.remove(rings[6]);
          ringMeshes.remove(rings[7]);
          ringGroup.add(rings[6]);
          ringGroup.add(rings[7]);
          ringMeshes.add(ringGroup);
          ringMeshes.children[6].rotation.z = Math.PI * 1 / 2;

          if (arrangement === 6) {
            var scale = 0.907;
            var distance = 25;
          }

          ringMeshes.children[6].children[0].scale = new THREE.Vector3(scale, scale, scale);
          ringMeshes.children[6].children[0].position.y = -1 * distance;

          ringMeshes.children[6].children[1].scale = new THREE.Vector3(scale, scale, scale);
          ringMeshes.children[6].children[1].position.y = distance;
        }
      } else if (numOfRings === 9) {
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
        } else if (arrangement === 2) {
          var angle1 = _.random(1, 7);

          angle1 = parseFloat(prompt('angle1 (range: 1-7)', angle1));
          window.setTimeout(function(){ // hack
            $('select[name=config]').after('(' + angle1 + ')');
          }, 0);

          var angle2 = 16 - angle1;

          ringMeshes.children[0].rotation.x = Math.PI * angle1 / 16;
          ringMeshes.children[1].rotation.x = Math.PI * 8 / 16;
          ringMeshes.children[2].rotation.x = Math.PI * angle2 / 16;

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
          ringMeshes.remove(rings[8]);
          ringGroup2.add(rings[6]);
          ringGroup2.add(rings[7]);
          ringGroup2.add(rings[8]);

          ringMeshes.add(ringGroup);
          ringMeshes.children[3].children[0].rotation.x = Math.PI * angle1 / 16;
          ringMeshes.children[3].children[1].rotation.x = Math.PI * 8 / 16;
          ringMeshes.children[3].children[2].rotation.x = Math.PI * angle2 / 16;
          ringGroup.rotation.y = Math.PI * 1 / 3;

          ringMeshes.add(ringGroup2);
          ringMeshes.children[4].children[0].rotation.x = Math.PI * angle1 / 16;
          ringMeshes.children[4].children[1].rotation.x = Math.PI * 8 / 16;
          ringMeshes.children[4].children[2].rotation.x = Math.PI * angle2 / 16;
          ringGroup2.rotation.y = Math.PI * 2 / 3;
        } else if (arrangement > 2 && arrangement < 7) {
          threeInstallationMock.arrangeRingsRadially(6);

          var ringGroup = new THREE.Object3D();
          ringMeshes.remove(rings[6]);
          ringMeshes.remove(rings[7]);
          ringMeshes.remove(rings[8]);
          ringGroup.add(rings[6]);
          ringGroup.add(rings[7]);
          ringGroup.add(rings[8]);
          ringMeshes.add(ringGroup);
          ringMeshes.children[6].rotation.z = Math.PI * 1 / 2;

          if (arrangement === 3) {
            var scale = 0.907;
            var distance = 25;
          } else if (arrangement === 4) {
            var scale = 0.8625;
            var distance = 30;
          } else if (arrangement === 5) {
            var scale = 0.805;
            var distance = 35;
          } else if (arrangement === 6) {
            var scale = 0.5;
            var distance = 51;
          }

          ringMeshes.children[6].children[0].scale = new THREE.Vector3(scale, scale, scale);
          ringMeshes.children[6].children[0].position.y = -1 * distance;

          ringMeshes.children[6].children[1].scale = new THREE.Vector3(scale, scale, scale);
          ringMeshes.children[6].children[1].position.y = distance;
        }
      } else if (numOfRings === 10) {
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
        ringMeshes.remove(rings[9]);
        ringGroup2.add(rings[7]);
        ringGroup2.add(rings[8]);
        ringGroup2.add(rings[9]);

        ringMeshes.add(ringGroup);
        ringMeshes.children[4].children[0].rotation.x = Math.PI * 1 / 4;
        ringMeshes.children[4].children[1].rotation.x = Math.PI * 2 / 4;
        ringMeshes.children[4].children[2].rotation.x = Math.PI * 3 / 4;
        ringGroup.rotation.y = Math.PI * 1 / 3;

        ringMeshes.add(ringGroup2);
        ringMeshes.children[5].children[0].rotation.x = Math.PI * 1 / 4;
        ringMeshes.children[5].children[1].rotation.x = Math.PI * 2 / 4;
        ringMeshes.children[5].children[2].rotation.x = Math.PI * 3 / 4;
        ringGroup2.rotation.y = Math.PI * 2 / 3;
      } else if (numOfRings === 12) {
        if (arrangement === 1) {
          ringMeshes.children[1].rotateZ(Math.PI * 1 / 3);
          ringMeshes.children[2].rotateZ(Math.PI * 2 / 3);

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
          ringMeshes.remove(rings[8]);
          ringGroup2.add(rings[6]);
          ringGroup2.add(rings[7]);
          ringGroup2.add(rings[8]);

          var ringGroup3 = new THREE.Object3D();
          ringMeshes.remove(rings[9]);
          ringMeshes.remove(rings[10]);
          ringMeshes.remove(rings[11]);
          ringGroup3.add(rings[9]);
          ringGroup3.add(rings[10]);
          ringGroup3.add(rings[11]);

          ringMeshes.add(ringGroup);
          ringMeshes.add(ringGroup2);
          ringMeshes.add(ringGroup3);

          ringMeshes.children[3].rotation.x = Math.acos(-1 / 3);
          ringMeshes.children[3].children[1].rotateZ(Math.PI * 1 / 3);
          ringMeshes.children[3].children[2].rotateZ(Math.PI * 2 / 3);

          ringMeshes.children[4].rotation.z = Math.PI / 3;
          ringMeshes.children[4].rotateX(Math.acos(1 / 3));
          //ringMeshes.children[4].rotateZ(Math.PI * 1 / 3);
          ringMeshes.children[4].children[1].rotateZ(Math.PI * 1 / 3);
          ringMeshes.children[4].children[2].rotateZ(Math.PI * 2 / 3);

          ringMeshes.children[5].rotation.z = Math.PI * -1 / 3;
          ringMeshes.children[5].rotateX(Math.acos(1 / 3));
          //ringMeshes.children[5].rotateZ(Math.PI * 1 / 3);
          ringMeshes.children[5].children[1].rotateZ(Math.PI * 1 / 3);
          ringMeshes.children[5].children[2].rotateZ(Math.PI * 2 / 3);

          // for reference, temp
          var tetraMesh = new THREE.Mesh(new THREE.TetrahedronGeometry(60.5), new THREE.MeshBasicMaterial({ wireframe: true}));
          tetraMesh.rotation.y = Math.PI / 4;
          tetraMesh.rotation.x = -0.615;
          tetraMesh.opacity = 0.25;
          tetraMesh.transparent = true;
          window.showTetrahedron = function(){
            scene.add(tetraMesh);
          };
        } else if (arrangement === 2) {
          ringMeshes.children[0].rotation.x = Math.PI * 1 / 8;
          ringMeshes.children[1].rotation.x = Math.PI * 3 / 8;
          ringMeshes.children[2].rotation.x = Math.PI * 5 / 8;
          ringMeshes.children[3].rotation.x = Math.PI * 7 / 8;

          var ringGroup = new THREE.Object3D();
          ringMeshes.remove(rings[4]);
          ringMeshes.remove(rings[5]);
          ringMeshes.remove(rings[6]);
          ringMeshes.remove(rings[7]);
          ringGroup.add(rings[4]);
          ringGroup.add(rings[5]);
          ringGroup.add(rings[6]);
          ringGroup.add(rings[7]);

          var ringGroup2 = new THREE.Object3D();
          ringMeshes.remove(rings[8]);
          ringMeshes.remove(rings[9]);
          ringMeshes.remove(rings[10]);
          ringMeshes.remove(rings[11]);
          ringGroup2.add(rings[8]);
          ringGroup2.add(rings[9]);
          ringGroup2.add(rings[10]);
          ringGroup2.add(rings[11]);

          ringMeshes.add(ringGroup);
          ringMeshes.children[4].children[0].rotation.x = Math.PI * 1 / 8;
          ringMeshes.children[4].children[1].rotation.x = Math.PI * 3 / 8;
          ringMeshes.children[4].children[2].rotation.x = Math.PI * 5 / 8;
          ringMeshes.children[4].children[3].rotation.x = Math.PI * 7 / 8;
          ringGroup.rotation.y = Math.PI * 1 / 3;

          ringMeshes.add(ringGroup2);
          ringMeshes.children[5].children[0].rotation.x = Math.PI * 1 / 8;
          ringMeshes.children[5].children[1].rotation.x = Math.PI * 3 / 8;
          ringMeshes.children[5].children[2].rotation.x = Math.PI * 5 / 8;
          ringMeshes.children[5].children[3].rotation.x = Math.PI * 7 / 8;
          ringGroup2.rotation.y = Math.PI * 2 / 3;
        }
      }

      scene.add(ringMeshes);

      // PARTICLES

      if (o.ss === 'star') {
        spriteMesh = new THREE.Sprite(material.starSprite);
        spriteMesh.scale.set(o.spriteScale * 1.5, o.spriteScale * 1.5, o.spriteScale * 1.5);
      } else {
        spriteMesh = new THREE.Sprite(material.softSprite);
        spriteMesh.scale.set(o.spriteScale, o.spriteScale, o.spriteScale);
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

        if (o.hueType === 2) {
          var hueLength = _.random(0.001, 5);
        }

        var lightness = 0.5;


        for (i = 0, l = numOfRings; i < l; i++) {
          if (o.config === '7,2') {
            var translation = [0, 5, 3, 1, 4, 2, 6];
            var ringIndex = translation[i];
          } else {
            var ringIndex = i;
          }
          var circle = circles[ringIndex].children[0];

          if (o.hueType === 1) {
            var hueStart = Math.random();
            var hueLength = _.random(0.001, 5);
            var hueStep = utils.plusOrMinus() * hueLength / counterMax;
          } else if (o.hueType === 2) {
            var hueStart = Math.random();
            var hueStep = utils.plusOrMinus() * hueLength / counterMax;
          } else if (o.hueType === 4) {
            var hue = Math.random();
          }

          for (j = 0, m = counterMax; j < m; j++) {
            var coords = circle.localToWorld(circle.geometry.vertices[j].clone());

            if (o.hueType === 0) {
              var hue = j / m;
            } else if (o.hueType === 1 || o.hueType === 2) {
              var hue = utils.constrainPeriodic(hueStart + hueStep * j, 1, true);
            } else if (o.hueType === 3) {
              var hue = Math.random();
            } else if (o.hueType === 4) {
              hue = utils.constrainPeriodic(hue + _.random(-0.05, 0.05), true);
            } else if (o.hueType === 5) {
              var hue = Math.random();
              lightness = _.random(-1.5, 0.5);
            }

            if (lightness > 0) {
              threeInstallationMock.addSprite(hue, 1, lightness, coords.x, coords.y, coords.z, 1, false);
            }
          }
        }
      } else if (o.mode === 'listen2') {
        scene.updateMatrixWorld();

        for (i = 0, l = numOfRings; i < l; i++) {
          if (o.config === '7,2') {
            var translation = [0, 5, 3, 1, 4, 2, 6];
            var ringIndex = translation[i];
          } else {
            var ringIndex = i;
          }
          var circle = circles[ringIndex].children[0];

          for (j = 0, m = counterMax; j < m; j++) {
            var coords = circle.localToWorld(circle.geometry.vertices[j].clone());

            threeInstallationMock.addSprite(0.65, 1, 0.75, coords.x, coords.y, coords.z, 1, false);
          }
        }
      } else if (o.mode === 'random') {
        scene.updateMatrixWorld();
        for (i = 0, l = numOfRings; i < l; i++) {
          var startPosition = _.random(counterMax);
          var direction = utils.plusOrMinus();
          var length = _.random(Math.round(counterMax / 4));
          var circle = circles[i].children[0];
          console.log('i, startPosition, direction, length', i, startPosition, direction, length);
          for (j = 0, m = length; j < m; j++) {
            var vIndex = utils.constrainPeriodic(startPosition + direction * j, counterMax);
            var lightness = (1 - (j / length)) / 2;
            var coords = circle.localToWorld(circle.geometry.vertices[vIndex].clone());
            if (j === 0) {
              threeInstallationMock.addSprite(colorPallete[i % colorPallete.length].hue, 1, lightness, coords.x, coords.y, coords.z, 1, true, 2.5, 250);
            } else {
              threeInstallationMock.addSprite(colorPallete[i % colorPallete.length].hue, 1, lightness, coords.x, coords.y, coords.z, 1);
            }
          }
        }
      }

      coloredLightsLength = coloredLights.children.length;

      scene.add(coloredLights);

      window.scene = scene; // temp, for debugging

      // STATS

      stats = new Stats();
      container.appendChild(stats.domElement);

      threeInstallationMock.animate();

      threeInstallationMock.insertControls();

      return true;
    },

    arrangeRingsRadially: function (numberOfRings) {
      var i;
      for (i = 1; i < numberOfRings; i++) {
        rings[i].rotation.x = Math.PI * i / numberOfRings;
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
      $(container).parent().append('<div id="threeOptions">\
        <form>\
          <label for="config">Ring configuration:</label><select name="config"></select><br>\
          <label for="mode">Mode:</label><select name="mode"></select><br>\
          <label for="ss">Sprite style:</label><select name="ss"></select><br>\
          <label for="showRings">Show rings:</label><select name="showRings"></select><br>\
          <label for="useDirectionalLight">Directional light:</label><select name="useDirectionalLight"></select><br>\
          <label for="useAmbientLight">Ambient light:</label><select name="useAmbientLight"></select><br>\
          <label for="hueType">Hue type (if mode=full):</label><select name="hueType"></select><br>\
          <label for="lpr">Lights per ring:</label><input type="text" name="lpr" value="' + o.lpr + '"><br>\
          <label for="ringRadius">Ring radius:</label><input type="text" name="ringRadius" value="' + o.ringRadius + '"><br>\
          <label for="ringWidth">Ring width:</label><input type="text" name="ringWidth" value="' + o.ringWidth + '"><br>\
          <label for="ringDepth">Ring depth:</label><input type="text" name="ringDepth" value="' + o.ringDepth + '"><br>\
          <label for="spriteGap">Sprite gap:</label><input type="text" name="spriteGap" value="' + o.spriteGap + '"><br>\
          <label for="spriteScale">Sprite scale:</label><input type="text" name="spriteScale" value="' + o.spriteScale + '"><br>\
          <input type="submit" value="Apply" disabled="disabled">\
        </form>\
      </div>');

      var $form = $('#threeOptions form');

      threeInstallationMock.addOptionsToSelect($form, 'config', 'configs');
      threeInstallationMock.addOptionsToSelect($form, 'mode', 'modes');
      threeInstallationMock.addOptionsToSelect($form, 'ss', 'sss');
      threeInstallationMock.addOptionsToSelect($form, 'showRings', 'showRingss');
      threeInstallationMock.addOptionsToSelect($form, 'useDirectionalLight', 'useDirectionalLights');
      threeInstallationMock.addOptionsToSelect($form, 'useAmbientLight', 'useAmbientLights');
      threeInstallationMock.addOptionsToSelect($form, 'hueType', 'hueTypes');

      $form.on('change input', function(){
        $('input[type=submit]', this).removeAttr('disabled');
      });

      $form.on('submit', function(e){
        $(this).hide();

        if ($('select[name=showRings]', $form).val() === 'false') {
          $('select[name=useDirectionalLight]', $form).remove();
          $('select[name=useAmbientLight]', $form).remove();
          $('input[name=ringWidth]', $form).remove();
          $('input[name=ringDepth]', $form).remove();
        }

        if ($('select[name=mode]', $form).val() !== 'full') {
          $('select[name=hueType]', $form).remove();
        }

        $('select, input', this).each(function(){
          var elName = $(this).attr('name');
          var val = utils.stringToType($(this).val());
          if (defaultOptions[elName] === val) {
            $(this).remove();
          }
        });
      });
    },

    addOptionsToSelect: function($form, singular, plural){
      for (i = 0, l = allOptions[plural].length; i < l; i++) {
        $('select[name=' + singular + ']', $form).append('<option value="' + allOptions[plural][i] + '">' + allOptions[plural][i] + '</option>');
        if (o[singular] === allOptions[plural][i]) {
          $('select[name=' + singular + '] option:last-child', $form).attr('selected', true);
        }
      }
    },

    setLight: function (i, r, g, b) {
      if (coloredLightsLength > i + 1) {
        coloredLights.children[i].material.color.setRGB(r / 255, g / 255, b / 255);
        //console.log('Set color of light ' + i);
      } // else silently ignore
    },

    setAllLights: function (r, g, b) {
      //var startTime = Date.now();
      var i, l;
      for (i = 0, l = coloredLightsLength; i < l; i++) {
        coloredLights.children[i].material.color.setRGB(r / 255, g / 255, b / 255);
      }
      //console.log('setAllLights took', Date.now() - startTime, 'ms');
    },

    changePlayerPosition: function (pName, position, forceUpdate) {
      var player = players[pName];

      if (forceUpdate || position !== player.position) {
        player.position = position;
        var coords = player.circle.localToWorld(player.circle.geometry.vertices[position].clone());
        player.sprite.position.x = coords.x;
        player.sprite.position.y = coords.y;
        player.sprite.position.z = coords.z;
      }
    },

    addNewPlayer: function (pName, whichRing, playerColor) {
      var i = coloredLights.children.length;

      // todo: why don't these sprites have lights?
      threeInstallationMock.addSprite(playerColor.hue, 1, 0.5, 0, 0, 0, 1.5, true, 5, 375);

      players[pName] = {
        sprite: coloredLights.children[i],
        position: 0,
        ring: whichRing,
        circle: rings[whichRing].children[0]
      };

      coloredLightsLength += 1;
    },

    changePlayerRing: function (pName, newRing) {
      var player = players[pName];

      if (newRing === void 0) {
        newRing = _.random(numOfRings - 2);
        if (newRing >= player.ring) newRing += 1;
      }

      player.ring = newRing;
      player.circle = rings[newRing].children[0];

      return newRing;
    },

    removePlayer: function (pName) {
      coloredLights.remove(players[pName].sprite);
      coloredLightsLength -= 1;
      delete players[pName];
    },

    animate: function () {
      var i, l, circle, coords, j, m;

      if (window.pauseAnimation) { window.startAnimation = threeInstallationMock.animate; return; }

      window.requestAnimationFrame(threeInstallationMock.animate);
      controls.update();

      if (o.mode === 'auto') {
        if (counter % 4 === 0) {
          for (i = 0, l = numOfRings; i < l; i++) {
            circle = circles[i].children[0];
            coords = circle.localToWorld(circle.geometry.vertices[counter / 4].clone());
            coloredLights.children[i].position.x = coords.x;
            coloredLights.children[i].position.y = coords.y;
            coloredLights.children[i].position.z = coords.z;
          }
        }

        counter++;
        if (counter % (counterMax * 4) === 0) {
          counter = 0;
        }
      }

      renderer.render(scene, camera);

      stats.update();
    }
  };

  return threeInstallationMock;
});