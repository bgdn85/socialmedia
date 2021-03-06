﻿using System;
using System.Configuration;
using System.Web.Mvc;
using SocialMediaViewer.Models;
using TweetSharp;

namespace SocialMediaViewer.Controllers
{
    public class OAuthController : Controller
    {
        private readonly string _consumerKey;
        private readonly string _consumerSecret;

        public OAuthController()
        {
            this._consumerKey = ConfigurationManager.AppSettings.Get("Twitter:ConsumerKey");
            this._consumerSecret = ConfigurationManager.AppSettings.Get("Twitter:ConsumerSecret");
        }

        //
        // GET: /OAuth/
        public ActionResult Index()
        {
            return new EmptyResult();
        }

        public ActionResult Authorize()
        {
            // Step 1 - Retrieve an OAuth Request Token
            TwitterService service = this.GetTwitterService();

            // This is the registered callback URL
            OAuthRequestToken requestToken = service.GetRequestToken(this.GetCallbackUrl());

            // Step 2 - Redirect to the OAuth Authorization URL
            Uri uri = service.GetAuthorizationUri(requestToken);

            return new RedirectResult(uri.ToString(), false);
        }

        public ActionResult Callback(string oauth_token, string oauth_verifier)
        {
            var requestToken = new OAuthRequestToken { Token = oauth_token };

            // Step 3 - Exchange the Request Token for an Access Token
            TwitterService service = this.GetTwitterService();
            OAuthAccessToken accessToken = service.GetAccessToken(requestToken, oauth_verifier);

            // Step 4 - User authenticates using the Access Token
            service.AuthenticateWith(accessToken.Token, accessToken.TokenSecret);
            TwitterUser user = service.GetUserProfile(new GetUserProfileOptions());

            Session["UserDetails"] = new UserDetailsViewModel
            {
                Id = user.Id,
                UserName = user.ScreenName,
                ProfilePictureUrl = user.ProfileImageUrlHttps,
                AccessToken = accessToken.Token,
                AccessTokenSecret = accessToken.TokenSecret
            };

            return RedirectToAction("Index", "Index");
        }

        private string GetCallbackUrl()
        {
            return String.Format("{0}://{1}:{2}/oauth/callback", Request.Url.Scheme, Request.Url.Host, Request.Url.Port);
        }

        private TwitterService GetTwitterService()
        {
            TwitterService service = new TwitterService(this._consumerKey, this._consumerSecret);

            return service;
        }
    }
}