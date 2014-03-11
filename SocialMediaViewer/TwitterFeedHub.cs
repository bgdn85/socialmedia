using System;
using System.IO;
using System.Net;
using System.Web.SessionState;
using Microsoft.AspNet.SignalR;
using Newtonsoft.Json;
using System.Configuration;
using SocialMediaViewer.Models;

namespace SocialMediaViewer
{
    public class TwitterFeedHub : Hub, IRequiresSessionState
    {
		private readonly string _consumerKey;
		private readonly string _consumerSecret;

        public TwitterFeedHub()
        { 
            this._consumerKey = ConfigurationManager.AppSettings.Get("Twitter:ConsumerKey");
            this._consumerSecret = ConfigurationManager.AppSettings.Get("Twitter:ConsumerSecret");
 
        }

        public void ShowTweet(TweetModel tweet)
        {  
            Clients.All.showTweet(tweet);
        }

        public void Subscribe(UserDetailsViewModel userDetails, string[] channels)
        {
            Guid subscriptionId = Guid.NewGuid();

            RealTimeStreamNotifier notifier = new RealTimeStreamNotifier("Map hacks", this._consumerKey, this._consumerSecret, userDetails.AccessToken, userDetails.AccessTokenSecret);
            IAsyncResult result = notifier.SubscribeForFilter("test");

            Clients.Caller.subscriptionEstablished(subscriptionId, channels);
        }

    }
    public class TweetModel
    {
        // We declare Left and Top as lowercase with 
        // JsonProperty to sync the client and server models
        [JsonProperty("message")]
        public double Message { get; set; }
        [JsonProperty("sender")]
        public double Sender { get; set; }
    }
}