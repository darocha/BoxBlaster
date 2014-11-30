using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Microsoft.AspNet.SignalR;
using Microsoft.AspNet.SignalR.Hubs;

namespace BoxBlaster.Hubs
{
    public class Box
    {
        public string id { get; set; }
        public string connectionId { get; set; }
        public float x { get; set; }
        public float y { get; set; }
        public int kills { get; set; }
        public int deaths { get; set; }
        public int width { get; set; }
        public int height { get; set; }
    }

    public class Wall
    {
        public string id { get; set; }
        public float x { get; set; }
        public float y { get; set; }
        public int width { get; set; }
        public int height { get; set; }
    }

    //public class PewPew
    //{
    //    public string id { get; set; }
    //    public string sourceId { get; set; }
    //    public float x { get; set; }
    //    public float y { get; set; }
    //}

    [HubName("blasterHub")]
    public class Blaster : Hub
    {
        private List<Box> Boxes { get; set; }
        private List<Wall> Walls { get; set; }

        public Blaster()
        {
            Boxes = new List<Box>();
            Walls = new List<Wall>();
        }


        public override System.Threading.Tasks.Task OnConnected()
        {
            //loop through walls, adding to client
            Clients.Caller.;

            //loop through players
            return base.OnConnected();

        }

        public override System.Threading.Tasks.Task OnDisconnected(bool stopCalled)
        {
            var connectionId = Context.ConnectionId;
            var player = Boxes.Where(b => b.connectionId == connectionId).SingleOrDefault();
                //tell everyone that the player left
            Clients.Others.playerLeft(player.id);

            return base.OnDisconnected(stopCalled);
        }

        public void KilledPlayer(string killerId, string victimId)
        {
            Clients.Others.playerKilled(killerId, victimId);
        }

        public void PlayerMoved(string playerId, float x, float y)
        {
            Clients.Others.playerMoved(playerId, x, y);
        }

        public void Join(string playerId, float x, float y)
        {
            Clients.Others.playerJoined(playerId, x, y);
        }
    }
}