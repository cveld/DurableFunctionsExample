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
using System.Text;
using System.Threading.Tasks;

namespace FunctionApp1
{
    public static class SendSignalRMessageActivity
    {
        static HttpClient httpClient = new HttpClient();

        [FunctionName("SendSignalRMessageActivity")]
        public static void Run(
            [ActivityTrigger]SignalRDTO input,
            //[CosmosDBTrigger("demo", "flights", ConnectionStringSetting = "AzureWebJobsCosmosDBConnectionString")]              
            [SignalR(HubName = "carlintveld")] IAsyncCollector<SignalRMessage> signalRMessages)
        {
            signalRMessages.AddAsync(new SignalRMessage
            {
                Target = "DurableEvent",
                Arguments = new[] { input }
            }).Wait();            
        }
    }
}

