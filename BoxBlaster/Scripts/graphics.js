$(function () {

    document.addEventListener("mousemove", mousemove, false);
    document.addEventListener("mousedown", mouseclick, true);
    
    document.addEventListener("keydown", keydown, false);
    document.addEventListener("keyup", keyup, false);

    //window.onresize = windowresize;

    var Box = (function () {
        function Box() {
            this.id = Math.floor((1 + Math.random()) * 0x10000).toString(16);
            this.name = "Troy";
            this.x = 25;
            this.y = 25;
            this.width = 30;
            this.height = 30;
            this.playPew = false;
            this.aim_x;
            this.aim_y;
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
        }

        return Box;
    })();

    var Boxes = new Array();

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
            console.log("AimMsg#" + counter + " x: " + event.clientX + " y: " + event.clientY);
            MyBox.aim_x = event.clientX;
            MyBox.aim_y = event.clientY;
            //Boxes.forEach(function (item) {
            //    item.aim_x = event.clientX;
            //    item.aim_y = event.clientY;
            //});
            //render();

            
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
        if (MyBox.move_N)
            MyBox.y -= 5;
        if (MyBox.move_S)
            MyBox.y += 5;
        if (MyBox.move_W)
            MyBox.x -= 5;
        if (MyBox.move_E)
            MyBox.x += 5;
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
            pew.play();
            //MyBox.playPew = false;
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