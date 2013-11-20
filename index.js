//var Leap = require('leapjs'); // for node testing
var controller = new Leap.Controller();

/************ Constants/Global Variables ************/

// move robot to these coordinates to start
var INITIAL_X = 17;
var INITIAL_Y = 21;
var INITIAL_Z = 0;
var INITIAL_GRIP = 4;

// maximum coordinates
var MAX_X = 30;
var MAX_Y = 20;
var MAX_Z = 10;
var MAX_R = 6;
var MIN_X = 10;
var MIN_Y = -20;
var MIN_Z = -7.5;
var MIN_R = 0;

// number of fingers to be considered "closed"
var FINGER_THRES = 2;

// if fps = 50, this gives a speed of about 5cm/s
var STEP_SIZE = 0.1;

// distance you must move your hand from origin to cause movement (in mm)
var ORIGIN_THRES = 30;

// calibrated point
var startX = 0;
var startY = 0;
var startZ = 0;

// current point
var currX = INITIAL_X;
var currY = INITIAL_Y;
var currZ = INITIAL_Z;

var calibrated = false;

var left = false;
var right = false;
var forward = false;
var backward = false;
var up = false;
var down = false;

/************ UI Control ************/

$(document).ready(function () {
    $(document).on("frame", function () {
        if (!calibrated) {
            $('div').text("");
            $('#center').text("Calibrate");
            $('#center').css('color', 'white');
        } else {
            $('#left').text("Left");
            $('#right').text("Right");
            $('#forward').text("Forward");
            $('#backward').text("Backward");
            $('#center').text("");
            
            if (left) {
                $('#left').css('color', 'red');
            } else {
                $('#left').css('color', 'white');
            }
            if (right) {
                $('#right').css('color', 'red');
            } else {
                $('#right').css('color', 'white');
            }
            if (forward) {
                $('#forward').css('color', 'red');
            } else {
                $('#forward').css('color', 'white');
            }
            if (backward) {
                $('#backward').css('color', 'red');
            } else {
                $('#backward').css('color', 'white');
            }
            if (up) {
                $('#center').text("o");
                $('#center').css('color', 'red');
            } else if (down) {
                $('#center').text("x");
                $('#center').css('color', 'red');
            } else {
                $('#center').text("");
            }
        }
    });
});

/************ Robot Arm Control ************/

var arm =  new Arm();
arm.set(INITIAL_X, INITIAL_Y, INITIAL_Z, INITIAL_GRIP);

var counter = 0; // for testing

controller.on('deviceFrame', function(frame) {
    var hand = frame.hands[0]; // gets the rightmost hand
    if (!hand) {
        return;
    }
    if (!calibrated) {
        if (hand.fingers.length > FINGER_THRES) {
            startX = hand.palmPosition[0];
            startY = -1 * hand.palmPosition[2];
            startZ = hand.palmPosition[1];
            calibrated = true;
            // logging for debugging
            console.log('recalibrated');
        }
    } else {
        if (hand.fingers.length < FINGER_THRES) {
            calibrated = false;
        } else {
            var x = hand.palmPosition[0];
            var y = -1 * hand.palmPosition[2];
            var z = hand.palmPosition[1];
            
            var deltaX = x - startX;
            var deltaY = y - startY;
            var deltaZ = z - startZ;
            
            // increment current coordinates
            // x
            if (Math.abs(deltaX) > ORIGIN_THRES) {
                currX += deltaX/Math.abs(deltaX) * STEP_SIZE;
                if (deltaX > 0) {
                  right = true;
                  left = false;
                } else {
                  right = false;
                  left = true;
                }
            } else {
                right = false;
                left = false;
            }
            
            // y
            if (Math.abs(deltaY) > ORIGIN_THRES) {
                currY += deltaY/Math.abs(deltaY) * STEP_SIZE;
                if (deltaY > 0) {
                  forward = true;
                  backward = false;
                } else {
                  forward = false;
                  backward = true;
                }
            } else {
                forward = false;
                backward = false;
            }
            
            // z
            if (Math.abs(deltaZ) > ORIGIN_THRES) {
                currZ += deltaZ/Math.abs(deltaZ) * STEP_SIZE;
                if (deltaZ > 0) {
                    up = true;
                    down = false;
                } else {
                    up = false;
                    down = true;
                }
            } else {
                up = false;
                down = false;
            }
            
            // constrain to maxes and mins
            if (currX > MAX_X) {
                currX = MAX_X;
            }
            if (currY > MAX_Y) {
                currY = MAX_Y;
            }
            if (currZ > MAX_Z) {
                currZ = MAX_Z;
            }

            if (currX < MIN_X) {
                currX = MIN_X;
            }
            if (currY < MIN_Y) {
                currY = MIN_Y;
            }
            if (currZ < MIN_Z) {
                currZ = MIN_Z;
            }
            
            // logging for debugging purposes
            if (counter % 25 == 0) {
                console.log([currX, currY, currZ]);
            }
            counter++;
            
            arm.set(currX, currY, currZ, INITIAL_GRIP);
        }
    }
    // Trigger UI event to update
    $(document).trigger("frame");
});

