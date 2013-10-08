// this exists in index.html
var canvas = document.getElementById('game');
var context = canvas.getContext('2d');
var image = new Image();
image.src = 'penguin.png';

// our 'player'
var box = {
    x: 0,
    y: 0,
    width: 75,
    height: 75,
    speed: 5
};

// the box can update itself
box.update = function() {
    box.input();
}

// the box can draw itself
box.draw = function() {
    context.drawImage(image, box.x, box.y);
}

box.input = function(){
  // down
  if (40 in keysDown) {
    box.y += box.speed;
  }

  // up
  if (38 in keysDown) {
    box.y -= box.speed;
  }

  // left
  if (37 in keysDown) {
    box.x -= box.speed;
  }

  // right
  if (39 in keysDown) {
    box.x += box.speed;
  }
  
  if(box.x < 0) {
    box.x = 0;
  }
  
  if(box.y < 0) {
    box.y = 0;
  }
  
  if(box.x > canvas.width - box.width) {
    box.x = canvas.width - box.width;
  }
  
  if(box.y > canvas.height - box.height) {
    box.y = canvas.height - box.height;
  }
}

var keysDown = {};

window.addEventListener('keydown', function(event) {
    keysDown[event.keyCode] = true;
    
    if(event.keyCode >= 37 && event.keyCode <= 40) {
        // prevents the window from trying to scroll when we hit the arrow keys
        event.preventDefault();
    }
});

window.addEventListener('keyup', function(event) {
    delete keysDown[event.keyCode];
});

function startGame() {
    canvas.height = 400;
    canvas.width = 800;
    
    loop();
}

// sets the requestAnimationFrame method equal to the correct method for the browser
window.requestAnimationFrame = 
            window.requestAnimationFrame || // Firefox 23 / IE 10 / Chrome
            window.mozRequestAnimationFrame || // Firefox < 23
            window.webkitRequestAnimationFrame || // Safari
            window.msRequestAnimationFrame || // IE
            window.oRequestAnimationFrame; // Opera

function loop() {
    // a browser function that runs animations at a consisten framerate and pauses animation automatically when the tab/window loses focus
    requestAnimationFrame(loop);
    
    update();
    draw();
}

function update() {
    // update the state of the game
    box.update();
}

function draw() {
    // redraw to canvas based on current state
    context.clearRect(0, 0, canvas.width, canvas.height);
    box.draw();
}

// fire it up!
startGame();