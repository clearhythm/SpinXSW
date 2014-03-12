define(['jquery', 'app/remote', 'app/gameEngine', 'app/utils'],
function ($, remote, gameEngine, utils) {
  var app = {
    init: function(){
      // Mobile Clients & Installation get different UIs and data logic
      if (window.location.search.search('forceclient') !== -1 || utils.isMobile) {
        app.initSwitcher('client');
        app.showClientUI();
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

      require(['app/clientUI'], function (clientUI) {
        clientUI.init();
      });
    },

    showInstallationUI: function(){
      $('#client_ui').hide();
      $('#installation_ui').show();

      gameEngine.init();
      $('#installation_ui h1').hide();

      /* require(['app/threeInstallationMock'], function (threeInstallationMock) {
        if (threeInstallationMock.init()) {
          $('#installation_ui h1').hide();
        }
      }); */
    }
  };

  return app;
});