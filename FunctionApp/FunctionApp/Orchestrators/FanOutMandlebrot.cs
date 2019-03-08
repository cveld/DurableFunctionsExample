using System.Collections.Generic;
using System.Net.Http;
using System.IO;
using System.Net.Http.Headers;
using System.Threading.Tasks;
using System.Drawing;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Extensions.Http;
using Microsoft.Azure.WebJobs.Host;
using Microsoft.Extensions.Logging;
using SkiaSharp;
using System.Linq;
using System.Net.Http;
using System;

using Microsoft.WindowsAzure.Storage;
using Microsoft.WindowsAzure.Storage.Blob;
using Microsoft.WindowsAzure.Storage.Table;
using Microsoft.Azure.WebJobs.Extensions.SignalRService;
using Newtonsoft.Json;
using Microsoft.AspNetCore.Mvc;
using System.Threading;

namespace FunctionApp
{
    public static class FanOutMandlebrot
    {
        [FunctionName("FanOutMandlebrot")]
        public static async Task<List<string>> RunOrchestrator(
            [OrchestrationTrigger] DurableOrchestrationContext context)
        {
            var outputs = new List<string>();

            const double speed = 4;
            const double startzoom = 2;

            int maxIt = 40;
            var tasks = new Task<string>[maxIt];
            for (int i = 0; i < maxIt; i++)
            {
                tasks[i] = context.CallActivityAsync<string>(
                    "GenerateImageFractalFan",
                    new FractalInput() { imageIndex = i, name = $"MandleBrotImage_{i}",
                        zoom = startzoom * Math.Pow((speed - 1.0) / speed, i)
                    });
                if (!context.IsReplaying) {
                    Thread.Sleep(5);
                }
            }

            await Task.WhenAll(tasks);
            var test = tasks.Select(t => t.Result).ToList();

            // Generate video
            await context.CallActivityAsync<string>("GenerateVideoFromImages", "video1");
        
            return test;
        }

        [FunctionName("FanOutMandlebrot_HttpStart")]
        public static async Task<HttpResponseMessage> HttpStart(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", "post")]HttpRequestMessage req,
            [OrchestrationClient]DurableOrchestrationClient starter,
            ILogger log)
        {
            // Function input comes from the request content.
            string instanceId = await starter.StartNewAsync("FanOutMandlebrot", null);

            log.LogInformation($"Started orchestration with ID = '{instanceId}'.");

            return starter.CreateCheckStatusResponse(req, instanceId);
        }
        
        [FunctionName("GenerateVideoFromImages")]
        public static string GenerateVideoFromImages([ActivityTrigger]string name, ILogger log)
        {
                return "NOT YET IMPLEMENTED";
        }


        public static string GetSequenceNumberFromBlobStore([ActivityTrigger] string name, ILogger log)
        {
            return "video1";
        }

        [FunctionName("FractalTester")]
        public static async Task<HttpResponseMessage> FractalTester(
        [HttpTrigger(AuthorizationLevel.Anonymous, methods: "post")]
            HttpRequestMessage req,
        ILogger log)
        {
            var body = await req.Content.ReadAsStringAsync();
            var input = JsonConvert.DeserializeObject<FractalInput>(body);
            await GenerateImageFractal(input, null, log);
            return new HttpResponseMessage(System.Net.HttpStatusCode.OK);
        }

