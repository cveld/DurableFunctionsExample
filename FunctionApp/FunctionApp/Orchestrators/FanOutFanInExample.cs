using Microsoft.Azure.WebJobs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FunctionApp
{
    public class FanOutFanInExample
    {
        [FunctionName("FanOutFanInExample")]
        public static async Task<List<string>> Run(
            [OrchestrationTrigger] DurableOrchestrationContextBase context)
        {
            const int totalOfProcesses = 20;
            var tasks = new Task<string>[totalOfProcesses];
            for (int i = 0; i < totalOfProcesses; i++)
            {
                tasks[i] = context.CallSubOrchestratorAsync<string>("SubOrchestratorExample", $"Activity {i}");
            }

            await Task.WhenAll(tasks);

            //var list = new List<String>();
            return tasks.Select(t => t.Result).ToList();

        }
    }
}
