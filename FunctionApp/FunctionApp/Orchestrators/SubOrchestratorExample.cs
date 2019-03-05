using FunctionApp.Models;
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
        public static async Task<SubOrchestratorExampleOutput> Run(
            [OrchestrationTrigger] DurableOrchestrationContextBase context)
        {            
            var input = context.GetInput<SubOrchestratorExampleModel>();
            var activity1 = await context.CallActivityAsync<string>("E1_SayHello", input.Input);
            var activity2 = await context.CallActivityAsync<string>(
                        "SendSignalRMessageActivity",
                        new SignalRDto { id = context.ParentInstanceId, message = input.Input, progress = input.Progress });                                                   
            return new SubOrchestratorExampleOutput
            {
                Message = activity1,
                Canceled = false
            };
        }
    }
}
