define({
  isMobile: navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry)/) || false,

  // http://stackoverflow.com/questions/8648892/convert-url-parameters-to-a-javascript-object#8649003
  getToObject: function(){
    var search = location.search.substring(1);
    if (search) {
      return JSON.parse(
        '{"' + search.replace(/&/g, '","').replace(/=/g,'":"') + '"}',
        function(key, value) {
          return key === '' ? value : decodeURIComponent(value);
        }
      )
    } else {
      return {};
    }
  },

  // todo: Support more types? Find a better function? Just threw this one together.
  stringToType: function (inputString) {
    var output = inputString;
    var strAsNum;

    if (typeof inputString === 'string') {
      if (inputString === 'true') {
        output = true;
      } else if (inputString === 'false') {
        output = false;
      } else {
        strAsNum = parseFloat(inputString);
        if (inputString.replace(/^(-*\d+)\.0$/, '$1') === '' + strAsNum) {
          return strAsNum;
        }
      }
    }

    return output;
  },

  plusOrMinus: function(){
    // Randomly returns -1 or 1
    return Math.round(Math.random()) * 2 - 1;
  },

  constrainPeriodic: function (val, max, maxInclusive) {
    if (maxInclusive && val === max) return val;

    val = val % max;

    if (val < 0) {
      val = max + val;
    }

    return val;
  }
});