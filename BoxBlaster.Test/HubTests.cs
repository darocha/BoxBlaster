using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNet.SignalR.Hubs;
using Moq;
using NUnit;
using NUnit.Framework;
using BoxBlaster.Hubs;

namespace BoxBlaster.Test
{
    public class HubTests
    {
        [Test]
        public void BoxConstructorTest()
        {
            Box b = new Box();
            b.color = "red";
            b.deaths = 10;
        }

        [Test]
        public void ReloadWallTest()
        {
            Blaster b = new Blaster();
            b.ReloadWall("test");
        }
    }
}
