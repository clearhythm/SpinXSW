define(['three', 'app/three/container', 'app/three/scene'], function (THREE, container, scene) {
  container.innerHTML = '';
  var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

  renderer.setClearColor( scene.fog.color, 1 );

  // todo: gamma? https://github.com/mrdoob/three.js/issues/1488
  //renderer.gammaInput = true;
  //renderer.gammaOutput = true;

  renderer.sortObjects = false; // todo: ?
  renderer.autoClear = false; // todo: ?

  container.appendChild(renderer.domElement);

  var updateSize = function(){
    renderer.setSize(container.offsetWidth, container.offsetHeight);
  };
  window.addEventListener('resize', updateSize, false);
  updateSize();

  return renderer;
});