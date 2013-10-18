/*
class to control a 4-axis robot arm with an Arduino through JavaScript.

Issues:
	1.) The shoulder motor doesn't always move to the correct angle. It appears to be off by a different amount around 90 degrees than it is around 0 degrees, so it's hard to correct for it.
	2.) The grip linkages do not keep the jaws parallel. That means the separation at the tip is different from the separation at the back, and also that it will make less contact with objects. It also complicates the kinematics.
	3.) The motors sometimes don't move to exactly the right position. This is mostly apparent with the base, which is often off by one degree. Thus, the coordinates need to be fudged at times.
	4.) When the gripper opens/closes, it changes the length from wrist to tip, so the angles for a certain coordinate will change if the grip is opened or closed. The coordinates used to grab a block may not work for putting it back.
	5.) servoRead only returns the position a servo was TOLD to go to, not the position it's actually at. So if it gets stuck, there's no way for us to tell.

Suggestions:
	1.) Try to avoid letting the grip or anything it holds touch the board the arm is mounted on. Since there's a tendency for movements to not be fluid, it's possible for it dip down in the middle of a movement and hit the board.
	2.) Make an arduino object and pass it into the constructor for Arm.
*/


/*
IMPORTANT!!!
Current issue: the method used for timing isn't working. Arm does not move. Investigate it.
*/







// Declare these variables so you don't have to type the full namespace
var IOBoard = BO.IOBoard;
var IOBoardEvent = BO.IOBoardEvent;
var Servo = BO.io.Servo;
var Potentiometer = BO.io.Potentiometer;
var PotEvent = BO.io.PotEvent;
var abs = Math.abs;
var sqrt = Math.sqrt;
var pow = Math.pow;


// TODO: these math functions don't work with arrays like the ones in MATLAB. Need some reworking

//stacks four blocks at (27,0)
function stackBlocks()
{
	var openSep = 4;	// how far apart the grip should be when "open" (not holding a block)
	var closeSep = 2;	// how far apart the grip should be when "closed" (holding a block)
	// for more pressure, specify a smaller separation

	this.gripControl(openSep);	// make sure the grip is open first

	// first block
	this.moveTo([21,17,0], -55);	// position grip above block
	this.moveStraightTo([21,17,-6], -55);	// drop down
	this.gripControl(closeSep);	// grab block
	this.moveStraightTo([21,17,0],-55);	// go up
	this.moveTo([28,0,0], -55);	// move to above the stack
	this.moveStraightTo([28,0,-5.5], -55);	// drop down
	this.gripControl(openSep);	// release block
	this.moveStraightTo([28,0,0],-55);	// go up

	// second block
	this.moveTo([25,10,0],-55);	// position grip above block
	this.moveStraightTo([25,10,-6], -55);	// drop down
	this.gripControl(closeSep);	// grab block
	this.moveStraightTo([25,10,0],-55);	// go up
	this.moveTo([27,0,0],-55);	// move to above the stack
	this.moveStraightTo([27,0,-4],-55);	// drop down
	this.gripControl(openSep);	// release block
	this.moveStraightTo([27,0,2],-55);	// go up

	// third block
	this.moveTo([26,-9.25,2],-55);	// position grip above block
	this.moveStraightTo([26,-9.25,-6], -55);	// drop down
	this.gripControl(closeSep);	// grab block
	this.moveStraightTo([26,-9.25,2],-55);	// go up
	this.moveTo([28.5,1,2],-55);	// move to above the stack
	this.moveStraightTo([28.5,1,-.5],-55);	// drop down
	this.gripControl(openSep);	// release block
	this.moveStraightTo([27,1,3],-55);	// go up

	// fourth block
	this.moveTo([12.5,-12,3],-60);	// position grip above block
	this.moveStraightTo([12.5,-12,-7],-60);	// drop down
	this.gripControl(closeSep);	// grab block
	this.moveStraightTo([12.5,-12,-7],-55);
	this.moveStraightTo([12.5,-12,5],-50);	// go up
	this.moveTo([29,1,5],-50);	// move to above the stack
	this.moveStraightTo([29,1,2.5],-50);	// drop down
	this.gripControl(openSep);	// release block
	this.moveStraightTo([29,1,6],-45);	// go up

}

