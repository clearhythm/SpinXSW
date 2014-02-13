define(['jquery', 'app/remote', 'app/utils'],
function ($, remote, utils) {
  var app = {
    init: function(){
      // Establish connection to websocket server
      remote.init();

      // Mobile Clients & Installation get different UIs and data logic
      if (utils.isMobile){
        app.initSwitcher('client');
        app.showClientUI();
        require(['app/clientUI'], function (clientUI) {
          clientUI.init();
        });
      } else {
        // :: Installation Logic (& mock desktop light rig)
        app.initSwitcher('installation')
        app.showInstallationUI();
      }
    },

    initSwitcher: function (currentView) {
      app.setSwitcherLabel(currentView);
      $('.switcher button').click(function(e){
        var $span = $('#switcher_view');
        var newView = $span.html();
        if (newView == 'Client') {
          app.showClientUI();
          $span.html('Installation');
        } else {
          app.showInstallationUI();
          $span.html('Client');
        }
      });
    },

    setSwitcherLabel: function (currentView) {
      var newView = (currentView == 'installation') ? 'Client' : 'Installation';
      $('#switcher_view').html(newView);
    },

    showClientUI: function(){
      $('#installation_ui').hide();
      $('#client_ui').show();
      remote.registerSelfAs('client');
    },

    showInstallationUI: function(){
      $('#client_ui').hide();
      $('#installation_ui').show();

      require(['app/threeInstallationMock'], function (threeInstallationMock) {
        if (threeInstallationMock.init()) {
          $('#installation_ui h1').hide();
          threeInstallationMock.animate();
        }
      });

      remote.registerSelfAs('installation');
    }
  };

  return app;
});