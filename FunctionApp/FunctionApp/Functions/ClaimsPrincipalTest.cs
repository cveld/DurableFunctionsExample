using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Extensions.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text;

namespace FunctionApp
{
    public class ClaimsPrincipalTest
    {
        public static JsonResult CreateJsonResultFromClaimsPrincipal(ClaimsPrincipal claimsPrincipal)
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
                    name = claimsPrincipal.Identity.Name,
                    claimsName = Utility.GetUserName(claimsPrincipal),
                    claimsTotal = claimsPrincipal.Claims.Count(),
                    claims = result

                    //identity = claimsPrincipal.Identity
                }
            );
        }

        [FunctionName("ClaimsPrincipalTestInjectedUser")]
        public IActionResult ClaimsPrincipalTestInjectedUser([HttpTrigger(AuthorizationLevel.User)] HttpRequest req, ClaimsPrincipal claimsPrincipal)
        {
            return CreateJsonResultFromClaimsPrincipal(claimsPrincipal);
        }

        [FunctionName("ClaimsPrincipalTestInjectedAnonymous")]
        public IActionResult ClaimsPrincipalTestInjectedAnonymous([HttpTrigger(AuthorizationLevel.Anonymous)] HttpRequest req, ClaimsPrincipal claimsPrincipal)
        {
            return CreateJsonResultFromClaimsPrincipal(claimsPrincipal);
        }


        [FunctionName("ClaimsPrincipalTestGlobal")]
        public IActionResult ClaimsPrincipalTestGlobal([HttpTrigger(AuthorizationLevel.Anonymous)] HttpRequest req)
        {
            return CreateJsonResultFromClaimsPrincipal(ClaimsPrincipal.Current);
        }
    }
}
