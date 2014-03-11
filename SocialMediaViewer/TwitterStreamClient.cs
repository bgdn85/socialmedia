using System;
using System.Configuration;
using System.Linq;
using System.Runtime.Serialization;
using LinqToTwitter;

namespace SocialMediaViewer
{
    public sealed class TwitterStreamClient 
    {
        public async void Start()
        {
            int count = 0;

         var auth = new ApplicationOnlyAuthorizer
            {
                CredentialStore = new InMemoryCredentialStore
                {
                    ConsumerKey = ConfigurationManager.AppSettings["Twitter:ConsumerKey"],
                    ConsumerSecret = ConfigurationManager.AppSettings["Twitter:ConsumerSecret"]
                    
                }
            };

         var twitterCtx = new TwitterContext(auth);

            await auth.AuthorizeAsync();
                await
                    (from strm in twitterCtx.Streaming
                     where strm.Type == StreamingType.User
                     select strm)
                        .StartAsync(async strm =>
                            {
                                string message =
                                    string.IsNullOrEmpty(strm.Content)
                                        ? "Keep-Alive"
                                        : strm.Content;
                                Console.WriteLine(
                                    (count + 1).ToString() +
                                    ". " + DateTime.Now +
                                    ": " + message + "\n");

                                if (count++ == 5)
                                    strm.CloseStream();
                            }); 
        }
 
    }

    [DataContract] 
    public class status { 
        [DataMember] 
        internal string user;  
    }
}