using System;
using System.Collections.Generic;
using System.Text;

namespace FunctionApp.Models
{
    public class OrchestratorDto
    {
        public string User { get; set; }
        public dynamic EventData { get; set; }
    }
}