controller.connect();


/******** Old code below **********/


//var leap = require('leapjs');
//
//// sets the requestAnimationFrame method equal to the correct method for the browser.  this is the method called by the controller behind the scenes, so setting it here prevents TypeError 'undefined'.
///*window.requestAnimationFrame = 
//            window.requestAnimationFrame || // Firefox 23 / IE 10 / Chrome
//            window.mozRequestAnimationFrame || // Firefox < 23
//            window.webkitRequestAnimationFrame || // Safari
//            window.msRequestAnimationFrame || // IE
//            window.oRequestAnimationFrame; // Opera*/
//
////var controller = new leap.Controller();
//var controller = new Leap.Controller();
//var arm = new Arm();
//
//// leap motion max and min coordinates
//var MAX_X = 200;
//var MAX_Y = 200;
//var MAX_Z = 400;
//var MAX_R = 150;
//var MIN_X = -200;
//var MIN_Y = -200;
//var MIN_Z = 0;
//var MIN_R = 40;
//
//// robot arm max and min coordinates
//var MAX2_X = 30;
//var MAX2_Y = 20;
//var MAX2_Z = 10;
//var MAX2_R = 6;
//var MIN2_X = 10;
//var MIN2_Y = -20;
//var MIN2_Z = -7.5;
//var MIN2_R = 0;
//
//controller.on('deviceFrame', function(frame){
//    var hand = frame.hands[0];
//    if(hand) {
//        var numFingers = hand.fingers.length;
//        if(numFingers >= 2) {
//            var x = hand.palmPosition[0];
//            var y = -1 * hand.palmPosition[2];
//            var z = hand.palmPosition[1];
//            var r = hand.sphereRadius; // radius of arc of hand - used to calculate gripper width
//            
//            x = map(x, MAX_X, MIN_X, MAX2_X, MIN2_X);
//            y = map(y, MAX_Y, MIN_Y, MAX2_Y, MIN2_Y);
//            z = map(z, MAX_Z, MIN_Z, MAX2_Z, MIN2_Z);
//            r = map(r, MAX_R, MIN_R, MAX2_R, MIN2_R);
//            
//            // pass into Daniel's function
//            console.log("x: " + x + " y: " + y + " z: " + z + " r: " + r);
//            //arm.set(x, y, z, r);
//            arm.set(y, x, z, r);
//        }
//    }
//});
//
///** map a value to new coordinates and constrain to high2 or low2 values if it goes over/under */
//function map(value, high1, low1, high2, low2) {
//    var percent = (value - low1)/(high1 - low1);
//    if(percent > 1) {
//        percent = 1;
//    }
//    if(percent < 0) {
//        percent = 0;
//    }
//    return (high2 - low2) * percent + low2;
//}
//
//controller.connect();
