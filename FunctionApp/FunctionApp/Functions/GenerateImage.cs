using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Extensions.Http;
using Microsoft.Extensions.Logging;
using SkiaSharp;
using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;

namespace FunctionApp
{
    public class GenerateImage
    {
        [FunctionName("GenerateImageFractal")]
        public static HttpResponseMessage GenerateImageFractal(
        [HttpTrigger(AuthorizationLevel.Anonymous, methods: "get")]
            HttpRequestMessage req,
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

            // crate a surface
            var info = new SKImageInfo(initdata.width, initdata.height);
            //var pixmap = new SKPixmap();
            //pixmap.

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
                using (var data = image.Encode(SKEncodedImageFormat.Png, 100))
                {
                    var response = new HttpResponseMessage();
                    response.Content = new StreamContent(data.AsStream());
                    response.StatusCode = System.Net.HttpStatusCode.OK;
                    response.Content.Headers.ContentType = new MediaTypeHeaderValue("image/png");
                    return response;
                }
            }
        }

        [FunctionName("GenerateImageBasic")]
        public static HttpResponseMessage GenerateImageBasic(
                [HttpTrigger(AuthorizationLevel.User, methods: "get")]
            HttpRequestMessage req,
                ILogger log)
        {
            // crate a surface
            var info = new SKImageInfo(256, 256);
            using (var surface = SKSurface.Create(info))
            {
                // the the canvas and properties
                var canvas = surface.Canvas;

                // make sure the canvas is blank
                canvas.Clear(SKColors.White);

                // draw some text
                var paint = new SKPaint
                {
                    Color = SKColors.Black,
                    IsAntialias = true,
                    Style = SKPaintStyle.Fill,
                    TextAlign = SKTextAlign.Center,
                    TextSize = 24
                };
                var coord = new SKPoint(info.Width / 2, (info.Height + paint.TextSize) / 2);
                canvas.DrawText("SkiaSharp", coord, paint);

                // save the file
                using (var image = surface.Snapshot())
                using (var data = image.Encode(SKEncodedImageFormat.Png, 100))
                {
                    var response = new HttpResponseMessage();
                    response.Content = new StreamContent(data.AsStream());
                    response.StatusCode = System.Net.HttpStatusCode.OK;
                    response.Content.Headers.ContentType = new MediaTypeHeaderValue("image/png");
                    return response;
                }
                //using (var stream = File.OpenWrite("output.png"))
                //{
                //    data.SaveTo(stream);
                //}
            }
        }
    }

}