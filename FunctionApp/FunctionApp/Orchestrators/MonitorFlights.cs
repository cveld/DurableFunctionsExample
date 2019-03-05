using FunctionApp.Activities;
using FunctionApp.Models;
using Microsoft.Azure.WebJobs;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json.Linq;
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
        public static async Task<IEnumerable<(int, long)>> Run(
            [OrchestrationTrigger] DurableOrchestrationContextBase context, ILogger log)
        {
            var input = context.GetInput<OrchestratorDto>();
            int take = input.EventData.Take;
            DateTime endTime = context.CurrentUtcDateTime.AddSeconds(take);

            int next = input.EventData.Skip;
            List<(int, long)> takenSamples = new List<(int, long)>();
            while (context.CurrentUtcDateTime < endTime)
            {                
                var current = next;
                long time;
                (next, time) = await context.CallActivityAsync<(int, long)>("SendFlightDataSignalRActivity", new SendFlightDataSignalRActivityInput { index = next, count = 20, allplanes = true });
                takenSamples.Add((current, time));
                var nextCheckpoint = context.CurrentUtcDateTime.AddMilliseconds(1050);
                if (!context.IsReplaying) { log.LogInformation($"Next check for at {nextCheckpoint}."); } 
                await context.CreateTimer(nextCheckpoint, CancellationToken.None);                
            }
            log.LogInformation($"Monitor expiring.");
            return takenSamples;
        }

        [FunctionName("MonitorTest")]
        public static async Task<string> MonitorTest([OrchestrationTrigger] DurableOrchestrationContext monitorContext, ILogger log)
        {
            JObject input = monitorContext.GetInput<JObject>();
            if (!monitorContext.IsReplaying) { log.LogInformation($"Received monitor request."); }

            DateTime endTime = monitorContext.CurrentUtcDateTime.AddSeconds(10);
            if (!monitorContext.IsReplaying) { log.LogInformation($"Instantiating monitor. Expires: {endTime}."); }

            int i = 0;
            while (monitorContext.CurrentUtcDateTime < endTime)
            {
                // Wait for the next checkpoint
                var nextCheckpoint = monitorContext.CurrentUtcDateTime.AddMilliseconds((int)input["EventData"]["duration"]);
                if (!monitorContext.IsReplaying) { log.LogInformation($"Next check at {nextCheckpoint}."); }
                await monitorContext.CreateTimer(nextCheckpoint, CancellationToken.None);
                i++;
            }

            log.LogInformation("Monitor expiring.");
            return i.ToString();
        }
    }
}
