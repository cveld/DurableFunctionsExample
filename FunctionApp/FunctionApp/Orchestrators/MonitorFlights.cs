using Microsoft.Azure.WebJobs;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace FunctionApp.Orchestrators
{
    public class MonitorFlights
    {
        [FunctionName("MonitorFlights")]
        public static async Task Run(
            [OrchestrationTrigger] DurableOrchestrationContextBase context, ILogger log)
        {
            DateTime endTime = context.CurrentUtcDateTime.AddSeconds(5);
            while (context.CurrentUtcDateTime < endTime)
            {
                var nextCheckpoint = context.CurrentUtcDateTime.AddSeconds(1);
                if (!context.IsReplaying) { log.LogInformation($"Next check for at {nextCheckpoint}."); }

                await context.CreateTimer(nextCheckpoint, CancellationToken.None);

            }
            log.LogInformation($"Monitor expiring.");
        }
    }
}
