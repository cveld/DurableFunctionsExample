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

namespace FunctionApp1
{
    public static class SendSignalRMessage
    {
        static HttpClient httpClient = new HttpClient();

        [FunctionName("SendSignalRMessage")]
        public static IActionResult Run(
            [HttpTrigger(AuthorizationLevel.Anonymous)] HttpRequest req,
            //[CosmosDBTrigger("demo", "flights", ConnectionStringSetting = "AzureWebJobsCosmosDBConnectionString")]              
            [SignalR(HubName = "carlintveld")] IAsyncCollector<SignalRMessage> signalRMessages, ClaimsPrincipal claimsPrincipal)
        {
            signalRMessages.AddAsync(new SignalRMessage
            {
                Target = "carlintveldEvent",
                Arguments = new[] { "carl", "intveld" }
            }).Wait();
            return new JsonResult("OK");
        }
    }
}

