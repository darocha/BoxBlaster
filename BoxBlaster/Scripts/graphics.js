$(function () {


    function adjustVolume() {
        masterVolume = document.getElementById('volumeSlider').value;
    }

    function changeColor() {
        MyBox.color = document.getElementById('colorPicker').value;
        MyBox.text_color = getComplementaryColor(MyBox.color);
        srPlayerChangedColor(MyBox.id, MyBox.color, MyBox.text_color)
    }

    function toggleLaser() {
        MyBox.renderAim = document.getElementById("laserToggle").checked;
    }

    var masterVolume = 1;

    //don't change targetFPS, all the movement rates are derived from it (I know, not the wisest choice...)
    var targetFPS = 25;
    var collisionThreshold = 100;


    //window.onresize = windowresize;
    var MyId;

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
            this.id = Math.floor((1 + Math.random()) * 0x1000000).toString(16);
            this.name = "Troy";
            this.x = 25;
            this.y = 25;
            this.width = 40;
            this.height = 40;
            this.playPew = false;
            this.kills = 0;
            this.deaths = 0;
            this.aim_x = 0;
            this.aim_y = 0;
            this.renderAim = true;
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

                //only respawn myself
                if (this.id == MyBox.id)
                    if (this.isDead && ((new Date() - this.lastTOD) > this.milsToRespawn)) {
                        this.respawn();
                        return;
                    }

                if (!this.isDead) {
                    //execute this code if player is alive


                    //draw rectangle
                    ctx.fillStyle = this.color;
                    ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);

                    //draw outline
                    ctx.beginPath()
                    ctx.moveTo(this.x - this.width / 2, this.y - this.height / 2);
                    ctx.lineTo(this.x + this.width / 2, this.y - this.height / 2);
                    ctx.lineTo(this.x + this.width / 2, this.y + this.height / 2);
                    ctx.lineTo(this.x - this.width / 2, this.y + this.height / 2);
                    ctx.lineTo(this.x - this.width / 2, this.y - this.height / 2);
                    ctx.strokeStyle = "black";
                    ctx.stroke();

                    //draw aim, if enabled
                    if (this.renderAim) {
                        ctx.beginPath()
                        ctx.moveTo(this.x, this.y);
                        ctx.lineTo(this.aim_x, this.aim_y);
                        ctx.strokeStyle = this.aim_color;
                        ctx.stroke();
                    }

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

                    //add countdown
                    var counter = Math.ceil((this.milsToRespawn - (new Date() - this.lastTOD)) / 1000);
                    if (counter < 0)
                        counter = 0;
                    ctx.fillText(counter, this.x, this.y, this.width);

                }
            };

            this.respawn = function () {
                this.isDead = false;

                var collisions = true;
                var count = 0;

                while (collisions && count < 10) {
                    // based on hard coded 600 x 450 playfield
                    var switchVar = randomBetween(1, 4);
                    //console.log(switchVar);
                    switch (switchVar) {
                        case 1:
                            // top row
                            //console.log("top");
                            this.x = randomBetween(this.width / 2 + 1, 599 - this.width / 2);//Math.floor((600 - 3 * this.width) * Math.random() + this.width * 1.5);
                            this.y = this.width / 2 + 1;
                            break;
                        case 2:
                            // bottom row
                            //console.log("bottom");
                            this.x = randomBetween(this.width / 2 + 1, 599 - this.width / 2);//Math.floor((600 - 3 * this.width) * Math.random() + this.width * 1.5);
                            this.y = 450 - this.width / 2 - 1;
                            break;
                        case 3:
                            // left side
                            //console.log("left");
                            this.x = this.width / 2 + 1;
                            this.y = randomBetween(this.height / 2 + 1, 449 - this.height / 2); //Math.floor(360 * Math.random() + 45);
                            break;
                        case 4:
                            // right side
                            //console.log("right");
                            this.x = 600 - this.width / 2 - 1;
                            this.y = randomBetween(this.height / 2 + 1, 449 - this.height / 2); //Math.floor(360 * Math.random() + 45);
                            break;
                        default:
                            // something got screwed up, put it anywhere...
                            //console.log("DEFAULT");
                            this.x = Math.floor(558 * Math.random() + 21);
                            this.y = Math.floor(408 * Math.random() + 21);
                            break;
                    }

                    //help collision detection
                    //this.x += Math.random() / 2.01;
                    //this.y += Math.random() / 2.01;

                    collisions = checkForSpawnCollisions(this);
                    count++;
                }

                //notify signalr that you moved
                srPlayerRespawned(this.id, this.x, this.y);

                console.log(this.name + " respawned! Took " + count + " tries!");
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
                //dead boxes don't move
                if (this.isDead)
                    return;

                var moving = false;
                if (this.move_N) {
                    this.y -= this.speed;
                    checkForCollisions(this);
                    moving = true;
                }
                if (this.move_S) {
                    this.y += this.speed;
                    checkForCollisions(this);
                    moving = true;
                }
                if (this.move_W) {
                    this.x -= this.speed;
                    checkForCollisions(this);
                    moving = true;
                }
                if (this.move_E) {
                    this.x += this.speed;
                    checkForCollisions(this);
                    moving = true;
                }

                if (moving)
                    if (this.id == MyBox.id)
                        srPlayerMoved(this.id, this.x, this.y);

            };

            this.firePew = function () {

                //you must be alive to shoot...
                if (this.isDead)
                    return;

                //selective loggin
                console.log(this.text_color);

                var vector = new Vector(375 / targetFPS, 0);
                vector.SetDirectionFromPoints(new Point(this.x, this.y), new Point(this.aim_x, this.aim_y));
                var pewBox = new PewPew(vector);
                pewBox.sourceId = this.id;
                pewBox.x = this.x;
                pewBox.y = this.y;
                pewBox.MoveMe();
                pewBox.PEW();
                PewPews.push(pewBox);

                //this should always be true...
                if (this.id == MyBox.id)
                    srShotFired(pewBox.id, //id
                                this.id, //sourceId
                                pewBox.vector.magnitude,
                                pewBox.vector.direction,
                                pewBox.x,
                                pewBox.y);
            };

            // what happens when this box hits something
            this.handleCollision = function (objHit) {
                //console.log("Handling Box Collision!");
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
                this.lastTOD = new Date();
                this.isDead = true;
                this.move_N = false;
                this.move_S = false;
                this.move_W = false;
                this.move_E = false;
                this.deaths++;
                updatePlayerOnLeaderboard(this);

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
            this.isBoundary = false;

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
                srWallMoved(this.id, this.x, this.y);
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
                        this.SPLAT();

                        //if the target box was alive, kill it and record the kill
                        //nice shootin tex!
                        if (!objHit.isDead) {
                            objHit.die(this);
                            var killer = getObjectFromArray(Boxes, this.sourceId);
                            killer.kills++;
                            updatePlayerOnLeaderboard(killer);

                            //if the player did it, notify signalr
                            if (this.sourceId == MyBox.id)
                                srKilledPlayer(this.id, objHit.id)
                        }
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

                        //create explosions, play first BOOM
                        var explosion1 = new Explosion(thisRefVec, thisRefVec, exp_x, exp_y);
                        var explosion2 = new Explosion(thatRefVec, thatRefVec, exp_x, exp_y);
                        explosion1.BOOM();

                        //animate explosions
                        Explosions.push(explosion1);
                        Explosions.push(explosion2);

                        //remove the pewpews from the collection
                        removeObjectFromArray(PewPews, this);
                        removeObjectFromArray(PewPews, objHit);
                        break;
                    case "Wall": //pewpew exlodes!
                        //calculate hit direction for both pewpews
                        //var thisHitDir = relativeCardinalDirection(this, objHit);
                        var thisHitDir = relativeCardinalDirection(objHit, this);

                        //calculate reflected vectors
                        var thisRefVec = this.vector.GetReflectedOffDirection(thisHitDir);

                        //calculate spread
                        var thisSpread = Math.abs(Math.abs(thisRefVec.direction) - Math.PI / 2);

                        //create explosion, play BOOM
                        var explosion = new Explosion(thisRefVec, thisRefVec, this.x, this.y);
                        explosion.BOOM();

                        //spawn the explosions
                        Explosions.push(explosion);

                        //remove the pewpews from the collection
                        removeObjectFromArray(PewPews, this);
                        break;
                }
            }

            // make this pewpew explode
            this.Explode = function () {

                //create a new explosion
                var explosion = new Explosion(new Vector(), new Vector(), this.x, this.y);
                explosion.BOOM();
                Explosions.push(explosion);
                removeObjectFromArray(PewPews, this);
            }

            // play the pewpew sound
            this.PEW = function () {
                var pew = new Audio("Audio/pew.mp3");
                //this is loud and annoying, the .75 makes it a bit less so
                pew.volume = getVolumeFactor(MyBox, this) * .75;
                pew.volume *= masterVolume;
                pew.play();
            }

            // play the pewpew sound
            this.SPLAT = function () {
                var splat = new Audio("Audio/splat.mp3");
                splat.volume = getVolumeFactor(MyBox, this) * .5;
                splat.volume *= masterVolume;
                splat.play();
            }

        }

        return PewPew;
    })();

    //finds volume adjustment factor based on distance between two objects
    function getVolumeFactor(origin, target) {
        var deltaX = origin.x - target.x;
        var deltaY = origin.y - target.y;

        var dist = Math.sqrt(Math.pow(deltaX, 2) + Math.pow(deltaY, 2));
        var factor = (maxDist - dist) / maxDist;

        if (factor > 1)
            return 1;
        if (factor < 0)
            return 0;
        return factor;

    }

    function getOppositeCardinalDirection(direction) {
        var oppDir = "";
        switch (direction) {
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


            //draw this explosion to the context
            this.DrawToCanvasContext = function (ctx) {
                this.frame++;

                if (this.frame > this.maxFrames) {
                    removeObjectFromArray(Explosions, this);
                    return;
                }

                //www.html5canvastutorials.com/tutorials/html5-canvas-circles/
                //www.html5canvastutorials.com/tutorials/html5-canvas-radial-gradients/
                var centerX = this.x;
                var centerY = this.y;
                var radius = 15 - (15 / this.frame) + 2;

                ctx.beginPath();
                ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);

                // create radial gradient
                var grd = ctx.createRadialGradient(centerX, centerY, radius / 5, centerX, centerY, radius * 1.25);
                grd.addColorStop(0, 'yellow');
                grd.addColorStop(1, 'red');

                ctx.fillStyle = grd;
                ctx.fill();

                // This Particle stuff didn't work right and the radial explosions look good...
                //var thisx = this.x;
                //var thisy = this.y;

                //this.particles.forEach(function (particle) {

                //    var baseMag = particle.magnitude;
                //    var frameMag;
                //    if (this.frame == 1)
                //        frameMag = Math.ceil(0.2 * baseMag);
                //    else
                //        frameMag = baseMag - baseMag / this.frame;
                //
                //    var endpoint = new Vector(frameMag, particle.direction).GetRelativeEndPoint();
                //
                //    var partx = thisx + endpoint.x;
                //    var party = thisy + endpoint.y;
                //draw particle
                //    ctx.fillStyle = "black";
                //    ctx.fillRect(partx - 1, party - 1, 2, 2);
                //});

            };


            /// <returns type='Array' elementType='Vector'>Array of vectors</returns>
            //var CreateParticleArray = function (vec, spr) {
            //    var particles = new Array();
            //    var partCount = randomBetween(4, 8) // random number between 4 and 8, inclusive
            //    var minDirection = vec.direction - spr / 2;
            //    var maxDirection = vec.direction + spr / 2;

            //    particles.push(new Vector(randomBetween(8, 15), minDirection));
            //    particles.push(new Vector(randomBetween(8, 15), maxDirection));

            //    for (var i = 0; i < partCount - 2; i++) {
            //        var dir = randomBetween(minDirection * 10000, maxDirection * 10000) / 10000;
            //        particles.push(new Vector(randomBetween(8, 15), dir));
            //    }

            //    return particles;
            //}
            //this.particles = CreateParticleArray(vector || new Vector(), spread || Math.PI * 2);


            // play the explosion sound
            this.BOOM = function () {
                var boom = new Audio("Audio/Boom.mp3");
                boom.volume = getVolumeFactor(MyBox, this);
                boom.volume *= masterVolume;
                boom.play();
            }
        }

        return Explosion;
    })();

    // return a random integer between two numbers
    function randomBetween(min, max, inc) {
        var _inc = inc || true;
        var _min = min;
        var _max = max;
        if (_inc)
            _max++;
        return Math.floor(Math.random() * (_max - _min)) + _min;
    }

    // The N, S, E, W direction obj2 lies from obj1;
    function relativeCardinalDirection(obj1, obj2) {
        var deltaY = obj2.y - obj1.y;
        var deltaX = obj2.x - obj1.x;
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
        //console.log(direction);
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



    //create the side boundaries
    var x1 = -15;
    //var x2 = -15;
    var x3 = 615;
    //var x4 = 645;
    for (var i = 0; i < (450 / 30) + 2; i++) {
        var wall1 = new Wall();
        wall1.x = x1;
        wall1.y = -45 + i * 30;
        wall1.width = 30;
        wall1.height = 30;
        wall1.isBoundary = true;
        wall1.MoveMe = function () { };
        Walls.push(wall1);

        //var wall2 = new Wall();
        //wall2.x = x2;
        //wall2.y = -45 + i * 30;
        //Walls.push(wall2);

        var wall3 = new Wall();
        wall3.x = x3;
        wall3.y = -45 + i * 30;
        wall3.width = 30;
        wall3.height = 30;
        wall3.isBoundary = true;
        wall3.MoveMe = function () { };
        Walls.push(wall3);

        //var wall4 = new Wall();
        //wall4.x = x4;
        //wall4.y = -45 + i * 30;
        //Walls.push(wall4);
    }

    //create the top and bottom boundaries
    var y1 = -15;
    //var y2 = -15;
    var y3 = 465;
    //var y4 = 345;
    for (var i = 0; i < (600 / 30) ; i++) {
        var wall1 = new Wall();
        wall1.x = 15 + i * 30;
        wall1.y = y1;
        wall1.width = 30;
        wall1.height = 30;
        wall1.isBoundary = true;
        wall1.MoveMe = function () { };
        Walls.push(wall1);

        //var wall2 = new Wall();
        //wall2.x = -45 + i * 30;
        //wall2.y = y2;
        //Walls.push(wall2);

        var wall3 = new Wall();
        wall3.x = 15 + i * 30;
        wall3.y = y3;
        wall3.width = 30;
        wall3.height = 30;
        wall3.isBoundary = true;
        wall3.MoveMe = function () { };
        Walls.push(wall3);

        //var wall4 = new Wall();
        //wall4.x = -45 + i * 30;
        //wall4.y = y4;
        //Walls.push(wall4);
    }




    //Add dummy playerboxes for testing
    //for (var i = 0; i < 5; i++) {
    //    var test = new Box();
    //    test.color = "purple";
    //    test.text_color = "yellow";
    //    test.name = "TEST" + i;
    //    test.renderAim = false;
    //    test.respawn();
    //    addPlayerToLeaderboard(test);

    //    //console.log("Count for box " + i + ": " + count);
    //    Boxes.push(test);
    //}

    //console.log(Boxes);

    var tempCanvas = document.createElement("canvas");
    var drawCanvas = document.getElementById("canvas");
    drawCanvas.height = 450;//window.innerHeight;
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
        if (now - lastMessageTime >= 40) {
            lastMessageTime = now;
            counter++;

            //var angle =

            //console.log("AimMsg#" + counter + " x: " + event.layerX + " y: " + event.layerY);
            //console.log("AimMsg#" + counter + " x: " + event.clientX + " y: " + event.clientY);
            MyBox.aim_x = event.layerX;
            MyBox.aim_y = event.layerY;
            //Boxes.forEach(function (item) {
            //    item.aim_x = event.clientX;
            //    item.aim_y = event.clientY;
            //});
        }

        return false;
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

        //playaudio();

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
        Walls.forEach(function (item) {
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





    //stackoverflow.com/questions/5767325/remove-specific-element-from-an-array
    function removeObjectFromArray(array, obj) {
        var index = arrayObjectIndexOf(array, obj.id, "id");
        if (index > -1) {
            array.splice(index, 1);
        }
    }

    function getObjectFromArray(array, id) {
        var index = arrayObjectIndexOf(array, id, "id");
        if (index > -1)
            return array[index];
        else
            return null;
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
        var val = ((q.y - p.y) * (r.x - q.x)) - ((q.x - p.x) * (r.y - q.y));
        if (val == 0)
            return 0;

        var orientation = val > 0 ? 1 : 2;
        return orientation;
    }

    //determine if two line segments intersect
    function doIntersect(line1, line2) {
        var p1 = line1.Point1;
        var q1 = line1.Point2;
        var p2 = line2.Point1;
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
                //console.log("checking for box collision!");
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
                    if (box.id != obj.sourceId)
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
                        if (pew.sourceId != obj.sourceId)
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

    function checkForSpawnCollisions(obj) {
        var collision = false;
        //console.log(obj.type);
        switch (obj.type) {
            case "Box": //boxes can collide with other boxes and walls
                //console.log("checking for box collision!");
                Boxes.forEach(function (box) {
                    if (box.id != obj.id)
                        if (doObjectsIntersect(box, obj))
                            collision = true;
                });

                Walls.forEach(function (wall) {
                    if (doObjectsIntersect(wall, obj))
                        collision = true;
                });
                break;
            case "Wall": //walls can collide with other walls or with boxes
                //Boxes.forEach(function (box) {
                //    if (doObjectsIntersect(box, obj))
                //        collision = true;
                //});

                Walls.forEach(function (wall) {
                    if (wall.id != obj.id)
                        if (doObjectsIntersect(wall, obj)) {
                            collision = true;
                            //console.log(wall);
                        }
                });
                break;
        }

        return collision;
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
        var collision = false;

        //console.log("Checking object intersection");

        segments1.some(function (segment1) {
            segments2.some(function (segment2) {
                if (doIntersect(segment1, segment2)) {
                    //console.log("Collision!");
                    collision = true;
                    return true;
                }
            });
        });

        return collision;
    }



    //    function GetSelf() {
    //        var index = arrayObjectIndexOf()
    //    }

    function joinGame(box) {


    }

    function addPlayerToLeaderboard(box) {
        var leaderboard = document.getElementById("scores");
        var player = document.createElement("tr");
        player.setAttribute("id", box.id);
        player.setAttribute("class", "lb_row");
        player.innerHTML = //'<div class="lb_row" id="' + box.id +'">' +
                            '<td class="lb_name">' + box.name + '</td>' +
                            '<td class="lb_kills">0</td>' +
                            '<td class="lb_deaths">0</td>';// +
        //'</div>';
        leaderboard.appendChild(player);
    }

    function removePlayerFromLeaderboard(box) {
        var leaderboard = document.getElementById("scores");
        var player = document.getElementById(box.id);
        leaderboard.removeChild(player);
    }

    function updatePlayerOnLeaderboard(box) {
        var player = document.getElementById(box.id);
        var kills = player.getElementsByClassName("lb_kills")[0];
        var deaths = player.getElementsByClassName("lb_deaths")[0];
        kills.innerText = box.kills;
        deaths.innerText = box.deaths;
    }

    //console.log(MyBox.GetLineSegments());

    //var ls1 = new LineSegment(new Point(0, 0), new Point(1, 3));
    //var ls2 = new LineSegment(new Point(1, 0), new Point(0, 1));

    //if (doIntersect(ls1, ls2))
    //    console.log("doIntersect success!");
    //else
    //    console.log("doIntersect failed X(");

    //if (doIntersect(ls1, ls1))
    //    console.log("doIntersect success!");
    //else
    //    console.log("doIntersect failed X(");

    /**


    //color manipulation code from:
    //stackoverflow.com/questions/2353211/hsl-to-rgb-color-conversion
 * Converts an HSL color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes h, s, and l are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 255].
 *
 * @param   Number  h       The hue
 * @param   Number  s       The saturation
 * @param   Number  l       The lightness
 * @return  Array           The RGB representation
 */
    function hslToRgb(h, s, l) {
        var r, g, b;

        if (s == 0) {
            r = g = b = l; // achromatic
        } else {
            function hue2rgb(p, q, t) {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1 / 6) return p + (q - p) * 6 * t;
                if (t < 1 / 2) return q;
                if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                return p;
            }

            var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            var p = 2 * l - q;
            r = hue2rgb(p, q, h + 1 / 3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1 / 3);
        }

        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    }

    /**
 * Converts an RGB color value to HSL. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes r, g, and b are contained in the set [0, 255] and
 * returns h, s, and l in the set [0, 1].
 *
 * @param   Number  r       The red color value
 * @param   Number  g       The green color value
 * @param   Number  b       The blue color value
 * @return  Array           The HSL representation
 */
    function rgbToHsl(r, g, b) {
        r /= 255, g /= 255, b /= 255;
        var max = Math.max(r, g, b), min = Math.min(r, g, b);
        var h, s, l = (max + min) / 2;

        if (max == min) {
            h = s = 0; // achromatic
        } else {
            var d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }

        return [h, s, l];
    }

    //this I wrote myself
    function getComplementaryColor(hexColor) {
        console.log(hexColor);
        // parce out the individual hex values
        var r = hexColor.substring(1, 3);
        var g = hexColor.substring(3, 5);
        var b = hexColor.substring(5);

        console.log(r + " " + g + " " + b);
        //convert hex values to decimal
        r = parseInt(r, 16);
        g = parseInt(g, 16);
        b = parseInt(b, 16);

        //special case: if all are equal, greyscale, use black or white
        if (r == g && g == b) {
            if (r < 255 / 2)
                return "#ffffff";
            else
                return "#000000";

        }

        // get hsl representation
        console.log(r + " " + g + " " + b);
        var hsl = rgbToHsl(r, g, b);

        console.log(hsl);

        // invert hue
        hsl[0] = invertHue(hsl[0]);
        //hsl[1] = Math.abs(1 - hsl[1]);
        hsl[2] = Math.abs(1 - hsl[2]);

        console.log(hsl);
        // convert back to rgb
        var rgb = hslToRgb(hsl[0], hsl[1], hsl[2]);

        //convert new values back to hex
        r = rgb[0].toString(16);
        g = rgb[1].toString(16);
        b = rgb[2].toString(16);

        if (r.length == 1)
            r = "0" + r;
        if (g.length == 1)
            g = "0" + g;
        if (b.length == 1)
            b = "0" + b;

        console.log(r + " " + g + " " + b);

        return "#" + r + g + b;
    }

    function invertHue(h) {
        var h2 = h + 0.5;

        if (h2 > 1) {
            h2 -= 1;
        };
        return h2;
    }

    function AddWallToField() {

        console.log("addWall called");
        // count non-boundary walls
        var wallCount = 0;
        Walls.forEach(function (wall) {
            if (!wall.isBoundary)
                wallCount++;
        });

        //hard limit of 20 playfield walls
        if (count >= 20)
            return false;

        var PlayWall = new Wall();
        PlayWall.width = 40;
        PlayWall.height = 40;
        var collisions = true;
        var count = 0;

        while (collisions && count < 10) {
            PlayWall.x = Math.floor(478 * Math.random() + 61);
            PlayWall.y = Math.floor(328 * Math.random() + 61);
            collisions = checkForSpawnCollisions(PlayWall);
            count++;
        }

        //console.log("Count for box " + i + ": " + count);
        //Walls.push(PlayWall);

        //push to signalr. Wall is added by signalr to everyone on the callback to hub.client.wallAdded
        srWallAdded(PlayWall.id, PlayWall.x, PlayWall.y, PlayWall.width, PlayWall.height);
    }

    function RemoveWallFromField() {
        // if array isn't empty, remove first wall via signalr
        var wallid;

        Walls.forEach(function (wall) {
            if (!wall.isBoundary && wallid == null)
                wallid = wall.id;
        });

        if (wallid != null) {
            console.log("RemoveWallFromField called :" + wallid);
            srWallRemoved(wallid);
        }
    }

    ////////////////////////////////////////////////
    //
    // BEGIN SIGNALR STUFF
    //
    //
    ////////////////////////////////////////////////

    var hub = $.connection.blasterHub;

    hub.client.playerKilled = function (killerId, victimId, kills, deaths) {
        var killer = getObjectFromArray(Boxes, killerId);
        var victim = getObjectFromArray(Boxes, victimId);

        if (killer != null) {
            killer.kills = kills;
            updatePlayerOnLeaderboard(killer);
        }

        if (victim != null) {
            victim.deaths = deaths;
            victim.die();
            //updatePlayerOnLeaderboard(victim); //die() does this
        }

    };

    hub.client.playerMoved = function (id, x, y) {
        var player = getObjectFromArray(Boxes, id);

        if (player != null) {
            player.x = x;
            player.y = y;
            player.isDead = false;
        }
        else //player isn't in boxes, so we should try reloading info
        {
            srReloadPlayer(id);
        }

    };

    hub.client.playerRespawned = function (id, x, y) {
        var player = getObjectFromArray(Boxes, id);

        if (player != null) {
            player.x = x;
            player.y = y;
            player.isDead = false;
        }
        else //player isn't in boxes, so we should try reloading info
        {
            srReloadPlayer(id);
        }

    };

    hub.client.playerLeft = function (id) {
        var player = getObjectFromArray(Boxes, id);

        if (player != null) {
            removePlayerFromLeaderboard(player);
            removeObjectFromArray(Boxes, player);        
        }

        console.log("playerLeft called: " + id);
    };

    hub.client.playerJoined = function (id, x, y, name) {
        if (id == MyBox.id) {
            //player is now fully added to game
            //add event listeners and enable menu once player 
            document.getElementById('wrapperDiv').addEventListener("mousemove", mousemove);
            //document.addEventListener("mousemove", redirectMousemoveEvent);

            document.getElementById('wrapperDiv').addEventListener("mousedown", mouseclick);
            document.addEventListener("keydown", keydown);
            document.addEventListener("keyup", keyup);
            document.getElementById('colorPicker').addEventListener("input", changeColor);
            document.getElementById('volumeSlider').addEventListener("input", adjustVolume);
            document.getElementById('laserToggle').addEventListener("change", toggleLaser);
            document.getElementById('addWall').addEventListener("click", AddWallToField);
            document.getElementById('remWall').addEventListener("click", RemoveWallFromField);

            //enable menu controls
            document.getElementById('colorPicker').removeAttribute("disabled");
            document.getElementById('volumeSlider').removeAttribute("disabled");
            document.getElementById('laserToggle').removeAttribute("disabled");
            document.getElementById('addWall').removeAttribute("disabled");
            document.getElementById('remWall').removeAttribute("disabled");

            document.getElementById('canvas').style.visibility = "visible";

            window.setInterval(render, 1000 / targetFPS);
            window.setInterval(movebox, 40);
            window.setInterval(playaudio, 400);

            console.log("Joined the game");
        }
        else {
            //clear the screen of pewpews
            // KABOOM!!
            PewPews.forEach(function (pewpew) {
                pewpew.Explode();
            });

            //add player to Boxes
            var noob = new Box();
            noob.id = id;
            noob.x = x;
            noob.y = y;
            noob.name = name;
            noob.renderAim = false;
            Boxes.push(noob);

            //add player to leaderboard
            addPlayerToLeaderboard(noob);
        }
    };

    hub.client.playerChangedColor = function (id, color, text_color) {
        var player = getObjectFromArray(Boxes, id);

        if (player != null) {
            player.color = color;
            player.text_color = text_color;
        }

    };

    hub.client.pickNickname = function (id) {
        MyBox = new Box();
        MyBox.id = id;
        MyId = id;

        MyBox.name = "";

        //Get player nickname
        while (MyBox.name != null && (MyBox.name.length < 4 || MyBox.name.length > 8))
            MyBox.name = prompt("Please Enter your nickname (4 to 8 characters)");

        if (MyBox.name == null) {
            MyBox.name = randomBetween(10000, 99999);
            alert("Problem getting nickname, using random number instead... Sorry =(")
        }
        else {
            MyBox.name = MyBox.name.toUpperCase();
        }


        MyBox.respawn();
        addPlayerToLeaderboard(MyBox);
        Boxes.push(MyBox);

        isSignalrReady = true;
        srPlayerJoin(MyBox.id, MyBox.x, MyBox.y, MyBox.name, MyBox.color, MyBox.text_color);

    };

    hub.client.existingPlayerLoad = function (id, x, y, name, kills, deaths, color, text_color) {
        console.log("client.existnigPlayerLoad called");
        //if new player (initial load), create and push new Box
        //otherwise, update info for existing player
        var player = getObjectFromArray(Boxes, id);

        if (player == null) {
            var player = new Box();
            player.id = id;
            player.x = x;
            player.y = y;
            player.name = name;
            player.kills = kills;
            player.deaths = deaths;
            player.color = color;
            player.text_color = text_color;
            player.renderAim = false;
            addPlayerToLeaderboard(player);
            Boxes.push(player);
            console.log("Existing Player Loaded!");
        }
        else {
            player.x = x;
            player.y = y;
            player.name = name;
            player.kills = kills;
            player.deaths = deaths;
            player.color = color;
            player.text_color = text_color;
            updatePlayerOnLeaderboard(player);
            console.log("Existing Player Re-Loaded!");
        }

    };

    hub.client.wallMoved = function (id, x, y) {
        var wall = getObjectFromArray(Walls, id);

        if (wall != null) {
            wall.x = x;
            wall.y = y;
        }
        else //player isn't in boxes, so we should try reloading info
        {
            srReloadWall(id);
        }
    };

    hub.client.wallAdded = function (id, x, y, width, height) {
        //do the add/update bit
        var wall = getObjectFromArray(Walls, id);

        if (wall == null) {
            wall = new Wall();
            wall.id = id;
            wall.x = x;
            wall.y = y;
            wall.width = width;
            wall.height = height;

            Walls.push(wall);
        }
        else { //we already have the wall, so just update it
            //wall.id = id;
            wall.x = x;
            wall.y = y;
            wall.width = width;
            wall.height = height;
        }
    };

    hub.client.wallRemoved = function (id) {

        console.log("hub.client.wallRemoved called: " + id)
        console.log(Walls);
        var wall = getObjectFromArray(Walls, id);
        console.log(wall);
        if (wall != null) {
            removeObjectFromArray(Walls, wall);
        }
    };

    hub.client.spawnPewPew = function (id, sourceId, mag, dir, x, y) {
        var pew = new PewPew(new Vector(mag, dir));
        pew.x = x;
        pew.y = y;
        pew.id = id;
        pew.sourceId = sourceId;

        PewPews.push(pew);
    };

    hub.client.explodePew = function (id) {
        var pewpew = getObjectFromArray(PewPews, id);
        if (pewpew != null && pewpew.id != null)
            pewpew.Explode();
    }

    var isSignalrReady = false;
    $.connection.hub.start().done(function () { isSignalrReady = true; });


    //define server calling functions
    //called by hub.client.pickNickname to join to server
    function srPlayerJoin(id, x, y, name, color, text_color) {
        if (isSignalrReady) {
            console.log("playerJoin called");
            hub.server.playerJoin(id, x, y, name, color, text_color);
        }
        console.log(isSignalrReady);
    }

    //this is called by the pewpew collision handler when I am the killer
    function srKilledPlayer(killerId, victimId) {
        if (isSignalrReady) {
            hub.server.killedPlayer(killerId, victimId);
            console.log("killedPlayer called");
        }

    }

    //called by Box.MoveMe when I move myself
    //come to think of it, moveme is only EVER called as a result of 
    //player input, so the check is pointless
    function srPlayerMoved(id, x, y) {
        if (isSignalrReady) {
            hub.server.playerMoved(id, x, y);
            console.log("playerMoved called");
        }

    }

    //called by box.respawn when I am killed
    function srPlayerRespawned(id, x, y) {
        if (isSignalrReady) {
            hub.server.playerRespawned(id, x, y);
            console.log("playerRespawned called");
        }

    }

    //called by change color event handler
    function srPlayerChangedColor(id, color, text_color) {
        if (isSignalrReady) {
            hub.server.playerChangedColor(id, color, text_color);
            console.log("playerChangedColor called");
        }

    }

    //called by Box.firePew when I shoot
    function srShotFired(id, sourceId, mag, dir, x, y) {
        if (isSignalrReady) {
            hub.server.shotFired(id, sourceId, mag, dir, x, y);
            console.log("shotFired called");
        }

    }


    //called by hub.client.playerMoved when a box isn't found locally
    function srReloadPlayer(id) {
        if (isSignalrReady) {
            hub.server.reloadPlayer(id);
            console.log("reloadPlayer called");
        }


    }

    //called by hub.client.wallMoved when a wall isn't found locally
    function srReloadWall(id) {
        if (isSignalrReady) {
            hub.server.reloadWall(id);
            console.log("reloadWall called");
        }


    }

    //called by Wall.MoveMe (if someone else moves a wall, MoveMe isn't called)
    function srWallMoved(id, x, y) {
        if (isSignalrReady) {
            hub.server.wallMoved(id, x, y);
            console.log("wallMoved called");
        }


    }

    //called by eventHandler for "Add Wall" menu button
    function srWallAdded(id, x, y, width, height) {
        if (isSignalrReady) {
            hub.server.wallAdded(id, x, y, width, height);
            console.log("wallAdded called");
        }

    }

    //called by eventHandler for "Rem Wall" menu button
    function srWallRemoved(id) {
        if (isSignalrReady) {
            hub.server.wallRemoved(id);
            console.log("wallRemoved called: " + id);
        }

    }


});