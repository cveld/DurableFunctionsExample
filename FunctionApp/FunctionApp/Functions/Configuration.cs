using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Extensions.Http;
using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Http;
using System.Text;

namespace FunctionApp1
{
    public static class Configuration
    {
        static HttpClient httpClient = new HttpClient();
        [FunctionName("Configuration")]
        public static IActionResult Run(
            [HttpTrigger(AuthorizationLevel.Anonymous)] HttpRequest req)
        {
            return new JsonResult(
                new
                {
                    FunctionsApp = System.Environment.GetEnvironmentVariable("FunctionsApp", EnvironmentVariableTarget.Process),
                    FunctionsAppCode = System.Environment.GetEnvironmentVariable("FunctionsAppCode", EnvironmentVariableTarget.Process),
                    BingApiKey = System.Environment.GetEnvironmentVariable("BingApiKey", EnvironmentVariableTarget.Process),
                    AuthEnabled = System.Environment.GetEnvironmentVariable("AuthEnabled", EnvironmentVariableTarget.Process)
                }
            );
        }
    }
}