// unstacks the blocks and returns them to their original positions.
function unstackBlocks()
{
	var openSep = 4;	// how far apart the grip should be when "open" (not holding a block)
	var closeSep = 2;	// how far apart the grip should be when "closed" (holding a block)
	// for more pressure, specify a smaller separation

	this.gripControl(openSep);

	// fourth block (top)
	this.moveTo([28,0,6],-50);	// move to above the stack
	this.moveTo([28.5,0,2.75],-50);	// drop down
	this.gripControl(closeSep);	// grab block
	this.moveTo([29,0,6],-45);	// go up
	this.moveTo([12.5,-12,5],-50);	// position grip above the mark
	this.moveTo([12.5,-12,-7],-60);	// drop down
	this.gripControl(openSep);	// release block
	this.moveTo([12.5,-12,3],-60);	// go up

	// third block
	this.moveTo([27,0,3],-55);	// move to above the stack
	this.moveTo([28,0,-.5],-55);	// drop down
	this.gripControl(closeSep);	// grab block
	this.moveTo([28,0,2.5],-55);	// go up
	this.moveTo([25.5,-9.8,2],-55);	// position grip above the mark
	this.moveTo([25.5,-9.8,-6.5], -55);	// drop down
	this.gripControl(openSep);	// release block
	this.moveTo([25.5,-9.8,2],-55);	// go up

	// second block
	this.moveTo([28,0,2],-55);	// move to above the stack
	this.moveTo([28,0,-3.5],-55);	// drop down
	this.gripControl(closeSep);	// grab block
	this.moveTo([28,0,0],-55);	// go up
	this.moveTo([25,10,0],-55);	// position grip above the mark
	this.moveTo([25,10,-7], -55);	// drop down
	this.gripControl(openSep);	// release block
	this.moveTo([25,10,0],-55);	// go up

	// first block (bottom)
	this.moveTo([28,0,0],-55);	// move to above the stack
	this.moveTo([28,0,-5.5], -55);	// drop down
	this.gripControl(closeSep);	// grab block
	this.moveTo([28,0,0],-55);	// go up
	this.moveTo([21,17,0],-55);	// position grip above the mark
	this.moveTo([21,17,-6], -55);	// drop down
	this.gripControl(openSep);	// release block
	this.moveTo([21,17,0], -55);	// go up

}

// These functions are just part of the conversion process. Needed them in MATLAB (they were built-in), shouldn't need in JavaScript, but I need to confirm that before removing them.
function int16(x)
{
	if (Array.isArray(x))
	{
		for (var i = 0; i < x.length; ++i)
			x[i] = Math.round(x[i]);
		return x;
	}
	else
		return Math.round(x);
}
function isreal(x)
{
	return true;	// JavaScript doesn't do complex numbers, so it's real.
}
function error(message) {
	console.log(message);
}
function pause(delay) {
	var firstTime = new Date().getTime();
	var currentTime = new Date().getTime();
	while ( currentTime - firstTime < delay )
	{
		currentTime = new Date().getTime();
	}
}

var degToRad = Math.PI / 180;
var radToDeg = 180 / Math.PI;

// These functions are more important.
function atand(x) {
	return Math.atan(x) * radToDeg;
}
function tand(x) {
	return Math.tan(x*degToRad);
}
function sind(x) {
	return Math.sin(x*degToRad);
}
function cosd(x) {
	return Math.cos(x*degToRad);
}
function asind(x) {
	return Math.asin(x) * radToDeg;
}
function acosd(x) {
	return Math.acos(x) * radToDeg;
}
function max(x) {
	var maxValue = 0;
	for ( var i = 0; i < x.length; ++i)
		if (x[i] > maxValue) maxValue = x[i];
	return maxValue;
}
function absArray(x) {
	var output = new Array();
	for ( var i = 0; i < x.length; ++i)
		output[i] = abs(x[i]);
	return output;
}
function arraySubtraction(x, y)
{
	var output = new Array();
	if (Array.isArray(x) && Array.isArray(y))	// Two arrays, subtract each set of components.
	{
		for ( var i = 0; i < x.length; ++i)
			output[i] = x[i] - y[i];
	}
	else if (Array.isArray(x) && !Array.isArray(y))	// Array - non-array, subtract y from every part of x
	{
		for ( var i = 0; i < x.length; ++i)
			output[i] = x[i] - y;
	}
	return output;
}
function arrayAddition(x, y)
{
	var output = new Array();
	if (Array.isArray(x) && Array.isArray(y))	// Two arrays, add each set of components.
	{
		for ( var i = 0; i < x.length; ++i)
			output[i] = x[i] + y[i];
	}
	else if (Array.isArray(x) && !Array.isArray(y))	// Array + non-array, add y to every part of x
	{
		for ( var i = 0; i < x.length; ++i)
			output[i] = x[i] + y;
	}
	else if (!Array.isArray(x) && Array.isArray(y))	// non-array + array, add x to every part of y
	{
		for ( var i = 0; i < y.length; ++i)
			output[i] = x + y[i];
	}
	else	// neither one is an array
	{
		console.log("Warning: arrayAddition called on two non-arrays");
		return x + y;	// better than returning undefined.
	}
	return output;
}

