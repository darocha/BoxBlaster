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
        public string name { get; set; }
        public string connectionId { get; set; }
        public float x { get; set; }
        public float y { get; set; }
        public int kills { get; set; }
        public int deaths { get; set; }
        public int width { get; set; }
        public int height { get; set; }
        public string color { get; set; }
        public string text_color { get; set; }

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
            foreach (var wall in Walls)
            {
                Clients.Caller.wallAdded(wall.id, wall.x, wall.y, wall.width, wall.height);
            }

            //loop through boxes, adding to client
            foreach (var box in Boxes)
            {
                Clients.Caller.existingPlayerLoad(box.id, box.x, box.y, box.name, box.kills, box.deaths, box.color, box.text_color);
            }

            //generate userid, prompt user for nickname
            var id = Guid.NewGuid().ToString();
            Clients.Caller.pickNickname(id);

            return base.OnConnected();

        }

        public override System.Threading.Tasks.Task OnDisconnected(bool stopCalled)
        {
            var connectionId = Context.ConnectionId;
            var player = Boxes.Where(b => b.connectionId == connectionId).SingleOrDefault();

            //tell everyone that the player left
            if (player != null && player.id != null)
                Clients.Others.playerLeft(player.id);

            Boxes.Remove(player);

            return base.OnDisconnected(stopCalled);
        }

        public void ReloadPlayer(string id)
        {
            var box = Boxes.Where(b => b.id == id).SingleOrDefault();
            if (box != null && box.id != null)
                Clients.Caller.existingPlayerLoad(box.id, box.x, box.y, box.name, box.kills, box.deaths, box.color, box.text_color);
        }

        public void ReloadWall(string id)
        {
            var wall = Walls.Where(b => b.id == id).SingleOrDefault();
            if (wall != null && wall.id != null)
                Clients.Caller.wallAdded(wall.id, wall.x, wall.y);

        }


        public void KilledPlayer(string killerId, string victimId)
        {
            // grab the objects for the killer and victim
            var killer = Boxes.Where(b => b.id == killerId).SingleOrDefault();
            var victim = Boxes.Where(b => b.id == victimId).SingleOrDefault();

            bool kFound = false;
            bool vFound = false;

            //increment their kills and deaths respectively
            if (killer != null && killer.id != null)
            {
                killer.kills++;
                kFound = true;
            }
            if (victim != null && victim.id != null)
            {
                victim.deaths++;
                vFound = true;
            }

            if (kFound && vFound)
                Clients.Others.playerKilled(killerId, victimId, killer.kills, victim.deaths);
        }

        public void PlayerMoved(string id, float x, float y)
        {
            var player = Boxes.Where(b => b.id == id).SingleOrDefault();

            if (player != null && player.id != null)
            {
                player.x = x;
                player.y = y;
                Clients.Others.playerMoved(id, x, y);
            }

        }

        public void PlayerJoin(string id, float x, float y, string name, string color, string text_color)
        {
            var player = new Box();
            player.id = id;
            player.x = x;
            player.y = y;
            player.name = name;
            player.color = color;
            player.text_color = text_color;
            player.kills = 0;
            player.deaths = 0;
            Boxes.Add(player);
            Clients.All.playerJoined(id, x, y, name, color, text_color);
        }

        public void ShotFired(string id, string sourceId, float mag, float dir, float x, float y)
        {
            Clients.Others.spawnPewPew(id, sourceId, mag, dir, x, y);
        }

        //fired by the owner of a pew to make sure everybody deleted it
        public void PewExploded(string id)
        {
            Clients.Others.explodePew(id);
        }

        public void WallMoved(string id, float x, float y)
        {
            var wall = Walls.Where(w => w.id == id).SingleOrDefault();

            if (wall != null && wall.id != null)
            {
                wall.x = x;
                wall.y = y;
                Clients.Others.wallMoved(id, x, y);
            }

        }

        public void WallAdded(string id, float x, float y, int width, int height)
        {
            if (Walls.Count >= 20)
            {
                Wall wall = new Wall();
                wall.id = id;
                wall.x = x;
                wall.y = y;
                wall.width = width;
                wall.height = height;

                Walls.Add(wall);

                Clients.Others.wallAdded(id, x, y, width, height);
            }
        }

        public void WallRemoved(string id)
        {
            var wall = Walls.Where(w => w.id == id).SingleOrDefault();

            Walls.Remove(wall);

            Clients.All.wallRemoved(id);
        }
    }
}