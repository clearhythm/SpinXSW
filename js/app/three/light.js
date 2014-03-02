define(['three', 'app/three/scene'], function (THREE, scene) {
  var light = {
    addDirectional: function(){
      var aLight = new THREE.DirectionalLight(0xffffff, 0.25);
      aLight.position.set(100, 100, 200);
      scene.add(aLight);

      return aLight;
    },

    addAmbient: function(){
      var aLight = new THREE.AmbientLight(0xffffff);
      scene.add(aLight);

      return aLight;
    }
  };

  return light;
});