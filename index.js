var leap = require('leapjs');

// sets the requestAnimationFrame method equal to the correct method for the browser.  this is the method called by the controller behind the scenes, so setting it here prevents TypeError 'undefined'.
/*window.requestAnimationFrame = 
            window.requestAnimationFrame || // Firefox 23 / IE 10 / Chrome
            window.mozRequestAnimationFrame || // Firefox < 23
            window.webkitRequestAnimationFrame || // Safari
            window.msRequestAnimationFrame || // IE
            window.oRequestAnimationFrame; // Opera*/

var controller = new leap.Controller();

var MAX_X = 200;
var MAX_Y = 200;
var MAX_Z = 400;
var MAX_R = 150;
var MIN_X = -200;
var MIN_Y = -200;
var MIN_Z = 0;
var MIN_R = 40;
// Dan's constants

controller.on('deviceFrame', function(frame){
    // do things
    var hand = frame.hands[0];
    var numFingers = hand.fingers.length;
    if(hand && numFingers >= 2) {
        var x = hand.palmPosition[0];
        var y = -1 * hand.palmPosition[2];
        var z = hand.palmPosition[1];
        var r = hand.sphereRadius;
        
        x = map(x, MAX_X, MIN_X, , );
        y = map(y, MAX_Y, MIN_Y, , );
        z = map(z, MAX_Z, MIN_Z, , );
        r = map(r, MAX_R, MIN_R, , );
        
        // pass into Daniel's function
    }
});

// map a value to new coordinates and constrain to high2 or low2 values if it goes over/under
function map(value, high1, low1, high2, low2) {
    var percent = (value - low1)/(high1 - low1);
    if(percent > 100) {
        percent = 100;
    }
    if(percent < 0) {
        percent = 0;
    }
    return (high2 - low2) * percent + low2;
}

controller.connect();