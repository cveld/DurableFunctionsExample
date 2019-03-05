using System;
using System.Collections.Generic;
using System.Text;

namespace FunctionApp.Models
{
    public class SubOrchestratorExampleModel
    {
        public string Input { get; set; }
        public int Progress { get; set; }
        bool Canceled { get; set; }
    }
}
