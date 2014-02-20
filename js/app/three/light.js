define(['three', 'app/three/scene'], function (THREE, scene) {
  var light = {
    addDirectional: function(){
      var aLight = new THREE.DirectionalLight(0xffffff);
      aLight.position.set(0, 0, 300);
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