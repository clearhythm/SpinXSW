define(['three', 'ThreeBSP', 'lodash'], function (THREE, ThreeBSP, _) {
  var bandOuterRadius = 100;
  var bandWidth = bandOuterRadius / 50;
  var bandThickness = bandOuterRadius / 100;

  var geometry = {
    makeRing: function (options) {
      var o = _.merge({
        radius: 59,
        width: 1.5,
        depth: 0.5,
        segments: 512,
      }, options);

      var cylinderOuterGeometry = new THREE.CylinderGeometry(
        o.radius,
        o.radius,
        o.width,
        o.segments
      );
      var cylinderOuterBSP = new ThreeBSP(cylinderOuterGeometry);

      var cylinderInnerGeometry = new THREE.CylinderGeometry(
        o.radius - o.depth,
        o.radius - o.depth,
        o.width,
        o.segments
      );
      var cylinderInnerBSP = new ThreeBSP(cylinderInnerGeometry);

      var ringBSP = cylinderOuterBSP.subtract(cylinderInnerBSP);

      return ringBSP.toGeometry();
    },

    makeCircle: function (options) {
      var o = _.merge({
        radius: 60,
        segments: 128,
      }, options);

      var circleGeometry = new THREE.CircleGeometry(o.radius, o.segments);

      circleGeometry.vertices.shift(); // Remove unwanted center vertex

      return circleGeometry;
    },

    makeTorus: function (options) {
      var o = _.merge({
        radius: 59,
        tube: 2,
        segments: 128,
        segmentsT: 8
      }, options);

      var torusGeometry = new THREE.TorusGeometry(o.radius, o.tube, o.segmentsT, o.segments);

      return torusGeometry;
    }
  };

  return geometry;
});