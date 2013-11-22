// var Leap = require('leapjs'); // uncomment for node testing

var controller = new Leap.Controller();
var arm = new Arm();

// leap motion max and min coordinates
var MAX_X = 200;
var MAX_Y = 200;
var MAX_Z = 400;
var MAX_R = 100;
var MIN_X = -200;
var MIN_Y = -200;
var MIN_Z = 0;
var MIN_R = 52;

// robot arm max and min coordinates
var MAX2_X = 20;
var MAX2_Y = 30;
var MAX2_Z = 10;
var MAX2_R = 6;
var MIN2_X = -20;
var MIN2_Y = 10;
var MIN2_Z = -7.5;
var MIN2_R = 0;

// convolution constants used for Savitzky-Golay smoothing algorithm
var CONV_CONSTS = [-253, -138, -33, 62, 147, 222, 287, 343, 387, 422, 447, 462, 467, 462, 447, 422, 387, 343, 287, 222, 147, 62, -33, -138, -253];

// queues used for smoothing effect
var queueX = [];
var queueY = [];
var queueZ = [];
var queueR = [];

/** called on each controller frame */
controller.on('deviceFrame', function(frame){
    var hand = frame.hands[0];
    if(hand) {
        var numFingers = hand.fingers.length;
        if(numFingers >= 2) {
            var x = hand.palmPosition[0];
            var y = -1 * hand.palmPosition[2];
            var z = hand.palmPosition[1];
            var r = hand.sphereRadius; // radius of arc of hand - used to calculate gripper width
            
            x = map(x, MAX_X, MIN_X, MAX2_X, MIN2_X);
            y = map(y, MAX_Y, MIN_Y, MAX2_Y, MIN2_Y);
            z = map(z, MAX_Z, MIN_Z, MAX2_Z, MIN2_Z);
            r = map(r, MAX_R, MIN_R, MAX2_R, MIN2_R);
            
            // add to a queue
            queueX.push(x);
            queueY.push(y);
            queueZ.push(z);
            queueR.push(r);
            
            // smooth and move the arm
            moveArmSmoothed();
        }
    }
});

/** map a value to new coordinates and constrain to high2 or low2 values if it goes over/under */
function map(value, high1, low1, high2, low2) {
    var percent = (value - low1)/(high1 - low1);
    if(percent > 1) {
        percent = 1;
    }
    if(percent < 0) {
        percent = 0;
    }
    return (high2 - low2) * percent + low2;
}

/** constrain a value to min and max */
function constrain(value, min, max) {
    if (value < min) {
        value = min;
    } else if (value > max) {
        value = max;
    }
    return value;
}

/** Smooths the data points using the Savitzky-Golay polynomial fit algorithm http://www.chem.uoa.gr/applets/appletsmooth/appl_smooth2.html and moves the robot to the smoothed coordinate */
function moveArmSmoothed() {
    if(queueX.length >= CONV_CONSTS.length && queueY.length >= CONV_CONSTS.length && queueZ.length >= CONV_CONSTS.length) {
        // smooth the data points
        var numeratorX = 0;
        var numeratorY = 0;
        var numeratorZ = 0;
        var numeratorR = 0;
        var denominator = 0;
        
        for (var i = 0; i < CONV_CONSTS.length; i++) {
            // sum numerator
            numeratorX += CONV_CONSTS[i] * queueX[i];
            numeratorY += CONV_CONSTS[i] * queueY[i];
            numeratorZ += CONV_CONSTS[i] * queueZ[i];
            numeratorR += CONV_CONSTS[i] * queueR[i];
            
            // sum denominator
            denominator += CONV_CONSTS[i];
        }
        
        // round to one decimal (1mm) and constrain to min and max values
        var x = constrain(Math.round(numeratorX/denominator * 10)/10, MIN2_X, MAX2_X);
        var y = constrain(Math.round(numeratorY/denominator * 10)/10, MIN2_Y, MAX2_Y);
        var z = constrain(Math.round(numeratorZ/denominator * 10)/10, MIN2_Z, MAX2_Z);
        var r = constrain(Math.round(numeratorR/denominator * 10)/10, MIN2_R, MAX2_R);
        
        // move arm
        arm.set(x, y, z, r);
        
        // update UI
        var div = document.getElementsByTagName('div');
        div[0].innerHTML = "x: " + x + "<br>y: " + y + "<br>z: " + z + "<br>r: " + r;
        
        
        // dequeue point at beginning of the queue
        queueX.shift();
        queueY.shift();
        queueZ.shift();
        queueR.shift();
    }
}

// connect the controller
controller.connect();
