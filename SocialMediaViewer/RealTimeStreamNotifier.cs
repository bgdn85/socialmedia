﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Web;
using Microsoft.AspNet.SignalR;
using TweetSharp;

namespace SocialMediaViewer
{
    public class RealTimeStreamNotifier
    {
        private readonly string _consumerKey;
        private readonly string _consumerSecret;
        private readonly TwitterService _twitterService;
        private readonly TwitterStreamingClient _streamingClient;

        public RealTimeStreamNotifier(string clientName, string consumerKey, string consumerSecret, string accessToken, string accessTokenSecret)
        {
            this._consumerKey = consumerKey;
            this._consumerSecret = consumerSecret;

            this._twitterService = new TwitterService(this._consumerKey, this._consumerSecret);
            this._streamingClient = new TwitterStreamingClient("SocialMediaTwitterCentric", this._consumerKey, this._consumerSecret, accessToken, accessTokenSecret);
        }

        public async Task<IAsyncResult> SubscribeForFilter(string filter)
        {
            IAsyncResult result = this._streamingClient.StreamFilter(filter, (artifact, response) =>
            {
                TwitterStatus status = this._twitterService.Deserialize<TwitterStatus>(response.Response);

                IHubContext hubContext = GlobalHost.ConnectionManager.GetHubContext<TwitterFeedHub>();
                hubContext.Clients.All.showTweet(status);
            });

            IAsyncResult asyncResult = await Task.FromResult(result);

            return asyncResult;
        }
    }
}