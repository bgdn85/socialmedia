(function ($, Backbone, _, app) {

    "use strict";

    app.Views.AppView = Backbone.View.extend({

        el: "#app-view", 

        initialize: function (options) {
            _.bindAll(this, "render", "renderUserDetails", "connectToHub");

            this.user = options.user;
        },

        render: function () { 
            this.renderUserDetails();
            return this;
        },

        renderUserDetails: function () {
            if (!this.user) {
                var loginView = new app.Views.LoginView();
                loginView.render();
            }
            else {
                console.log("Hello %s", this.user.UserName); 
                this.connectToHub();
            }
        }, 

        connectToHub: function () {
            var that = this,
				twitterFeedHubProxy = $.connection.twitterFeedHub;
                
            twitterFeedHubProxy.client.showTweet = function (tweet) {
                console.log(tweet);
                $('#app-view').append("<p>" + tweet.Text + "</p>");
                //that.mapView.dropTweet(tweet);
            };

            twitterFeedHubProxy.client.subscriptionEstablished = function(subscriptionId, channels) {
                console.log("Subscribed for %O, ID: %s", channels, subscriptionId);
            };

            $.connection.hub.start()
				.done(function (result) {
				    console.log('Now connected, connection ID=' + $.connection.hub.id); 
				    that.subscribeToUpdates();
				})
				.fail(function () { console.log('Could not Connect!'); });
        },

        subscribeToUpdates: function (event) {
            $.connection.twitterFeedHub.server.subscribe(this.user, ["CentricRomaniaTwitterUpdates"]);
        }

    });

})(jQuery, Backbone, _, window.maphacks);