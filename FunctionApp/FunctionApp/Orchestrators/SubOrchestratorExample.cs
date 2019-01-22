using FunctionApp1;
using Microsoft.Azure.WebJobs;
using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;

namespace FunctionApp
{
    public class SubOrchestratorExample
    {
        [FunctionName("SubOrchestratorExample")]
        public static async Task<string> Run(
            [OrchestrationTrigger] DurableOrchestrationContextBase context)
        {
            var input = context.GetInput<string>();
            var result = await context.CallActivityAsync<string>("E1_SayHello", input);
            await context.CallActivityAsync<string>("SendSignalRMessageActivity", new SignalRDto { id = context.InstanceId, message = input, progress = 20 });
            return result;
        }
    }
}
