define(['three', 'app/three/camera', 'app/three/container'], function (THREE, camera, container) {
  var controls = new THREE.TrackballControls(camera, container); // todo: is the second argument necessary?

  return controls;
});