function arrayMultiplication(x, y)
{
	var output = new Array();
	if (Array.isArray(x) && Array.isArray(y))	// Two arrays, multiply each set of components.
	{
		for ( var i = 0; i < x.length; ++i)
			output[i] = x[i] * y[i];
	}
	else if (Array.isArray(x) && !Array.isArray(y))	// Array * non-array, multiply y with every part of x
	{
		for ( var i = 0; i < x.length; ++i)
			output[i] = x[i] * y;
	}
	else if (!Array.isArray(x) && Array.isArray(y))	// non-array * array, multiply x with every part of y
	{
		for ( var i = 0; i < y.length; ++i)
			output[i] = x * y[i];
	}
	else	// neither one is an array
	{
		console.log("Warning: arrayMultiplication called on two non-arrays");
		return x + y;	// better than returning undefined.
	}
	return output;
}


function getDirectionVector(pointA, pointB)
{
	var unitVector =  arraySubtraction(pointB, pointA);
	for (var i = 0; i < unitVector.length; ++i)
	{
		unitVector[i] = unitVector[i] / sqrt( pow((pointB[0]-pointA[0]),2) + pow((pointB[1]-pointA[1]),2) + pow((pointB[2]-pointA[2]),2) );
	}
	return unitVector;
}

//Constructor. Can pass in host name and network port if different from the usual.
function Arm(host, networkPort)
{
	this.axisAngles = new Array(0, 77, -82, -50, 75);	// Stores the current axis angles. Initial values determine where the robot starts.
	
	this.baseAxisRange = new Array(-90, 90);
	this.shoulderAxisRange = new Array (45,135);    // not the actual limits of axis, but going lower risks slamming into the ground
	this.elbowAxisRange = new Array (-140,0);
	this.wristAxisRange = new Array (-90, 90);
	this.gripAxisRange = new Array (35, 90);
	this.axisRanges = new Array (this.baseAxisRange, this.shoulderAxisRange, this.elbowAxisRange, this.wristAxisRange, this.gripAxisRange);

	// motors
	this.baseMotor;
	this.shoulderMotor;
	this.elbowMotor;
	this.wristMotor;
	this.gripMotor;
	this.motors;

	// adjustments between angle of motor and angle of axis. First number is due to the robot's design. Second is error correction (motors are not installed with perfect orientation).
	this.baseAxisToMotorAdjustment = + 90 + 4;
	this.shoulderAxisToMotorAdjustment = 0 + 14;
	this.elbowAxisToMotorAdjustment = + 180 - 2;
	this.wristAxisToMotorAdjustment = + 90;
	this.gripAxisToMotorAdjustment = + 45 - 2;
	this.axisToMotorAdjustments = new Array (this.baseAxisToMotorAdjustment, this.shoulderAxisToMotorAdjustment, this.elbowAxisToMotorAdjustment, this.wristAxisToMotorAdjustment, this.gripAxisToMotorAdjustment);

	this.segment1Length = 15.25;	// in cm
	this.segment2Length = 12;	// in cm
	
	
	
	if ( host === undefined)
		host = "localhost";
	if ( networkPort === undefined)
		networkPort = 8887;
	this.ardy = new IOBoard(host, networkPort);
	// Listen for the IOBoard READY event which indicates the IOBoard is ready to send and receive data.
	this.onReady = onReady;
	this.ardy.addEventListener(IOBoardEvent.READY, this.onReady.bind(this));
	
	
	// Functions
	this.findAnglesConstantPitch = findAnglesConstantPitch;
	this.findCoordinates = findCoordinates;
	this.safetyCheckAxisAngles = 	safetyCheckAxisAngles;
	this.getGripInfo = getGripInfo;
	this.getIndexOfAxis = getIndexOfAxis;
	this.getCurrentCoordinates = getCurrentCoordinates;
	this.getAxisAngle = getAxisAngle;
	this.moveAxesAtSpeedEvenly = moveAxesAtSpeedEvenly;
	this.moveAxesAtSpeed = moveAxesAtSpeed;
	this.setAxisAnglesOptimized = setAxisAnglesOptimized;
	this.moveStraightTo = moveStraightTo;
	this.moveTo = moveTo;
	this.getCurrentGripInfo = getCurrentGripInfo;
	this.gripControl = gripControl;
	this.move = move;
	this.stackBlocks = stackBlocks;
	this.unstackBlocks = unstackBlocks;
}

