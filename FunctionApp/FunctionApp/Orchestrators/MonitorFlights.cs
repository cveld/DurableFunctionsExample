using FunctionApp.Activities;
using FunctionApp.Models;
using Microsoft.Azure.WebJobs;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace FunctionApp.Orchestrators
{
    public class MonitorFlightsInput
    {
        public int Take { get; set; }
        public int Skip { get; set; }
    }

    public class MonitorFlights
    {
        [FunctionName("MonitorFlights")]
        public static async Task Run(
            [OrchestrationTrigger] DurableOrchestrationContextBase context, ILogger log)
        {
            var input = context.GetInput<OrchestratorDto>();
            int take = input.EventData.Take;
            DateTime endTime = context.CurrentUtcDateTime.AddSeconds(take);

            int next = input.EventData.Skip;
            while (context.CurrentUtcDateTime < endTime)
            {
                next = await context.CallActivityAsync<int>("SendFlightDataSignalRActivity", new SendFlightDataSignalRActivityInput { index = next, count = 20, allplanes = true });
                var nextCheckpoint = context.CurrentUtcDateTime.AddSeconds(1);
                if (!context.IsReplaying) { log.LogInformation($"Next check for at {nextCheckpoint}."); }                
                await context.CreateTimer(nextCheckpoint, CancellationToken.None);

            }
            log.LogInformation($"Monitor expiring.");
        }
    }
}
