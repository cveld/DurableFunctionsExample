using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Extensions.Http;
using Microsoft.Azure.WebJobs.Extensions.SignalRService;
using Microsoft.Build.Framework;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;

namespace FunctionApp
{
    public static class SendSignalRMessage
    {
        static HttpClient httpClient = new HttpClient();

        /// <summary>
        /// Code for mimicing EasyAuth http header x-ms-client-principal-name
        /// </summary>
        /// <param name="name"></param>
        /// <returns></returns>
        private static string TransformPrincipalNameToSignalRUserId(string name)
        {
            // For AAD:
            // it looks like there is an inconsistency in the ClaimsPrincipal population when going through X-ZUMO-AUTH authentication
            // the principal name for live.com aad guest principals contains the same value as the claim of type "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"
            // which would be great, but the other flow which generates the SignalR connectioninfo strips out the live.com# prefix
            // e.g. live.com#carl@intveld.nl becomes carl@intveld.nl
            // Strangely the regular cookie based auth flow does strip out this prefix
            if (name != null && name.StartsWith("live.com#"))
            {
                return name.Substring(9);
            }

            // for Microsoft Accounts the principal name is equal to the user's full name
            // only that apostrophes get html encoded, e.g. ' becomes &#39;
            return WebUtility.HtmlEncode(name);
            //return name;
        }

        /// <summary>
        /// Code for mimicing EasyAuth http header x-ms-client-principal-id
        /// </summary>
        /// <param name=""></param>
        /// <returns></returns>
        private static string TransformPrincipalIdToSignalRUserId(ClaimsPrincipal claimsPrincipal)
        {
            // For AAD it seems to get fetched from the following claim:
            var userid = claimsPrincipal.Claims.Where(c => c.Type == "http://schemas.microsoft.com/identity/claims/objectidentifier").FirstOrDefault();
            if (userid == null)
            {
                // for microsoftaccount flows it seems to get fetched from the following claim:
                userid = claimsPrincipal.Claims.Where(c => c.Type == ClaimTypes.NameIdentifier /* "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier" */).FirstOrDefault();
            }
            return userid?.Value;
        }

        [FunctionName("SendSignalRMessage")]
        public static IActionResult Run(
            [HttpTrigger(AuthorizationLevel.Anonymous)] HttpRequest req,
            //[CosmosDBTrigger("demo", "flights", ConnectionStringSetting = "AzureWebJobsCosmosDBConnectionString")]              
            [SignalR(HubName = "carlintveld")] IAsyncCollector<SignalRMessage> signalRMessages, ClaimsPrincipal claimsPrincipal)
        {
            signalRMessages.AddAsync(new SignalRMessage
            {
                Target = "carlintveldEvent",
                Arguments = new[] { "Broadcast" }
            });

            //var userid = TransformPrincipalNameToSignalRUserId(claimsPrincipal.Identity.Name);
            // 
            var userid = TransformPrincipalIdToSignalRUserId(claimsPrincipal);
            if (!string.IsNullOrEmpty(userid))            
            {
                signalRMessages.AddAsync(new SignalRMessage
                {
                    Target = "carlintveldEvent",
                    UserId = userid,
                    Arguments = new[] { $"Message to UserId: {userid}" } // { (userid != claimsPrincipal.Identity.Name ? $" (original principal name: {claimsPrincipal.Identity.Name})" : String.Empty) }" 
                });
            }

            signalRMessages.FlushAsync().Wait();
            //return new JsonResult($"OK {claimsPrincipal.Identity.Name}");
            return ClaimsPrincipalTest.CreateJsonResultFromClaimsPrincipal(claimsPrincipal);
        }
    }
}

