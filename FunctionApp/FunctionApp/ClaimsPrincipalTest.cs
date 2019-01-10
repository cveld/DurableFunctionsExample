using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Extensions.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text;

namespace FunctionApp1
{
    public class ClaimsPrincipalTest
    {
        [FunctionName("ClaimsPrincipalTestInjected")]
        public static IActionResult ClaimsPrincipalTestInjected([HttpTrigger(AuthorizationLevel.User)] HttpRequest req, ClaimsPrincipal claimsPrincipal)
        {
            var result = claimsPrincipal.Claims.Select((claim) =>
            {
                return new
                {
                    Type = claim.Type,
                    Value = claim.Value
                };
            });

            return new JsonResult(
                new
                {
                    authenticated = claimsPrincipal.Identity.IsAuthenticated,
                    claimsTotal = claimsPrincipal.Claims.Count(),
                    claims = result
                    
                    //identity = claimsPrincipal.Identity
                }
            );
        }
        [FunctionName("ClaimsPrincipalTestGlobal")]
        public static IActionResult ClaimsPrincipalTestGlobal([HttpTrigger(AuthorizationLevel.Anonymous)] HttpRequest req, ClaimsPrincipal claimsPrincipal)
        {
            var result = ClaimsPrincipal.Current.Claims.Select((claim) =>
            {
                return new
                {
                    Type = claim.Type,
                    Value = claim.Value
                };
            });

            return new JsonResult(
                new
                {
                    authenticated = ClaimsPrincipal.Current.Identity.IsAuthenticated,
                    claimsTotal = ClaimsPrincipal.Current.Claims.Count(),
                    claims = result                    
                }
            );
        }
    }
}
