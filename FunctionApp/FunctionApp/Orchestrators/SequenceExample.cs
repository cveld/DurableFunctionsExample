// Copyright (c) .NET Foundation. All rights reserved.
// Licensed under the MIT License. See LICENSE in the project root for license information.

using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using FunctionApp.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Extensions.SignalRService;

namespace FunctionApp1
{
    public static class SequenceExample
    {
        [FunctionName("E1_HelloSequence")]
        public static async Task<List<string>> Run(
            [OrchestrationTrigger] DurableOrchestrationContextBase context)
        {            
            var outputs = new List<string>();
            //context.GetInput();                       
            outputs.Add(await context.CallActivityAsync<string>("E1_SayHello", "Seattle"));            
            outputs.Add(await context.CallActivityAsync<string>("E1_SayHello", "Utrecht"));
            outputs.Add(await context.CallActivityAsync<string>("E1_SayHello", "Future Tech"));
            
            await context.CallActivityAsync<string>("SendSignalRMessageActivity", new SignalRDto { id = context.InstanceId, message = $"Result: {String.Join(" ", outputs)}", progress = 100 });

            return outputs;
        }


        [FunctionName("E1_HelloSequenceWithSuborchestrator")]
        public static async Task<List<string>> E1_HelloSequenceWithSuborchestrator(
            [OrchestrationTrigger] DurableOrchestrationContextBase context)
        {
            Task<dynamic> cancellationTask = context.WaitForExternalEvent<dynamic>("CancelSequence");

            var outputs = new List<string>();
            //context.GetInput();
            await context.CallActivityAsync("SignalRAddUserToGroup", null);

            // STEP 1
            var step1 = context.CallSubOrchestratorAsync<SubOrchestratorExampleOutput>("SubOrchestratorExample", new SubOrchestratorExampleModel {
                Input = "Seattle",
                Progress = 20                
            });
            Task winner = await Task.WhenAny(cancellationTask, step1);
            if (winner == cancellationTask)
            {
                var x = cancellationTask.Result;
                outputs.Add("Canceled during step 1");
                await context.CallActivityAsync<string>("SendSignalRMessageActivity", new SignalRDto { id = context.InstanceId, message = $"Result: {String.Join(" ", outputs)}", progress = 100 });
                return outputs;
            }
            outputs.Add(step1.Result.Message);

            // STEP 2
            var step2 = context.CallSubOrchestratorAsync<SubOrchestratorExampleOutput>("SubOrchestratorExample", new SubOrchestratorExampleModel
            {
                Input = "Utrecht",
                Progress = 40
            });
            winner = await Task.WhenAny(cancellationTask, step2);
            if (winner == cancellationTask)
            {
                outputs.Add("Canceled during step 2");
                await context.CallActivityAsync<string>("SendSignalRMessageActivity", new SignalRDto { id = context.InstanceId, message = $"Result: {String.Join(" ", outputs)}", progress = 100 });
                return outputs;
            }
            outputs.Add(step2.Result.Message);

            // STEP 3
            var step3 = context.CallSubOrchestratorAsync<SubOrchestratorExampleOutput>("SubOrchestratorExample", new SubOrchestratorExampleModel
            {
                Input = "Future Tech",
                Progress = 60
            });
            winner = await Task.WhenAny(cancellationTask, step3);
            if (winner == cancellationTask)
            {
                outputs.Add("Canceled during step 3");
                await context.CallActivityAsync<string>("SendSignalRMessageActivity", new SignalRDto { id = context.InstanceId, message = $"Result: {String.Join(" ", outputs)}", progress = 100 });
                return outputs;
            }
            outputs.Add(step3.Result.Message);

            await context.CallActivityAsync<string>("SendSignalRMessageActivity", new SignalRDto { id = context.InstanceId, message = $"Result: {String.Join(" ", outputs)}", progress = 100 });
            return outputs;
        }


        private static void StatusUpdate(DurableOrchestrationContextBase context, string v)
        {
            
        }

        [FunctionName("E1_SayHello")]
        public static string SayHello([ActivityTrigger] string name)
        {
            return $"Hello {name}!";
        }
        
        [FunctionName("SignalRAddUserToGroup")]
        public static Task SignalRAddUserToGroup([ActivityTrigger]object input, [SignalR(HubName = "carlintveld")]IAsyncCollector<SignalRGroupAction> signalRGroupActions)
        {
            return signalRGroupActions.AddAsync(
                new SignalRGroupAction
                {
                    UserId = "Test",//claimsPrincipal.Identity.Name,
                    GroupName = "Test",
                    Action = GroupAction.Add
                });
        }
    }
}