        [FunctionName("GenerateImageFractalFan")]
        public static async Task<string> GenerateImageFractal(
                            [ActivityTrigger]
                            FractalInput input,
                            [SignalR(HubName = "carlintveld")] IAsyncCollector<SignalRMessage> signalRMessages,
                            ILogger log)
        {                                  
            FractalInit initdata = InitData(0, 0, input.zoom);            

            // Create a surface.
            var info = new SKImageInfo(initdata.width, initdata.height);

            using (var surface = SKSurface.Create(info))
            {
                var mandelbrot = new FractalMandelbrot(initdata);
                var bytes = mandelbrot.compute();

                // the the canvas and properties
                var canvas = surface.Canvas;

                for (int y = 0; y < initdata.height; y++)
                {
                    for (int x = 0; x < initdata.width; x++)
                    {
                        int index = 4 * (x + y * initdata.width);
                        canvas.DrawPoint(new SKPoint(x, y), new SKColor(bytes[index], bytes[index + 1], bytes[index + 2]));
                    }
                }
                
                using (var image = surface.Snapshot())
                {
                    SKData data = image.Encode(SKEncodedImageFormat.Png, 100);
                    await CreateBlob($"run3/{input.name}.png", data);

                    if (signalRMessages != null)
                    {
                        await signalRMessages.AddAsync(new SignalRMessage
                        {
                            Target = "FanoutEvent",
                            Arguments = new object[] { input.imageIndex, $"run3/{input.name}" }
                        });
                        await signalRMessages.FlushAsync();
                    }

                    return $"Finished - {input.name}";
                }
            }
        }


        private static async Task CreateBlob(string name, SKData data)
        {
            CloudStorageAccount storageAccount;
            CloudBlobClient client;
            CloudBlobContainer container;
            CloudBlockBlob blob;

            string connectionString = System.Environment.GetEnvironmentVariable("AzureStorageConnectionString", EnvironmentVariableTarget.Process);

            storageAccount = CloudStorageAccount.Parse(connectionString);

            client = storageAccount.CreateCloudBlobClient();

            container = client.GetContainerReference("testing123");

            await container.CreateIfNotExistsAsync();

            blob = container.GetBlockBlobReference(name);
            blob.Properties.ContentType = "image/png"; // could be application/octet-stream

            using (var stream = data.AsStream())
            {
                await blob.UploadFromStreamAsync(stream);
            }
        }

       static public FractalInit InitData(double x, double y, double zoom)
        {
            // source: https://www.youtube.com/watch?v=rDas5KThkUM
            // x = 0.250004192545193613127858564129342013402481966322603088153880158130118342411377044460335903569109029974830577473040521791862202620804388057367031844851715;
            // y = 0.0000000136723440278498956363855799786211940098275946182822890638711641266657225239686535941616043103142296320806428032888628485431058181507295587901452113878999;

            // source: <some other YouTube video>
            // x = -1.74995768370609350360221450607069970727110579726252077930242837820286008082972804887218672784431700831100544507655659531379747541999999995;
            // y = 0.00000000000000000278793706563379402178294753790944364927085054500163081379043930650189386849765202169477470552201325772332454726999999995;
            // source: https://github.com/lelandbatey/rust_mandelbrot/blob/master/src/main.rs
            // x = -0.74;
            // y = 0.0;

            // Playing 1:
            // x = -1.0771875;
            // y = -0.5267187499999999;
            // Playing 2:
            x = -0.9935419701538165;
            y = -0.3001399435157446;

            //x = 2;
            //y = 2;
            double x_min = x - zoom;
            double x_max = x + zoom;

            double y_min = y - zoom;
            double y_max = y + zoom;
            return new FractalInit
            {
                height = 800,
                maxIterations = 100,
                width = 800,
                xMax = x_max,
                xMin = x_min,
                yMax = y_max,
                yMin = y_min
            };
        }

        public class FractalInput
        {
            public int imageIndex { get; set; }
            public double zoom { get; set; }
            public string name { get; set; }
        }

        [FunctionName("GetSequenceNumber")]
        public static string GetSequenceNumber( [ActivityTrigger]FractalInput input, ILogger log)
        {
            string connectionString = System.Environment.GetEnvironmentVariable("AzureStorageConnectionString", EnvironmentVariableTarget.Process);
            CloudStorageAccount storageAccount = CloudStorageAccount.Parse(connectionString);
            var client = storageAccount.CreateCloudTableClient();
            var table = client.GetTableReference("Sequence");

            table.CreateIfNotExistsAsync();
           // var t = new TableEntity()
            var op = TableOperation.Insert(null);
            return "1";
        }
    }
}