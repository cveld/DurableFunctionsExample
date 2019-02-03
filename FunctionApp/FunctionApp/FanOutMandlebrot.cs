using System.Collections.Generic;
using System.Net.Http;
using System.IO;
using System.Net.Http.Headers;
using System.Threading.Tasks;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Extensions.Http;
using Microsoft.Azure.WebJobs.Host;
using Microsoft.Extensions.Logging;
using SkiaSharp;
using System.Linq;
using Microsoft.WindowsAzure.Storage;
using Microsoft.WindowsAzure.Storage.Blob;

namespace FunctionApp
{
    public static class FanOutMandlebrot
    {
        [FunctionName("FanOutMandlebrot")]
        public static async Task<List<string>> RunOrchestrator(
            [OrchestrationTrigger] DurableOrchestrationContext context)
        {
            var outputs = new List<string>();
          
            int maxIt = 5;
            var tasks = new Task<string>[maxIt];
            for (int i = 0; i < maxIt; i++)
            {
                tasks[i] = context.CallActivityAsync<string>(
                    "GenerateImageFractalFan",
                    $"MandleBrotImage_{i}");
            }

            await Task.WhenAll(tasks);
            var test = tasks.Select(t => t.Result).ToList();
            //var imageData = await context.CallActivityAsync<string>("GenerateImageFractalFan", "test");

            //outputs.Add(imageData);
            // returns ["Hello Tokyo!", "Hello Seattle!", "Hello London!"]
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


        [FunctionName("GenerateImageFractalFan")]
        public static string GenerateImageFractal(
                            [ActivityTrigger]
                            string name,
                            ILogger log)
        {
            FractalInit initdata = new FractalInit
            {
                height = 800,
                maxIterations = 128,
                width = 800,
                xMax = 1,
                xMin = -3,
                yMax = 2,
                yMin = -2
            };

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
                    CreateBlob($"run2/{name}.png", data);

                    return $"Finished - {name}";
                }
            }
        }


        private static void CreateBlob(string name, SKData data)
        {
            string accessKey;
            string accountName;
            string connectionString;
            CloudStorageAccount storageAccount;
            CloudBlobClient client;
            CloudBlobContainer container;
            CloudBlockBlob blob;

            accessKey = "Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==";//ConfigurationManager.AppSettings["CyotekStorageAccessKey"];
            accountName = "devstoreaccount1";//ConfigurationManager.AppSettings["CyotekStorageAccountName"];
            connectionString = $"UseDevelopmentStorage=true";//;DefaultEndpointsProtocol=https;AccountName={accountName};AccountKey={accessKey};EndpointSuffix=core.windows.net";
            storageAccount = CloudStorageAccount.Parse(connectionString);

            client = storageAccount.CreateCloudBlobClient();

            container = client.GetContainerReference("testing123");

            container.CreateIfNotExistsAsync();

            blob = container.GetBlockBlobReference(name);
            blob.Properties.ContentType = "image/png"; // could be application/octet-stream

            using (var stream = data.AsStream())
            {
                blob.UploadFromStreamAsync(stream);
            }
        }

        public class ImageData
        {
            public SKData _skData { get; set; }

            public ImageData(SKData skData)
            {
                _skData = skData;
            }

            public string GetSize()
            {
                return _skData.Size.ToString();
            }
        }
    }
}