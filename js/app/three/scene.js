define(['three'], function (THREE) {
  var scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x000000, 3500, 15000);
  scene.fog.color.setHSL(0.51, 0.4, 0.01);

  return scene;
});