

self.onmessage = function (e) {
    var maxDist = e.data.maxDist;
    var dist = Math.sqrt(Math.pow(e.data.x, 2) + Math.pow(e.data.y, 2));
    var pew = new Audio("Audio/pew.mp3");
    pew.volume = (maxDist - dist) / maxDist;
    pew.play();
    self.close();
}