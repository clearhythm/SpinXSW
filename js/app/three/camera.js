define(['three', 'app/three/container'], function (THREE, container) {
  var camera = new THREE.PerspectiveCamera(70, 1, 1, 4000);

  camera.position = new THREE.Vector3(110, 11, 27);

  var updateSize = function(){
    camera.aspect = container.offsetWidth / container.offsetHeight;
    camera.updateProjectionMatrix();
  };
  window.addEventListener('resize', updateSize, false);
  updateSize();

  return camera;
});