function onReady(event)
{
	// Remove the event listener because it is no longer needed
	//this.ardy.removeEventListener(IOBoardEvent.READY, onReady2);
	/*this.baseMotor = new Servo(this.ardy, this.ardy.getDigitalPin(11), this.baseAxisRange[0], this.baseAxisRange[1]);
	this.shoulderMotor = new Servo(this.ardy, this.ardy.getDigitalPin(10), this.shoulderAxisRange[0], this.shoulderAxisRange[1]);
	this.elbowMotor = new Servo(this.ardy, this.ardy.getDigitalPin(9), this.elbowAxisRange[0], this.elbowAxisRange[1]);
	this.wristMotor = new Servo(this.ardy, this.ardy.getDigitalPin(6), this.wristAxisRange[0], this.wristAxisRange[1]);
	this.gripMotor = new Servo(this.ardy, this.ardy.getDigitalPin(5), this.gripAxisRange[0], this.gripAxisRange[1]);*/
	
	// Note: if the range of the motor is set here, BreakoutJS will reassign the range to whatever the values are, ie 0-180 (actual range of physical motor) becomes -90-90, and saying motor.angle = 0 will set it to what would have previously been 90. Should make use of that, after getting things working.
	this.baseMotor = new Servo(this.ardy, this.ardy.getDigitalPin(11) );
	this.shoulderMotor = new Servo(this.ardy, this.ardy.getDigitalPin(10) );
	this.elbowMotor = new Servo(this.ardy, this.ardy.getDigitalPin(9) );
	this.wristMotor = new Servo(this.ardy, this.ardy.getDigitalPin(6) );
	this.gripMotor = new Servo(this.ardy, this.ardy.getDigitalPin(5) );
	
	this.motors = new Array(this.baseMotor, this.shoulderMotor, this.elbowMotor, this.wristMotor, this.gripMotor);
	
	
	// Go to initial position
	//this.setAxisAnglesOptimized(this.axisAngles);
	if (!this.safetyCheckAxisAngles(this.axisAngles))
	{
		console.log("invalid initial angles.");
		return;
	}
	for ( var i = 0; i < 5; ++i)
	{
		this.motors[i].angle = this.axisAngles[i] + this.axisToMotorAdjustments[i];
	}

}





// returns the angles needed to reach given coordinates and pitch.
function findAnglesConstantPitch(coordinates, gripLength, pitchAngle)
{
	var x = coordinates[0];
	var y = coordinates[1];
	var z = coordinates[2];
	var newHorizontalLength = sqrt(pow(x,2) + pow(y,2));
	var totalDistance = sqrt(pow(x,2) + pow(y,2) + pow(z,2));

	// we'll keep the gripper oriented the same way with respect to the xy plane
	var verticalGripLength = gripLength * sind( pitchAngle);
	var horizontalGripLength = gripLength * cosd( pitchAngle);

	// by keeping the orientation of the gripper the same, we can solve for the position of the wrist axis instead.
	var shoulderToWristLength = sqrt( pow((newHorizontalLength - horizontalGripLength),2) + pow((z - verticalGripLength),2));
	var shoulderToWristAngle = atand( (z - verticalGripLength) / (newHorizontalLength - horizontalGripLength) );
	if ( shoulderToWristAngle < 0 ) shoulderToWristAngle = shoulderToWristAngle + 180;

	/*
	from Law of Cosines
	c^2 = a^2 + b^2 - 2 * a * b * cosd(C)
	2 * a * b * cosd(C) = a^2 + b^2 - c^2
	cosd(C) = ( a^2 + b^2 - c^2 ) / ( 2 * a * b )
	C = acosd( ( a^2 + b^2 - c^2 ) / ( 2 * a * b ) )
	 */
	var C = acosd( ( pow(this.segment1Length,2) + pow(this.segment2Length,2) - pow(shoulderToWristLength,2) ) / ( 2 * this.segment1Length * this.segment2Length ) );
	// B = acosd( ( a^2 + c^2 - b^2 ) / ( 2 * a * c ) )
	var B = acosd( ( pow(this.segment1Length,2) + pow(shoulderToWristLength,2) - pow(this.segment2Length,2) ) / ( 2 * this.segment1Length * shoulderToWristLength ) );

	var newElbowAngle =  C - 180;
	var newShoulderAngle = shoulderToWristAngle + B;

	// pitchAngle = newWristAngle + newElbowAngle + newShoulderAngle
	var newWristAngle = pitchAngle - newElbowAngle - newShoulderAngle;

	var newBaseAngle = atand(y/x);

	// Due to loss of precision, it's possible to get angles with slight unreal components for perfectly-reasonable coordinates, so we have to deal with that.
	if ( !isreal(newElbowAngle) || !isreal(newShoulderAngle) || !isreal(newBaseAngle) || !isreal(newWristAngle) )
	{
		// at least one of the angles has an unreal component.
		// This could mean the point isn't reachable (too far away), or it could be loss of precision.
		// Check to see if we reach the same point without the unreal components.
		if ( this.findCoordinates([real(newBaseAngle), real(newShoulderAngle), real(newElbowAngle), real(newWristAngle)], gripLength) == coordinates)
		{
			// the unreal components are small enough to be insignificant, so just get rid of them
			newBaseAngle = real(newBaseAngle);
			newShoulderAngle = real(newShoulderAngle);
			newElbowAngle = real(newElbowAngle);
			newWristAngle = real(newWristAngle);
		}
	}
	var angles = new Array(newBaseAngle, newShoulderAngle, newElbowAngle, newWristAngle);
	return angles;
}

