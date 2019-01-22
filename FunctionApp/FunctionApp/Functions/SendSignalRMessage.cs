using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Extensions.Http;
using Microsoft.Azure.WebJobs.Extensions.SignalRService;
using Microsoft.Build.Framework;
using System;
using System.Collections.Generic;
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

            var strippedUserId = TransformPrincipalNameToSignalRUserId(claimsPrincipal.Identity.Name);
            if (!string.IsNullOrEmpty(strippedUserId))
            {
                signalRMessages.AddAsync(new SignalRMessage
                {
                    Target = "carlintveldEvent",
                    UserId = strippedUserId,
                    Arguments = new[] { $"Message to UserId: {strippedUserId} { (strippedUserId != claimsPrincipal.Identity.Name ? $" (original principal name: {claimsPrincipal.Identity.Name})" : String.Empty)}" }
                });
            }

            signalRMessages.FlushAsync().Wait();
            //return new JsonResult($"OK {claimsPrincipal.Identity.Name}");
            return ClaimsPrincipalTest.CreateJsonResultFromClaimsPrincipal(claimsPrincipal);
        }
    }
}

