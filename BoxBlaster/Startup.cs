using System;
using System.Threading.Tasks;
using Microsoft.Owin;
using Owin;
using System.Web.Caching;

[assembly: OwinStartup(typeof(BoxBlaster.Startup))]

namespace BoxBlaster
{
    public class Startup
    {
        public static Cache BoxCache;
        public static Cache WallCache;

        public void Configuration(IAppBuilder app)
        {
            app.MapSignalR();
        }
    }
}