// returns the coordinates corresponding to the given angles and gripLength
function findCoordinates(angles, gripLength)
{
	var baseAngle = angles[0];
	var shoulderAngle = angles[1];
	var elbowAngle = angles[2];
	var wristAngle = angles[3];
	var z = this.segment1Length * sind(shoulderAngle) + this.segment2Length * sind(elbowAngle + shoulderAngle) + gripLength * sind(wristAngle + elbowAngle + shoulderAngle);
	var horizontalLength = this.segment1Length * cosd(shoulderAngle) + this.segment2Length * cosd(elbowAngle + shoulderAngle) + gripLength * cosd(wristAngle + elbowAngle + shoulderAngle);
	var x = horizontalLength * cosd(baseAngle);
	var y = horizontalLength * sind(baseAngle);
	var coordinates = new Array(x,y,z);
	return coordinates;
}

// checks to ensure the given angles are within the arm's limits
function safetyCheckAxisAngles(angles)
{
	if (!Array.isArray(angles))
	{
		return false;
	}
	if  (!isreal(angles))
		return false;
	for ( var i = 0; i < angles.length; ++i)
	{
		/*if ( abs(angles[i] ) == Inf )
		{
			return false;
		}*/
		if ( angles[i] === NaN)
			return false;
		if ( angles[i] < this.axisRanges[i][0] || angles[i] > this.axisRanges[i][1] )
		{
			return false;
		}
	}
	return true;
}

// calculates the grip separation and distance from wrist axis to grip tip, given the angle of the top linkage.
// returns a structure containing separation, length, and the angle of the gripper pads.
function getGripInfo(topLinkageAngle)
{
	// measurements are in cm. Sorry for the confusing names/descriptions.
	var topLinkageLength = 5.2;	// length of linkage attached to gear
	var bottomLinkageLength = 4.65;	//length of each bottom linkage
	var linkageSeparationGripper = 2.7;	// distance between where the two linkages attach on the gripper side
	var gripperBendDistance = 4.7;	// distance from where the top linkage attaches to where the piece bends
	var bendAngle = 30;	// angle that the grip bends between the pad and where it attaches to the linkages.
	var xBendToTip = 6.9;	// distance from the bend to the tip of the gripper (measured in line with the two screws holding the grip together.
	var gripInteriorStep = .8;	// distance from the inner part of the grip (with pad) to the line between the two screws.
	var topLinkageSeparation = 2.75;	// distance between the axes of the two gears (or the ends of the two top linkages)
	var bottomLinkageSeparation = 1;	// distance between the two bottom linkages
	var topToBottomLinkDistanceX = 2.4;	// distance between the top and bottom linkages on the main body (motor side), measured parallel to arm
	var topToBottomLinkDistanceY = (topLinkageSeparation - bottomLinkageSeparation) / 2;	// distance between the top and bottom linkages on the main body (motor side), measured perpendicular to arm
	var topToBottomLinkDistanceTotal = sqrt(pow(topToBottomLinkDistanceY,2) + pow(topToBottomLinkDistanceX,2) );	// distance between axes of top  and bottom linkages on the arm end
	var topToBottomLinkAngle = atand(topToBottomLinkDistanceY/topToBottomLinkDistanceX);	// angle between anchor points of the top and bottom linkages
	var wristToGripGearLength = 4.7;	// length from the wrist axis to the center of the gears

	/*
	figure out the angle of the gripPlane (plane along the inside of the gripper)
	c^2 = a^2 + b^2 - 2 * a * b * cosd(C)		// Law of Cosines
	C = acosd( ( a^2 + b^2 - c^2 ) / ( 2 * a * b ) ) // derived from Law of Cosines


	A ---------- B
	 \	         \		illustration attempt. ABD = topLinkageAngle + topToBottomLinkAngle, AB = topLinkageLength,
	  \           \		AC = linkageSeparationGripper, CD = bottomLinkageLength,
	    -----______\		BD = topToBottomLinkDistanceTotal
	  C            D

	 */

	// AD^2 = AB^2 + BD^2 - 2 * AB * BD * cosd(ABD)
	var AD = sqrt(pow(topLinkageLength,2) + pow(topToBottomLinkDistanceTotal,2) - 2*topLinkageLength*topToBottomLinkDistanceTotal*cosd(topLinkageAngle+topToBottomLinkAngle) );

	// BD^2 = AB^2 + AD^2 - 2 * AB * AD * cosd(BAD)
	// BAD = acosd( ( AB^2 + AD^2 - BD^2 ) / ( 2 * AB * AD ) )
	var BAD = acosd( ( pow(topLinkageLength,2) + pow(AD,2) - pow(topToBottomLinkDistanceTotal,2) ) / ( 2 * topLinkageLength * AD ) );

	// DAC = acosd( ( AC^2 + AD^2 - CD^2 ) / ( 2 * AC * AD ) )
	var DAC = acosd( ( pow(linkageSeparationGripper,2) + pow(AD,2) - pow(bottomLinkageLength,2) ) / ( 2 * linkageSeparationGripper * AD ) );

	var BAC = BAD + DAC;

	var gripPadAngle = ( topLinkageAngle - ( 180 - BAC ) + bendAngle );

	// x and y coordinates of a gripper tip, with (0,0) as the center of the gear the top linkage is attached to
	var x = (xBendToTip+gripperBendDistance*cosd(bendAngle))*cosd(gripPadAngle) + (gripInteriorStep+gripperBendDistance*sind(bendAngle))*sind(gripPadAngle) + topLinkageLength*cosd(topLinkageAngle);
	var y = (xBendToTip+gripperBendDistance*cosd(bendAngle))*sind(gripPadAngle) + (gripInteriorStep+gripperBendDistance*sind(bendAngle))*sind(gripPadAngle-90) + topLinkageLength*sind(topLinkageAngle);

	// these are for debugging purposes.
	var yAtTopLink = topLinkageLength*sind(topLinkageAngle);
	var sepAtTopLink = 2*yAtTopLink + topLinkageSeparation;
	var yAtBend = yAtTopLink + (gripperBendDistance*cosd(bendAngle))*sind(gripPadAngle) + (gripperBendDistance*sind(bendAngle) )*sind(gripPadAngle-90);
	var sepAtBend = 2*yAtBend + topLinkageSeparation;
	var yAtTip = (xBendToTip + gripperBendDistance*cosd(bendAngle))*sind(gripPadAngle) + (gripInteriorStep+gripperBendDistance*sind(bendAngle))*sind(gripPadAngle-90) + topLinkageLength*sind(topLinkageAngle);

	var currentSeparation = 2*y + topLinkageSeparation;
	var gripLength = x + wristToGripGearLength;

	var info = {'separation': currentSeparation, 'gripLength': gripLength, 'gripPadAngle': gripPadAngle};
	/*info.separation = currentSeparation;
	info.gripLength = gripLength;
	info.gripPadAngle = gripPadAngle;*/
	return info;
}

