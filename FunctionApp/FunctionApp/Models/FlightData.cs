using System;
using System.Collections.Generic;
using System.Text;

namespace FunctionApp.Models
{
    public class FlightData
    {
        public string Lat { get; set; }
        public string lon { get; set; }
        public bool onground { get; set; }
        public long time { get; set; }
        public string heading { get; set; }
        public string callsign { get; set; }
        public string icao24 { get; set; }
    }
}
