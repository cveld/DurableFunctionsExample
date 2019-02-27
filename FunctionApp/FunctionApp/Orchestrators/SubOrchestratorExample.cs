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
            Task<int> cancellationTask = context.WaitForExternalEvent<int>("CancelSequence");
            var input = context.GetInput<SubOrchestratorExampleModel>();
            var activity1 = context.CallActivityAsync<string>("E1_SayHello", input.Input);
            Task winner = await Task.WhenAny(cancellationTask, activity1);

            if (winner != cancellationTask) {
                var activity2 = context.CallActivityAsync<string>(
                        "SendSignalRMessageActivity",
                        new SignalRDto { id = context.ParentInstanceId, message = input.Input, progress = input.Progress });                                   
                winner = await Task.WhenAny(cancellationTask, activity2);
            }               
            
            if (winner == cancellationTask)
            {
                return new SubOrchestratorExampleOutput
                {
                    Canceled = true
                };
            }        

            return new SubOrchestratorExampleOutput
            {
                Message = activity1.Result,
                Canceled = false
            };
        }
    }
}