// translates verbal name for axis into index for the arrays storing info (axisAngles, axisToMotorAdjustments, etc.)
function getIndexOfAxis(axisName)
{
	if (axisName == 'base' )
		return 0;
	else if (axisName == 'shoulder')
		return 1;
	else if (axisName == 'elbow')
		return 2;
	else if (axisName == 'wrist')
		return 3;
	else if (axisName == 'grip')
		return 4;
	else error('unrecognized axis');
}



function getCurrentCoordinates()
{
	var gripLength = this.getCurrentGripInfo().gripLength;
	var coordinates = this.findCoordinates(this.axisAngles, gripLength);
	return coordinates;
}

function getAxisAngle(axisName)
{
	var axis = getIndexOfAxis(axisName);
	if (axis === undefined)
		return;
	var angle = this.axisAngles[axis];
	return angle;
}

/*
	Moves the arm at the specified speed (in degrees/sec), spreading each axis's movement over the whole period.
	Still not completely accurate. pause() is not perfect, and can only work in intervals of about .015 seconds
	Speed of motors (how fast they move to a new position) is 300 degrees/sec for elbow, 428.5 for shoulder, 333 for wrist and grip
 */
function moveAxesAtSpeedEvenly(targetAngles, speed, maxDegreeStep)
{
	if (speed === undefined)
		speed = 50;	// degrees per second
	var period = 1 / speed;	// seconds per degree
	if (maxDegreeStep === undefined)
		maxDegreeStep = 1;
	//targetAngles = double(int16(targetAngles));
	var thereYet = false;
	var currentAngles = this.axisAngles;
	var degreeStep = new Array();
	if ( targetAngles.length < currentAngles.length )	// if not all angles are specified, remaining angles should be current angles
	{
		for ( var i = targetAngles.length; i < currentAngles.length; ++i)
			targetAngles[i] = currentAngles[i];
	}
	for ( var i = 0; i < targetAngles.length; ++i)
	{
		degreeStep[i] = abs(targetAngles[i] - currentAngles[i] ) / max(absArray(arraySubtraction(targetAngles, currentAngles) ) ) * maxDegreeStep;
	}

	while (!thereYet)
	{
		var nextAngles = currentAngles;		//preallocating, and ensuring that if we skip an axis, it just stays put.
		thereYet = true;
		for ( var i = 0; i < targetAngles.length; ++i)
		{
			if ( targetAngles[i] - currentAngles[i] > 0 )
				direction = 1;
			else if ( targetAngles[i] - currentAngles[i] < 0 )
				direction = -1;
			else
				// we're done with this axis. Move to the next one
				continue;
			thereYet = false;	// if we haven't skipped this with continue, it means we haven't reached this target angle yet, so we're not done yet.
			if ( abs(targetAngles[i] - currentAngles[i]) > degreeStep[i] )
				nextAngles[i] = currentAngles[i] + degreeStep[i]*direction;
			else
				// the degreeStep is larger than the distance we have left.
				nextAngles[i] = targetAngles[i];
		}
		this.setAxisAnglesOptimized(nextAngles);
		pause(period*degreeStep*1000);
		currentAngles = nextAngles;	// updating the angles.
		
		
	}
}

