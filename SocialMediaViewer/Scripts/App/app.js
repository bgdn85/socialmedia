(function ($) {

    "use strict";

    window.maphacks = {
        Models: {},
        Views: {}
    };

    function initializeApp() {
        var appView = new window.maphacks.Views.AppView({ user: window.currentUser });
        appView.render(); 
        $("#app-view").theatre({
                /* other options here */
                selector: "p",
                effect: "3d"
            }); 
    }

    window.onload = initializeApp;

})(jQuery);