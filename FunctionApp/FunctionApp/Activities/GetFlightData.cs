using FunctionApp.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Extensions.Http;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.IO;
using System.Text;

namespace FunctionApp.Activities
{
    public class GetFlightData
    {
        [FunctionName("GetFlightData")]
        public static JsonResult Run(
            [HttpTrigger(AuthorizationLevel.Anonymous)] HttpRequest req, ExecutionContext context,
            //[ActivityTrigger]object input,
            //[CosmosDBTrigger("demo", "flights", ConnectionStringSetting = "AzureWebJobsCosmosDBConnectionString")]              
            ILogger logger)
        {
            int row = 0;
            List<FlightData> flightDataList = new List<FlightData>();

            // Read CSV
            using (var reader = new StreamReader($"{context.FunctionAppDirectory}\\data\\data.csv"))
            {
                while (!reader.EndOfStream)
                {
                    var line = reader.ReadLine();
                    var values = line.Split(',');
                    if (row > 0)
                    {
                        var flightDataRow = new FlightData
                        {
                            Lat = values[0],
                            lon = values[1],
                            onground = Boolean.Parse(values[2]),
                            time = Int64.Parse(values[3]),
                            heading = values[4],
                            callsign = values[5],
                            icao24 = values[6]
                        };
                        flightDataList.Add(flightDataRow);
                    }
                    row++;
                }
            }

            return new JsonResult(new
            {
                rows = row,
                data = flightDataList
            });
        }
    }
}
