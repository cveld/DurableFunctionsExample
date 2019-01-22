using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text;

namespace FunctionApp
{
    public class Utility
    {
        public static string GetUserName(ClaimsPrincipal claimsPrincipal)
        {
            if (claimsPrincipal.Identity.IsAuthenticated)
            {
                var username = claimsPrincipal.Claims.Where(c => c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name").FirstOrDefault();
                return username != null ? username.Value : "admin";
            }

            return null;
        }
    }
}
