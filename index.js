//var Leap = require('leapjs'); // for node testing
var controller = new Leap.Controller();

/************ Constants/Global Variables ************/

// minimum and maximum coordinates
var MAX_X = 20;
var MAX_Y = 30;
var MAX_Z = 10;
var MAX_R = 6;
var MIN_X = -20;
var MIN_Y = 10;
var MIN_Z = -7.5;
var MIN_R = 0;

// number of fingers to be considered "closed"
var FINGER_THRES = 2;

// in cm/s
var SPEED = 5;

// distance you must move your hand from origin to cause movement (in mm)
var ORIGIN_THRES = 30;

// used to control speed
var startTime = 0;

// calibrated point
var startX = 0;
var startY = 0;
var startZ = 0;

// current point of robot
var currX = 0;
var currY = 0;
var currZ = 0;

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

// get initial coordinates
var coods = arm.getCurrentCoordinates();
currX = coods[0];
currY = coods[1];
currZ = coods[2];

controller.on('deviceFrame', function(frame) {
    var hand = frame.hands[0]; // gets the rightmost hand
    if (!hand) {
        calibrated = false;
        return;
    }
    if (!calibrated) {
        if (hand.fingers.length > FINGER_THRES) {
            startX = hand.palmPosition[0];
            startY = -1 * hand.palmPosition[2];
            startZ = hand.palmPosition[1];
            calibrated = true;
            
            // record start time
            var date = new Date();
            startTime = date.getTime();
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
            
            // find elapsed time since last frame
            var date = new Date();
            var stopTime = date.getTime();
            var timeDelta = (stopTime - startTime) * 0.001;
            
            // increment current coordinates
            // x
            if (Math.abs(deltaX) > ORIGIN_THRES) {
                currX += deltaX/Math.abs(deltaX) * SPEED * timeDelta;
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
                currY += deltaY/Math.abs(deltaY) * SPEED * timeDelta;
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
                currZ += deltaZ/Math.abs(deltaZ) * SPEED * timeDelta;
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
            currX = constrain(currX, MIN_X, MAX_X);
            currY = constrain(currY, MIN_Y, MAX_Y);
            currZ = constrain(currZ, MIN_Z, MAX_Z);
            
            // TODO: Change gripper to actual value
            arm.set(currX, currY, currZ, 4);
            
            // reset startTime
            startTime = date.getTime();
        }
    }
    // Trigger UI event to update
    $(document).trigger("frame");
});

/** constrain a coordinate to min and max values */
function constrain(value, min, max) {
    if (value < min) {
        value = min;
    } else if (value > max) {
        value = max;
    }
    return value;
}

controller.connect();
