using FunctionApp.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Extensions.Http;
using Microsoft.Azure.WebJobs.Extensions.SignalRService;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Claims;
using System.Text;

namespace FunctionApp.Activities
{
    public class SendFlightDataSignalRActivityInput
    {
        public int index { get; set; }
        public int count { get; set; }
        public bool allplanes { get; set; }
    }

    public class SendFlightDataSignalR2_SupportOutput
    {
        public int Next { get; set; }
        public int Count { get; set; }
        public List<FlightData> Result { get; set; }
    }

    public class FlightDataDto
    {
        public List<FlightData> FirstFlights { get; set; }
        public List<FlightData> LatterFlights { get; set; }
    }

    public class GetFlightDataClass
    {
        public static List<FlightData> ReadFlightData(ExecutionContext context)
        {
            List<FlightData> flightDataList = new List<FlightData>();
            int row = 0;

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
                            Lon = values[1],
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

            // Sort flight data by time and filter strange timings away:
            var result = flightDataList.OrderBy(o => o.time).Where(o => o.time <= 1548115190).ToList();            
            return result;
        }

        public static FlightDataDto GetFlightDataHelper(ExecutionContext context)
        {
            var flightDataList = ReadFlightData(context);

           

            var firstResults = new List<FlightData>();
            var latterResults = new List<FlightData>();

            // Find all distinct flight codes:
            var codes = new HashSet<string>();
            foreach (var flight in flightDataList)
            {
                if (!codes.Contains(flight.icao24))
                {
                    codes.Add(flight.icao24);
                    firstResults.Add(flight);
                }
                else
                {
                    latterResults.Add(flight);
                }
            }

            return new FlightDataDto
            {
                FirstFlights = firstResults,
                LatterFlights = latterResults
            };
        }

        IEnumerable<string> GetAirplanes(IEnumerable<FlightData> flightData)
        {
            var seen = new HashSet<string>();
            foreach (var flight in flightData)
            {
                if (!seen.Contains(flight.icao24))
                {
                    seen.Add(flight.icao24);
                    yield return flight.icao24;
                }
            }
        }

        [FunctionName("GetFlightDataStatistics")]
        public static JsonResult GetFlightDataStatistics(
            [HttpTrigger(AuthorizationLevel.Anonymous)] HttpRequest req, ExecutionContext context,
            //[ActivityTrigger]object input,
            //[CosmosDBTrigger("demo", "flights", ConnectionStringSetting = "AzureWebJobsCosmosDBConnectionString")]              
            ILogger logger)
        {
            var list = ReadFlightData(context);   
            
            var dictionarytime = new Dictionary<long, List<FlightData>>();
            foreach (var item in list)
            {
                if (dictionarytime.ContainsKey(item.time))
                {
                    dictionarytime[item.time].Add(item);
                }
                else
                {
                    dictionarytime.Add(item.time, new List<FlightData>());
                    dictionarytime[item.time].Add(item);
                } 
            }

            var dictionaryplanes = new Dictionary<string, List<FlightData>>();
            foreach (var item in list)
            {
                if (dictionaryplanes.ContainsKey(item.icao24))
                {
                    dictionaryplanes[item.icao24].Add(item);
                }
                else
                {
                    dictionaryplanes.Add(item.icao24, new List<FlightData>());
                    dictionaryplanes[item.icao24].Add(item);
                }
            }

            var orderedset = dictionaryplanes.OrderByDescending(item => item.Value.Count);
            var limitedplanes = orderedset.Take(20).Select(i => i.Key);

            return new JsonResult(new
            {
                time = new
                {
                    size = dictionarytime.Count,
                    sizes = dictionarytime.Select((item) =>
                        {
                            return new { item.Key, item.Value.Count };
                        })
                },
                planes = new
                {
                    size = dictionaryplanes.Count,
                    sizes = orderedset.Select((item) =>
                    {
                        return new { item.Key, item.Value.Count };
                    })
                }
            });
        } // method

        [FunctionName("SendFlightDataSignalR2")]
        public static JsonResult SendFlightDataSignalR2(
           [HttpTrigger(AuthorizationLevel.Anonymous)] HttpRequest req, ExecutionContext context,
           //[ActivityTrigger]object input,
           //[CosmosDBTrigger("demo", "flights", ConnectionStringSetting = "AzureWebJobsCosmosDBConnectionString")]              
           [SignalR(HubName = "carlintveld")] IAsyncCollector<SignalRMessage> signalRMessages,
           ILogger logger)
        {
            var result = Int32.TryParse(req.GetQueryParameterDictionary()["index"], out int index);
            var result2 = Int32.TryParse(req.GetQueryParameterDictionary()["count"], out int count);

            return new JsonResult(SendFlightDataSignalR2_Support(index, count, context, signalRMessages, logger));
        }



