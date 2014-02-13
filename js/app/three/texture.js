define(['three'], function (THREE) {
  var texturePath = 'js/app/three/textures/';

  return {
    lensflare: THREE.ImageUtils.loadTexture(texturePath + 'lensflare.png'),
    spark: THREE.ImageUtils.loadTexture(texturePath + 'spark.png')
  };
});