// moves the arm at the specified speed (in degrees/sec)
// still not completely accurate. pause() is not perfect, and can only work in intervals of about .015 seconds
function moveAxesAtSpeed(targetAngles, speed, degreeStep)
{
	// speed of motors (how fast they move to a new position) is 300 degrees/sec for elbow, 428.5 for shoulder, 333 for wrist and grip

	if (speed === undefined)
		speed = 50;	// degrees per second
	var period = 1 / speed;	// seconds per degree
	if (degreeStep === undefined)
		degreeStep = 1;	// default step is larger, to deal with limitations of pause()
	targetAngles = int16(targetAngles);
	var thereYet = false;
	
	//this.moveTheAxes = moveTheAxes;
	//this.moveTheAxes();
	while (!thereYet)
	{
	//function moveTheAxes()
	//{
		var currentAngles = this.axisAngles;
		var nextAngles = new Array();
		for (var i = 0; i < this.axisAngles.length; ++i)
			nextAngles[i] = this.axisAngles[i];
		thereYet = true;
		for ( var i = 0; i < targetAngles.length; ++i)
		{
			var direction;
			if ( targetAngles[i] - currentAngles[i] > 0 )
				direction = 1;
			else if ( targetAngles[i] - currentAngles[i] < 0 )
				direction = -1;
			else
				// we're done with this axis. Move to the next one
				continue;
			thereYet = false;	// if we haven't skipped this with continue, it means we haven't reached all target angles yet.
			if ( abs(targetAngles[i] - currentAngles[i]) > degreeStep )
				nextAngles[i] = currentAngles[i] + degreeStep*direction;
			else
				// the degreeStep is larger than the distance we have left.
				nextAngles[i] = targetAngles[i];
		}
		this.setAxisAnglesOptimized(nextAngles);	// using optimized function now.
		pause(period*degreeStep*1000);
		
	/*	this.setAxisAnglesOptimized(nextAngles);
		if (!thereYet)
		{
			//setTimeout(moveTheAxes, 1000*period*degreeStep);
			setTimeout(moveTheAxes, period*degreeStep);
		}*/
			
	}
}


// enhanced function, only sets the angles that actually change, and doesn't use servoRead. Much faster.
function setAxisAnglesOptimized(newAngles)
{
	if (!this.safetyCheckAxisAngles(newAngles))
	{
		console.log("invalid angles passed to setAxisAnglesOptimized. These should have been checked earlier.");
		return;
	}
	for ( var i = 0; i < newAngles.length; ++i)
	{
		if ( int16( newAngles[i] ) != this.axisAngles[i] )
		{
			// only write to the servo if we're actually changing the angle
			//this.ardy.servoWrite(this.ports[i], int16(newAngles[i] + this.axisToMotorAdjustments[i]));
			this.motors[i].angle = newAngles[i] + this.axisToMotorAdjustments[i];
			this.axisAngles[i] = int16( newAngles[i] );	// rather than read from the servo (which takes a lot of time), just set the value to whatever we told the servo to go to.
			// note that this could cause rounding issues if the axisToMotorAdjustment is a non-integer.
		}
	}
}

// moves the tip of the gripper to the given coordinates in a straight line.
function moveStraightTo(targetCoordinates, pitchAngle, speed)
{	
	var gripLength = this.getCurrentGripInfo().gripLength;
	if (pitchAngle === undefined)
		// if no pitch is specified, use the current one
		pitchAngle = this.getAxisAngle('shoulder') + this.getAxisAngle('elbow') + this.getAxisAngle('wrist');
	if (speed === undefined)
		speed = 35;
	var stepDistance = 1;
	var period = 1 / speed;
	var currentCoordinates = this.getCurrentCoordinates();
	//var direction = ( arraySubtraction(targetCoordinates, currentCoordinates) ) / sqrt( pow((targetCoordinates[0]-currentCoordinates[0]),2) + pow((targetCoordinates[1]-currentCoordinates[1]),2) + pow((targetCoordinates[2]-currentCoordinates[2]),2) );
	var direction = getDirectionVector(currentCoordinates, targetCoordinates);
	var reached = false;
	while (!reached)
	{
		var distance = sqrt( pow((targetCoordinates[0]-currentCoordinates[0]),2) + pow((targetCoordinates[1]-currentCoordinates[1]),2) + pow((targetCoordinates[2]-currentCoordinates[2]),2) );
		if ( distance < stepDistance )
		{
			nextCoordinates = targetCoordinates;
			reached = true;
		}
		else
			nextCoordinates = arrayAddition(currentCoordinates, arrayMultiplication(stepDistance, direction ));
		newAngles = this.findAnglesConstantPitch(nextCoordinates, gripLength, pitchAngle);
		if (!this.safetyCheckAxisAngles(newAngles))
		{
			error('invalid angles:\n%f     %f    %f     %f\nTrying to reach point (%f, %f, %f)', newAngles[0], newAngles[1], newAngles[2], newAngles[3], nextCoordinates[0], nextCoordinates[1], nextCoordinates[2]);
			console.log(newAngles[0], newAngles[1], newAngles[2], newAngles[3]);
			console.log(nextCoordinates[0], nextCoordinates[1], nextCoordinates[2]);
			return;
		}
		this.setAxisAnglesOptimized(newAngles);
		currentCoordinates = nextCoordinates;
		pause(period*stepDistance*1000);
	}
}


