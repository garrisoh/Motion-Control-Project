var leap = require('leapjs');

// sets the requestAnimationFrame method equal to the correct method for the browser.  this is the method called by the controller behind the scenes, so setting it here prevents TypeError 'undefined'.
window.requestAnimationFrame = 
            window.requestAnimationFrame || // Firefox 23 / IE 10 / Chrome
            window.mozRequestAnimationFrame || // Firefox < 23
            window.webkitRequestAnimationFrame || // Safari
            window.msRequestAnimationFrame || // IE
            window.oRequestAnimationFrame; // Opera

var controller = new leap.Controller();
var numHands = document.getElementById('num-hands');
var numFingers = document.getElementById('num-fingers');

controller.on('frame', function(frame){
    numHands.innerHTML = frame.hands.length;
    numFingers.innerHTML = frame.fingers.length;
});

controller.connect();