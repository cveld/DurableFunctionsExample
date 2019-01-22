using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Extensions.Http;
using Microsoft.Azure.WebJobs.Extensions.SignalRService;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Text;

namespace FunctionApp1
{
    public static class SignalRInfo
    {
        [FunctionName("SignalRInfoAnonymous")]
        public static IActionResult SignalRInfoAnonymous(
            [HttpTrigger(AuthorizationLevel.Anonymous)] HttpRequest req,
            [SignalRConnectionInfo(HubName = "carlintveld")] SignalRConnectionInfo connectionInfo,
            ILogger log)
        {            
            return new OkObjectResult(connectionInfo);
        }

        [FunctionName("SignalRInfoAuthenticated")]
        public static IActionResult SignalRInfoAuthenticated(
            [HttpTrigger(AuthorizationLevel.Anonymous)] HttpRequest req,
            [SignalRConnectionInfo(HubName = "carlintveld", UserId = "{headers.x-ms-client-principal-id}")] SignalRConnectionInfo connectionInfo,
            ILogger log)
        {
            // for aad both regular as well as live-id guest accounts the http header x-ms-client-principal-name is equal to the user's e-mail address 
            return new OkObjectResult(connectionInfo);
        }
    }
}