// moves the tip of the gripper to the given coordinates. Can specify a new pitch, or leave blank to use current one.
function moveTo(coordinates, pitchAngle, moveEvenly)	
{
	var gripLength = this.getCurrentGripInfo().gripLength;
	if (pitchAngle === undefined)
	{
		// if no pitch is specified, use the current one
		pitchAngle = this.getAxisAngle('shoulder') + this.getAxisAngle('elbow') + this.getAxisAngle('wrist');
	}
	if (moveEvenly === undefined)
		//moveEvenly = true;
		moveEvenly = false;
	var newAngles = this.findAnglesConstantPitch(coordinates, gripLength, pitchAngle);
	if (!this.safetyCheckAxisAngles(newAngles))
	{
		error('invalid angles:\n%f     %f    %f     %f\nTrying to reach point (%f, %f, %f)', newAngles[0], newAngles[1], newAngles[2], newAngles[3], coordinates[0], coordinates[1], coordinates[2]);
		console.log(newAngles[0], newAngles[1], newAngles[2], newAngles[3]);
		console.log(coordinates[0], coordinates[1], coordinates[2]);
		return;
	}
	if (moveEvenly)
		this.moveAxesAtSpeedEvenly(newAngles);
	else
		this.moveAxesAtSpeed(newAngles);
		//this.setAxisAnglesOptimized(newAngles);
}
function moveToInches(coordinates, pitchAngle)
{
	this.moveTo(coordinates * 2.54, pitchAngle);
}




function getCurrentGripInfo()
{
	return this.getGripInfo(this.getAxisAngle('grip'));
}

// moves grip to specified separation
function gripControl(targetSeparation, relative)
{
	if (relative === undefined)
		relative = false;
	var currentSeparation = this.getCurrentGripInfo().separation;
	if (relative)
		targetSeparation = currentSeparation + targetSeparation;
	if ( targetSeparation - currentSeparation > 0 )
		direction = 1;
	else
		direction = -1;
	var angle = this.getAxisAngle('grip');
	// we could use inverse kinematics for this, but it's a lot easier to just open/close the grip until we reach our target.
	while ( (targetSeparation-currentSeparation)*direction > 0 )
	{
		angle = angle + direction;	// advance closer to target by one degree
		if ( angle < this.gripAxisRange[0] || angle > this.gripAxisRange[1] )
		{
			error('grip angle out of range: %f', angle);
			return;
		}
		this.gripMotor.angle = int16(angle+this.gripAxisToMotorAdjustment);
		this.axisAngles[this.getIndexOfAxis('grip')] = angle;	// update the grip angle
		currentSeparation = this.getCurrentGripInfo().separation;
	}
}

/* allows a single axis to be easily set from the command line.
	axisName-- string with name of axis to be moved.
	angle-- the angle to move the axis to.
	relative-- bool. If set to true, it means the axis should move BY the given angle amount, not TO the angle. Default is false.
	safetyRangeOverride-- bool. Set this to true if you need to move an axis outside its range. Use with caution. Default is false.
*/
function move(axisName, angle, relative, safetyRangeOverride)
{
	if (relative === undefined)
		relative = false;
	if (safetyRangeOverride === undefined)
		safetyRangeOverride = false;

	var i = this.getIndexOfAxis(axisName);
	if (i === undefined)
		return;

	if (relative)
		// if set to relative, it means the arm should be moved by the specified amount.
		angle = angle + this.axisAngles[i];

	// check to ensure we're within bounds. The checks for unreal and infinity shouldn't be needed, but are there just in case.
	if ( ( !safetyRangeOverride && ( angle < this.axisRanges[i][0] || angle > this.axisRanges[i][1] ) ) || !isreal(angle) )
	{
		error('invalid position for %s: %f', axisName, angle);
		console.log(axisName, angle);
		return;
	}

	//this.ardy.servoWrite(this.ports[i], int16(angle + this.axisToMotorAdjustments[i]) );	// send command
	this.motors[i].angle = angle + this.axisToMotorAdjustments[i];
	this.axisAngles[i] = angle;
}
