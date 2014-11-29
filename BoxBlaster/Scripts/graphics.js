$(function () {

    document.addEventListener("mousemove", mousemove);
    document.addEventListener("mousedown", mouseclick);
    document.addEventListener("keydown", keydown);
    document.addEventListener("keyup", keyup);

    //document.getElementById('wrapperDiv').addEventListener("keydown", keydown);
    //document.getElementById('wrapperDiv').addEventListener("keyup", keyup);

    var targetFPS = 25;
    var collisionThreshold = 100;
    //window.onresize = windowresize;


    var Point = (function () {
        function Point(x, y) {
            this.x = x || 0;
            this.y = y || 0;
        }

        return Point;
    })();

    var LineSegment = (function () {
        function LineSegment(point1, point2, name) {
            this.Point1 = point1 || new Point();
            this.Point2 = point2 || new Point();
            this.name = name || '';
        }

        return LineSegment;
    })();

    var Vector = (function () {
        function Vector(mag, dir) {
            this.magnitude = mag || 0;
            this.direction = dir || 0;

            this.SetDirectionFromPoints = function (origin, target) {
                if (origin instanceof Point && target instanceof Point) {
                    var deltaY = target.y - origin.y;
                    var deltaX = target.x - origin.x;
                    this.direction = Math.atan2(deltaY, deltaX);

                    return true;
                }
                else
                    return false;
            }

            this.GetRelativeEndPoint = function () {
                var endpoint = new Point();
                endpoint.y += this.magnitude * Math.sin(this.direction);
                endpoint.x += this.magnitude * Math.cos(this.direction);
                return endpoint;
            }

            // get the reflected vector based on the relative cardinal direction 
            this.GetReflectedOffDirection = function (cardDir) {
                var reflection = new Vector(this.magnitude, 0);
                switch (cardDir) {
                    case "N":
                        reflection.direction = -this.direction;
                        break;
                    case "S":
                        reflection.direction = -this.direction;
                        break;
                    case "E":
                        reflection.direction = Math.PI + this.direction;
                        break;
                    case "W":
                        reflection.direction = Math.PI - this.direction;
                        break;
                }

                return reflection;
            }
        }

        return Vector;
    })();


    var Box = (function () {
        function Box() {
            this.type = "Box";
            this.id = Math.floor((1 + Math.random()) * 0x10000).toString(16);
            this.name = "Troy";
            this.x = 25;
            this.y = 25;
            this.width = 30;
            this.height = 30;
            this.playPew = false;
            this.aim_x = 0;
            this.aim_y = 0;
            this.move_N = false,
            this.move_S = false,
            this.move_W = false,
            this.move_E = false;
            this.speed = Math.ceil(125 / targetFPS);
            this.color = "blue";
            this.aim_color = "red";
            this.text_color = "white";
            this.isDead = false;
            this.milsToRespawn = 5000;
            this.lastTOD = new Date();
            this.DrawToCanvasContext = function (ctx) {
                if (this.isDead && ((new Date() - this.lastTOD) > this.milsToRespawn)) {
                    this.respawn();
                    return;
                }

                if (!this.isDead) {
                    //execute this code if player is alive

                    //draw rectangle
                    ctx.fillStyle = this.color;
                    ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);

                    //draw aim
                    ctx.beginPath()
                    ctx.moveTo(this.x, this.y);
                    ctx.lineTo(this.aim_x, this.aim_y);
                    ctx.strokeStyle = this.aim_color;
                    ctx.stroke();

                    //add name
                    ctx.fillStyle = this.text_color;
                    ctx.fillText(this.name, this.x - this.width / 2, this.y - this.height / 4, this.width);
                }
                else {
                    //draw rectangle
                    ctx.fillStyle = "grey";
                    ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);

                    //add dead emoticon
                    ctx.fillStyle = "yellow";
                    ctx.fillText("X(", this.x - this.width / 2, this.y - this.height / 4, this.width);

                    //add dead emoticon
                    ctx.fillStyle = "yellow";
                    ctx.fillText("X(", this.x, this.y, this.width);

                    //add countdown
                    var counter = Math.ceil((this.milsToRespawn - (new Date() - this.lastTOD)) / 1000);
                    ctx.fillText(counter, this.x, this.y, this.width);

                }
            };

            this.respawn = function () {
                this.isDead = false;
                console.log(this.name + " respawned!");
            }

            this.GetLineSegments = function () {
                var topY = this.y - this.height / 2;
                var botY = this.y + this.height / 2;
                var leftX = this.x - this.width / 2;
                var rightX = this.x + this.width / 2;

                var topleft = new Point(leftX, topY);
                var topright = new Point(rightX, topY);
                var botleft = new Point(leftX, botY);
                var botright = new Point(rightX, botY);

                var segments = new Array();
                segments.push(new LineSegment(topleft, botleft)); // left side
                segments.push(new LineSegment(topleft, topright)); // top side
                segments.push(new LineSegment(topright, botright)); // right side
                segments.push(new LineSegment(botleft, botright)); // bottom side

                return segments;
            }

            this.MoveMe = function () {
                if (this.move_N) {
                    this.y -= this.speed;
                    checkForCollisions(this);
                }
                if (this.move_S){
                    this.y += this.speed;
                    checkForCollisions(this);
                }
                if (this.move_W){
                    this.x -= this.speed;
                    checkForCollisions(this);
                }
                if (this.move_E){
                    this.x += this.speed;
                    checkForCollisions(this);
                }

            };

            this.firePew = function () {
                var vector = new Vector(375 / targetFPS, 0);
                vector.SetDirectionFromPoints(new Point(this.x, this.y), new Point(this.aim_x, this.aim_y));
                var pewBox = new PewPew(vector);
                pewBox.sourceId = this.id;
                pewBox.x = this.x;
                pewBox.y = this.y;
                pewBox.MoveMe();
                PewPews.push(pewBox);
            };

            // what happens when this box hits something
            this.handleCollision = function (objHit) {
                console.log("Handling Box Collision!");
                //determine direction of hit
                var direction = relativeCardinalDirection(this, objHit);

                switch (objHit.type) {
                    case "Box": //the other box doesn't move, this box stops adjacent
                        moveAdjacent(this, objHit, direction);
                        break;
                    case "PewPew": //boxes don't hit pewpews, pewpews hit boxes
                        break;
                    case "Wall": //wall tries to move, this box stops adjacent
                        objHit.MoveMe(direction);
                        moveAdjacent(this, objHit, direction);
                        break;
                }
            }

            this.die = function (pewpew) {
                this.milsToRespawn = 5000;
                this.isDead = true;
            }
        }

        return Box;
    })();


    var Wall = (function () {
        function Wall() {
            this.type = "Wall";
            this.id = Math.floor((1 + Math.random()) * 0x10000).toString(16);
            this.x = 0;
            this.y = 0;
            this.width = 30;
            this.height = 30;
            this.color = "black";
            this.speed = Math.ceil(25 / targetFPS);

            //draw this wall to the context
            this.DrawToCanvasContext = function (ctx) {
                //draw rectangle
                ctx.fillStyle = this.color;
                ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);

            };

            this.GetLineSegments = function () {
                var topY = this.y - this.height / 2;
                var botY = this.y + this.height / 2;
                var leftX = this.x - this.width / 2;
                var rightX = this.x + this.width / 2;

                var topleft = new Point(leftX, topY);
                var topright = new Point(rightX, topY);
                var botleft = new Point(leftX, botY);
                var botright = new Point(rightX, botY);

                var segments = new Array();
                segments.push(new LineSegment(topleft, botleft, "left")); // left side
                segments.push(new LineSegment(topleft, topright, "top")); // top side
                segments.push(new LineSegment(topright, botright, "right")); // right side
                segments.push(new LineSegment(botleft, botright, "bottom")); // bottom side

                return segments;
            }

            this.MoveMe = function (dir) {
                switch (dir) {
                    case "N":
                        this.y -= this.speed;
                        break;
                    case "S":
                        this.y += this.speed;
                        break;
                    case "E":
                        this.x += this.speed;
                        break;
                    case "W":
                        this.x -= this.speed;
                        break;
                }

                checkForCollisions(this);
            };

            // what happens when this wall hits something
            this.handleCollision = function (objHit) {

                //determine direction of hit
                var direction = relativeCardinalDirection(this, objHit);

                switch (objHit.type) {
                    case "Box": //the box doesn't move, this wall stops adjacent
                        moveAdjacent(this, objHit, direction);
                        break;
                    case "PewPew": //walls don't hit pewpews, pewpews hit walls...
                        break;
                    case "Wall": //the other wall doesn't move, this wall stops adjacent
                        moveAdjacent(this, objHit, direction);
                        break;
                }
            }
        }

        return Wall;
    })();

    var PewPew = (function () {
        function PewPew(vector) {
            this.type = "PewPew";
            this.id = Math.floor((1 + Math.random()) * 0x10000).toString(16);
            this.sourceId = "";
            this.x = 0;
            this.y = 0;
            this.width = 4;
            this.height = 4;
            this.color = "black";
            this.vector = vector || new Vector();
            this.DrawToCanvasContext = function (ctx) {
                //draw rectangle
                ctx.fillStyle = this.color;
                ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);

            };

            this.GetLineSegments = function () {
                var topY = this.y - this.height / 2;
                var botY = this.y + this.height / 2;
                var leftX = this.x - this.width / 2;
                var rightX = this.x + this.width / 2;

                var topleft = new Point(leftX, topY);
                var topright = new Point(rightX, topY);
                var botleft = new Point(leftX, botY);
                var botright = new Point(rightX, botY);
                var center = new Point(this.x, this.y);
                var tailrel = this.vector.GetRelativeEndPoint();
                var tail = new Point(this.x - tailrel.x, this.y - tailrel.y);

                var segments = new Array();
                segments.push(new LineSegment(topleft, botleft)); // left side
                segments.push(new LineSegment(topleft, topright)); // top side
                segments.push(new LineSegment(topright, botright)); // right side
                segments.push(new LineSegment(botleft, botright)); // bottom side
                segments.push(new LineSegment(center, tail));

                return segments;
            }


            this.MoveMe = function () {
                var nextxy = this.vector.GetRelativeEndPoint();
                this.y += nextxy.y;
                this.x += nextxy.x;

                checkForCollisions(this);

            };

            // what happens when pewpew hits something
            this.handleCollision = function (objHit) {
                switch (objHit.type) {
                    case "Box": //pewpew disappears, box dies
                        removeObjectFromArray(PewPews, this);
                        objHid.die(this);
                        break;
                    case "PewPew": //both pewpews explode!
                        //calculate hit direction for both pewpews
                        var thisHitDir = relativeCardinalDirection(this, objHit);
                        var thatHitDir = getOppositeCardinalDirection(thisHitDir);

                        //calculate reflected vectors
                        var thisRefVec = this.vector.GetReflectedOffDirection(thisHitDir);
                        var thatRefVec = objHit.vector.GetReflectedOffDirection(thatHitDir);

                        //calculate spread
                        var thisSpread = Math.abs(Math.abs(thisRefVec.direction) - Math.PI / 2);
                        var thatSpread = Math.abs(Math.abs(thatRefVec.direction) - Math.PI / 2);

                        //calculate average x and y
                        var exp_x = (this.x + objHit.x) / 2;
                        var exp_y = (this.y + objHit.y) / 2;

                        //spawn the explosions
                        Explosions.push(new Explosion(thisRefVec, thisRefVec, exp_x, exp_y));
                        Explosions.push(new Explosion(thatRefVec, thatRefVec, exp_x, exp_y));

                        //remove the pewpews from the collection
                        removeObjectFromArray(PewPews, this);
                        removeObjectFromArray(PewPews, objHit);
                        break;
                    case "Wall": //pewpew exlodes!
                        //calculate hit direction for both pewpews
                        var thisHitDir = relativeCardinalDirection(this, objHit);

                        //calculate reflected vectors
                        var thisRefVec = this.vector.GetReflectedOffDirection(thisHitDir);

                        //calculate spread
                        var thisSpread = Math.abs(Math.abs(thisRefVec.direction) - Math.PI / 2);

                        //spawn the explosions
                        Explosions.push(new Explosion(thisRefVec, thisRefVec, this.x, this.y));

                        //remove the pewpews from the collection
                        removeObjectFromArray(PewPews, this);
                        break;
                }
            }

        }

        return PewPew;
    })();

    function getOppositeCardinalDirection(direction) {
        var oppDir = "";
        switch (cardDir) {
            case "N":
                oppDir = "S";
                break;
            case "S":
                oppDir = "N";
                break;
            case "E":
                oppDir = "W";
                break;
            case "W":
                oppDir = "E";
                break;
        }

        return oppDir;
    }

    var Explosion = (function () {
        function Explosion(vector, spread, x, y) {
            this.id = Math.floor((1 + Math.random()) * 0x10000).toString(16);
            this.type = "Explosion";
            this.frame = 0;
            this.maxFrames = 5;
            this.x = x;
            this.y = y;
            this.particles = CreateParticleArray(vector || new Vector(), spread || Math.PI * 2);

            //draw this explosion to the context
            this.DrawToCanvasContext = function (ctx) {
                this.frame++;

                if (this.frame > this.maxFrames) {
                    removeObjectFromArray(Explosions, this);
                    return;
                }

                var thisx = this.x;
                var thisy = this.y;

                this.particles.forEach(function (particle) {

                    var baseMag = particle.magnitude;
                    var frameMag;
                    if (this.frame == 1)
                        frameMag = Math.ceil(0.2 * baseMag);
                    else
                        frameMag = baseMag - baseMag / this.frame;

                    var endpoint = new Vector(frameMag, particle.direction).GetRelativeEndPoint();

                    var partx = thisx + endpoint.x;
                    var party = thisy + endpoint.y;
                    //draw particle
                    ctx.fillStyle = "black";
                    ctx.fillRect(partx - 1, party - 1, 2, 2);
                });

            };

            /// <returns type='Array' elementType='Vector'>Array of vectors</returns>
            var CreateParticleArray = function (vec, spr) {
                var particles = new Array();
                var partCount = randomBetween(4, 8) // random number between 4 and 8, inclusive
                var minDirection = vec.direction - spr / 2;
                var maxDirection = vec.direction + spr / 2;

                particles.push(new Vector(randomBetween(8, 15), minDirection));
                particles.push(new Vector(randomBetween(8, 15), maxDirection));

                for (var i = 0; i < partCount - 2; i++) {
                    var dir = randomBetween(minDirection * 10000, maxDirection * 10000) / 10000;
                    particles.push(new Vector(randomBetween(8, 15), dir));
                }

                return particles;
            }
        }

        return Explosion;
    })();

    function randomBetween(min, max, inc) {
        var _inc = inc || true;
        var _min = min;
        var _max = _max;
        if (_inc)
            _max++;
        return Math.floor(Math.random() * (_max - _min)) + _min;
    }

    // The N, S, E, W direction obj2 lies from obj1;
    function relativeCardinalDirection(obj1, obj2) {
        var deltaY = obj2.y - obj1.y;
        var deltaX = obj2.x - obj1.y;
        var direction;

        if (Math.abs(deltaY) > Math.abs(deltaX)) {
            if (deltaY > 0)
                direction = "S";
            else
                direction = "N";
        }
        else {
            if (deltaX > 0)
                direction = "E";
            else
                direction = "W";
        }

        return direction;
    }

    //move obj1 in cardinal direction adjacent to obj2
    function moveAdjacent(obj1, obj2, direction) {
        switch (direction) {
            case "N":
                obj1.y = obj2.y + (obj2.height + obj1.height) / 2;
                break;
            case "S":
                obj1.y = obj2.y - (obj2.height + obj1.height) / 2;
                break;
            case "E":
                obj1.x = obj2.x - (obj2.width + obj1.width) / 2;
                break;
            case "W":
                obj1.x = obj2.x + (obj2.width + obj1.width) / 2;
                break;
        }
    }

    var Boxes = new Array();
    var PewPews = new Array();
    var Explosions = new Array();
    var Walls = new Array();

    var counter = 0;
    var lastMessageTime = new Date();

    //var x = 25, y = 25;
    //var aim_x, aim_y;
    //var move_N = false,
    //   move_S = false,
    //    move_W = false,
    //    move_E = false;

    var MyBox = new Box();

    for (var i = 0; i < 20; i++) {
        var TestBox = new Box();
        TestBox.aim_color = "yellow";
        TestBox.color = "purple";
        TestBox.id = i;
        TestBox.name = "Test" + i;
        TestBox.x = 600 * Math.random();
        TestBox.y = 300 * Math.random();
        Boxes.push(TestBox);
    }

    for (var i = 0; i < 20; i++) {
        //Boxes[i] = null;
    }



    var tempCanvas = document.createElement("canvas");
    var drawCanvas = document.getElementById("canvas");
    drawCanvas.height = 300;//window.innerHeight;
    drawCanvas.width = 600;//window.innerWidth;

    var maxDist = Math.sqrt(Math.pow(drawCanvas.height, 2) + Math.pow(drawCanvas.width, 2));

    function windowresize() {
        drawCanvas.height = window.innerHeight;
        drawCanvas.width = window.innerWidth;
        maxDist = Math.sqrt(Math.pow(drawCanvas.height, 2) + Math.pow(drawCanvas.width, 2));
    }

    function mousemove(event) {
        var now = new Date();

        //console.log(now + " " + lastMessageTime)
        if (now - lastMessageTime >= 10) {
            lastMessageTime = now;
            counter++;

            var angle =

            //console.log("AimMsg#" + counter + " x: " + event.clientX + " y: " + event.clientY);
            //console.log("AimMsg#" + counter + " x: " + event.clientX + " y: " + event.clientY);
            MyBox.aim_x = event.clientX;
            MyBox.aim_y = event.clientY;
            Boxes.forEach(function (item) {
                item.aim_x = event.clientX;
                item.aim_y = event.clientY;
            });
        }
    }

    function keydown(event) {
        //console.log("Keydown: code =" + event.keyCode)
        switch (event.keyCode) {
            case 37:
            case 65:
                MyBox.move_W = true;
                event.preventDefault();
                break;
            case 38:
            case 87:
                MyBox.move_N = true;
                event.preventDefault();
                break;
            case 39:
            case 68:
                MyBox.move_E = true;
                event.preventDefault();
                break;
            case 40:
            case 83:
                MyBox.move_S = true;
                event.preventDefault();
                break;
            case 32:
                MyBox.playPew = !MyBox.playPew;
                event.preventDefault();
                break;
        }
        //event.preventDefault();
        //movebox();
    }

    function keyup(event) {
        //console.log("Keyup: code =" + event.keyCode)
        switch (event.keyCode) {
            case 37:
            case 65:
                MyBox.move_W = false;
                event.preventDefault();
                break;
            case 38:
            case 87:
                MyBox.move_N = false;
                event.preventDefault();
                break;
            case 39:
            case 68:
                MyBox.move_E = false;
                event.preventDefault();
                break;
            case 40:
            case 83:
                MyBox.move_S = false;
                event.preventDefault();
                break;
        }
        return false;

    }

    function movebox() {

        MyBox.MoveMe();

        PewPews.forEach(function (pew) {
            pew.MoveMe();
        });
        //if (MyBox.move_N)
        //   MyBox.y -= 5;
        //if (MyBox.move_S)
        //  MyBox.y += 5;
        //if (MyBox.move_W)
        //  MyBox.x -= 5;
        //if (MyBox.move_E)
        //  MyBox.x += 5;
    }

    function mouseclick(event) {
        //console.log("click event fired!");
        MyBox.firePew();
        // Gets quieter as you move away from origin
        //var dist = Math.sqrt(Math.pow(MyBox.x, 2) + Math.pow(MyBox.y, 2));
        //var pew = new Audio("Audio/pew.mp3");        
        //pew.volume = (maxDist - dist) / maxDist;
        //pew.play();

        playaudio();

        //event.preventDefault();
        //event.stopPropagation();
        //var worker = new Worker("Scripts/soundWorker.js");
        //worker.postMessage({ x: MyBox.x, y: MyBox.y, maxDist: maxDist });
    }

    function render() {
        tempCanvas.height = drawCanvas.offsetHeight;
        tempCanvas.width = drawCanvas.offsetWidth;
        var tctx = tempCanvas.getContext("2d");

        //first clear context
        tctx.fillStyle = "white";
        tctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);


        //TestBox.DrawToCanvasContext(tctx);
        Boxes.forEach(function (item) {
            item.DrawToCanvasContext(tctx);
        });
        PewPews.forEach(function (item) {
            item.DrawToCanvasContext(tctx);
        });
        Explosions.forEach(function (item) {
            item.DrawToCanvasContext(tctx);
        });


        MyBox.DrawToCanvasContext(tctx);

        //draw tempCanvas to drawCanvas
        var dctx = drawCanvas.getContext("2d");
        dctx.drawImage(tempCanvas, 0, 0);

    }

    function playaudio() {
        // Play pew sound
        // Gets quieter as you move away from origin
        if (MyBox.playPew == true) {
            var dist = Math.sqrt(Math.pow(MyBox.x, 2) + Math.pow(MyBox.y, 2));
            var pew = new Audio("Audio/pew.wav");
            pew.volume = (maxDist - dist) / maxDist;
            //pew.play();
            //MyBox.playPew = false;

            //Add pewpew to array
            MyBox.firePew();

        }
    }

    //    var gameLoop = window.setInterval(loopHandler, Math.floor(1000/targetFPS));
    //
    //    var counter = 0;
    //    function loopHandler() {
    //        counter++;
    //        render();
    //        movebox();
    //
    //        if (counter % Math.floor(targetFPS/3) == 0)
    //           playaudio();
    //    }



    var renderHandle = window.setInterval(render, 1000 / targetFPS);
    var moveDaemon = window.setInterval(movebox, 1000 / targetFPS);
    var audioDaemon = window.setInterval(playaudio, 300);

    //stackoverflow.com/questions/5767325/remove-specific-element-from-an-array
    function removeObjectFromArray(array, obj) {
        var index = arrayObjectIndexOf(array, obj.id, "id");
        if (index > -1) {
            array.splice(index, 1);
        }
    }


    //stackoverflow.com/questions/8668174/indexof-method-in-an-object-array
    function arrayObjectIndexOf(myArray, searchTerm, property) {
        for (var i = 0, len = myArray.length; i < len; i++) {
            if (myArray[i][property] === searchTerm) return i;
        }
        return -1;
    }

    //www.geeksforgeeks.org/check-if-two-given-line-segments-intersect
    // checks if colinear points are on a given lines segment
    function onSegment(p, q, r) {
        if (q.x <= Math.max(p.x, r.x) && q.x >= Math.min(p.x, r.x) &&
            q.y <= Math.max(p.y, r.y) && q.y >= Math.min(p.y, r.y))
            return true;

        return false;
    }

    //finds orientation of triplet
    //0 = colinear
    //1 = Clockwise
    //2 = Counterclockwise
    function orientation(p, q, r) {
        var val = (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);

        if (val == 0)
            return 0;

        return (val > 1) ? 1 : 2;
    }

    //determine if two line segments intersect
    function doIntersect(line1, line2) {
        var p1 = line1.Point1;
        var p2 = line1.Point2;
        var q1 = line2.Point1;
        var q2 = line2.Point2;

        var o1 = orientation(p1, q1, p2);
        var o2 = orientation(p1, q1, q2);
        var o3 = orientation(p2, q2, p1);
        var o4 = orientation(p2, q2, q1);

        //General case
        if (o1 != o2 && o3 != o4)
            return true;

        //Special cases
        // three point colinear with one point on other segment
        if (o1 == 0 && onSegment(p1, p2, q1)) return true;
        if (o2 == 0 && onSegment(p1, q2, q1)) return true;
        if (o3 == 0 && onSegment(p2, p1, q2)) return true;
        if (o4 == 0 && onSegment(p2, q1, q2)) return true;

        return false;
    }

    function checkForCollisions(obj) {
        switch (obj.type) {
            case "Box": //boxes can collide with other boxes and walls
                //check if there are box centers within 100 pixels
                // if it's too slow I'll optimize, for now check everyone
                Boxes.forEach(function (box) {
                    if (box.id != obj.id)
                        if (doObjectsIntersect(box, obj))
                            obj.handleCollision(box);
                });
                if (Walls != null)
                    Walls.forEach(function (wall) {
                        if (doObjectsIntersect(wall, obj))
                            obj.handleCollision(wall);
                    });
                break;
            case "PewPew": //pewpews can collide with walls, boxes, and other pewpews
                Boxes.forEach(function (box) {
                    if (doObjectsIntersect(box, obj))
                        obj.handleCollision(box);
                });
                if (Walls != null)
                    Walls.forEach(function (wall) {
                        if (doObjectsIntersect(wall, obj))
                            obj.handleCollision(wall);
                    });
                if (PewPews != null)
                    PewPews.forEach(function (pew) {
                        if (pew.id != obj.id)
                            if (doObjectsIntersect(pew, obj))
                                obj.handleCollision(pew);
                    });
                break;
            case "Wall": //walls can collide with other walls or with boxes
                Boxes.forEach(function (box) {
                    if (doObjectsIntersect(box, obj))
                        obj.handleCollision(box);
                });
                if (Walls != null)
                    Walls.forEach(function (wall) {
                        if (wall.id != obj.id)
                            if (doObjectsIntersect(wall, obj))
                                obj.handleCollision(wall);
                    });
                break;
        }
    }

    function doObjectsIntersect(obj1, obj2) {
        // if distance is greater than 50, ignore
        var deltaX = obj1.x - obj2.x;
        var deltaY = obj1.y - obj2.y;

        var dist = Math.sqrt(Math.pow(deltaX, 2) + Math.pow(deltaY, 2));
        if (dist > collisionThreshold)
            return false;

        var segments1 = obj1.GetLineSegments();
        var segments2 = obj2.GetLineSegments();

        //console.log("Checking object intersection");

        segments1.forEach(function (segment1) {
            segments2.forEach(function (segment2) {
                //console.log("Segment1: ");
                //console.log(segment1);
                //console.log("Segment2: ");
                //console.log(segment2);
                if (doIntersect(segment1, segment2))
                    return true;
            });
        });

        return false;
    }


    console.log(MyBox.GetLineSegments());
});