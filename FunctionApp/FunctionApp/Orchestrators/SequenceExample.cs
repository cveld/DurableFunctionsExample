// Copyright (c) .NET Foundation. All rights reserved.
// Licensed under the MIT License. See LICENSE in the project root for license information.

using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
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
            await context.CallActivityAsync("SignalRAddUserToGroup", null);
            outputs.Add(await context.CallActivityAsync<string>("E1_SayHello", "Tokyo"));
            await context.CallActivityAsync<string>("SendSignalRMessageActivity", new SignalRDto { id = context.InstanceId, message = "Tokyo", progress = 20 });        
            outputs.Add(await context.CallActivityAsync<string>("E1_SayHello", "Seattle"));
            outputs.Add(await context.CallActivityAsync<string>("E1_SayHello", "London"));

            // returns ["Hello Tokyo!", "Hello Seattle!", "Hello London!"]
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
