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
  }
});