        [FunctionName("SendFlightDataSignalRActivity")]
        public static int SendFlightDataSignalRActivity(
   ExecutionContext context,
   [ActivityTrigger]SendFlightDataSignalRActivityInput input,   
   [SignalR(HubName = "carlintveld")] IAsyncCollector<SignalRMessage> signalRMessages,
   ILogger logger)
        {
            var result = SendFlightDataSignalR2_Support(input.index, input.count, context, signalRMessages, logger, allplanes: true);
            return result.Next;
        }


        public static SendFlightDataSignalR2_SupportOutput SendFlightDataSignalR2_Support(int index, int count,
           ExecutionContext context,
           //[ActivityTrigger]object input,
           //[CosmosDBTrigger("demo", "flights", ConnectionStringSetting = "AzureWebJobsCosmosDBConnectionString")]              
           IAsyncCollector<SignalRMessage> signalRMessages,
           ILogger logger, bool allplanes = false)
        {
            var list = ReadFlightData(context);

            var dictionarytime = new Dictionary<long, List<FlightData>>();
            foreach (var item in list)
            {
                if (dictionarytime.ContainsKey(item.time))
                {
                    dictionarytime[item.time].Add(item);
                }
                else
                {
                    dictionarytime.Add(item.time, new List<FlightData>());
                    dictionarytime[item.time].Add(item);
                }
            }

            var dictionaryplanes = new Dictionary<string, List<FlightData>>();
            foreach (var item in list)
            {
                if (dictionaryplanes.ContainsKey(item.icao24))
                {
                    dictionaryplanes[item.icao24].Add(item);
                }
                else
                {
                    dictionaryplanes.Add(item.icao24, new List<FlightData>());
                    dictionaryplanes[item.icao24].Add(item);
                }
            }

            var orderedset = dictionaryplanes.OrderByDescending(item => item.Value.Count);
            var limitedplanes = orderedset.Take(20).Select(i => i.Key).ToHashSet();

           
            var timeitem = dictionarytime.Skip(index).Take(1).First();

            var resultlist = new List<FlightData>();


            foreach (var flight in timeitem.Value)
            {
                if (limitedplanes.Contains(flight.icao24))
                {
                    resultlist.Add(flight);
                    if (!allplanes)
                    {
                        signalRMessages.AddAsync(new SignalRMessage
                        {
                            Target = "flightEvent",
                            Arguments = new[] { flight }
                        });
                    }
                }
            }
            if (allplanes)
            {
                signalRMessages.AddAsync(new SignalRMessage
                {
                    Target = "flightEvent",
                    Arguments = new[] { resultlist }
                });
            }

            

            return new SendFlightDataSignalR2_SupportOutput { 
                    Next = (index + 15) % dictionarytime.Count,
                    Count = resultlist.Count,
                    Result = resultlist
                };
        } // method

        [FunctionName("GetFlightData")]
        public static JsonResult GetFlightData(
            [HttpTrigger(AuthorizationLevel.Anonymous)] HttpRequest req, ExecutionContext context,
            //[ActivityTrigger]object input,
            //[CosmosDBTrigger("demo", "flights", ConnectionStringSetting = "AzureWebJobsCosmosDBConnectionString")]              
            ILogger logger)
        {
            var result = GetFlightDataHelper(context);

            return new JsonResult(new
            {                
                firstResults = result.FirstFlights,
                latterResults = result.LatterFlights
            });
        } // method

        [FunctionName("SendSignalRFlight")]
        public static IActionResult SendSignalRFlight(
    [HttpTrigger(AuthorizationLevel.Anonymous)] HttpRequest req, ExecutionContext context,
    //[CosmosDBTrigger("demo", "flights", ConnectionStringSetting = "AzureWebJobsCosmosDBConnectionString")]              
    [SignalR(HubName = "carlintveld")] IAsyncCollector<SignalRMessage> signalRMessages, ClaimsPrincipal claimsPrincipal)
        {
            var flights = GetFlightDataHelper(context);
            int index = Int32.Parse(req.GetQueryParameterDictionary()["index"]);
            var result = Int32.TryParse(req.GetQueryParameterDictionary()["take"], out int take);
            var result2 = Int32.TryParse(req.GetQueryParameterDictionary()["skip"], out int skip);
            if (index == -1)
            {
                if (!result || !result2)
                {
                    return new JsonResult("NOK; take and skip parameters required");
                }
                // Flush complete set of first flights:
                foreach (var flight in flights.FirstFlights.Skip(skip).Take(take)) {
                    signalRMessages.AddAsync(new SignalRMessage
                    {
                        Target = "flightEvent",
                        Arguments = new[] { flight }
                    });
                }
            }
            if (index >= 0)
            {
                // Flush a specific "latter" flight:
                signalRMessages.AddAsync(new SignalRMessage
                {
                    Target = "flightEvent",
                    Arguments = new[] { flights.LatterFlights[index] }
                });
            }

            signalRMessages.FlushAsync().Wait();
            //return new JsonResult($"OK {claimsPrincipal.Identity.Name}");
            return new JsonResult(new
            {
                index = index,
                firstFlights = flights.FirstFlights.Count,
                latterFlights = flights.LatterFlights.Count
            });
        }

    }
}
