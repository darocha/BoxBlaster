$(function () {

    document.addEventListener("mousemove", mousemove, false);
    document.addEventListener("mousedown", mouseclick, true);
    
    document.addEventListener("keydown", keydown, false);
    document.addEventListener("keyup", keyup, false);

    //window.onresize = windowresize;


    var Point = (function () {
        function Point(x, y) {
            this.x = x || 0;
            this.y = y || 0;
        }

        return Point;
    })();

    var LineSegment = (function () {
        function LineSegment(point1, point2) {
            this.Point1 = point1 || new Point();
            this.Point2 = point2 || new Point();
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
        }

        return Vector;
    })();


    var Box = (function () {
        function Box() {
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
            this.color = "blue";
            this.aim_color = "red";
            this.text_color = "white";
            this.DrawToCanvasContext = function (ctx) {
                //draw rectangle
                ctx.fillStyle = this.color;
                ctx.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);

                //draw aim
                ctx.beginPath()
                ctx.moveTo(this.x, this.y);
                ctx.lineTo(this.aim_x, this.aim_y);
                ctx.strokeStyle = this.aim_color;
                ctx.stroke();

                //add name
                ctx.fillStyle = this.text_color;
                ctx.fillText(this.name, this.x - this.width/2, this.y - this.height / 4, this.width);

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
                segments.push(new LineSegment(topleft, botleft)); // left side
                segments.push(new LineSegment(topleft, topright)); // top side
                segments.push(new LineSegment(topright, botright)); // right side
                segments.push(new LineSegment(botleft, botright)); // bottom side

                return segments;
            }

            this.MoveMe = function () {
                if (this.move_N)
                    this.y -= 5;
                if (this.move_S)
                    this.y += 5;
                if (this.move_W)
                    this.x -= 5;
                if (this.move_E)
                    this.x += 5;
            };

            this.firePew = function () {
                var vector = new Vector(15,0);
                vector.SetDirectionFromPoints(new Point(this.x, this.y), new Point(this.aim_x, this.aim_y));
                var pewBox = new PewPew(vector);
                pewBox.id = this.id;
                pewBox.x = this.x;
                pewBox.y = this.y;
                console.log(pewBox);
                console.log(pewBox.vector);
                pewBox.MoveMe();
                console.log(pewBox);
                PewPews.push(pewBox);
            };

        }

        return Box;
    })();


    var PewPew = (function () {
        function PewPew(vector) {
            this.id = Math.floor((1 + Math.random()) * 0x10000).toString(16);
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
                //this.y += this.vector.magnitude * Math.sin(this.vector.direction);
                //this.x += this.vector.magnitude * Math.cos(this.vector.direction);
                //console.log(this);
            };

        }

        return PewPew;
    })();


    var Boxes = new Array();
    var PewPews = new Array();

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

    var maxDist = Math.sqrt(Math.pow(drawCanvas.height , 2) + Math.pow(drawCanvas.width , 2));

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

            var angle = 

            //console.log("AimMsg#" + counter + " x: " + event.clientX + " y: " + event.clientY);
            console.log("AimMsg#" + counter + " x: " + event.clientX + " y: " + event.clientY);
            MyBox.aim_x = event.clientX;
            MyBox.aim_y = event.clientY;
            Boxes.forEach(function (item) {
                item.aim_x = event.clientX;
                item.aim_y = event.clientY;
            });                 
        }
    }

    function keydown(event) {
        console.log("Keydown: code =" + event.keyCode)
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
        console.log("Keyup: code =" + event.keyCode)
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
        console.log("click event fired!");

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

    var renderHandle = window.setInterval(render, 40);
    var moveDaemon = window.setInterval(movebox, 40);
    var audioDaemon = window.setInterval(playaudio, 100);

    //http://stackoverflow.com/questions/8668174/indexof-method-in-an-object-array
    function arrayObjectIndexOf(myArray, searchTerm, property) {
        for (var i = 0, len = myArray.length; i < len; i++) {
            if (myArray[i][property] === searchTerm) return i;
        }
        return -1;
    }
});