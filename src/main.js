// main.js

function run()
{
  function getprops(a) {
    var d = {};
    for (var i = 0; i < a.length; i++) { d[a[i].id] = a[i]; }
    return d;
  }
  
  var scale = 2;
  var framerate = 30;
  var images = getprops(document.getElementsByTagName('img'));
  var audios = getprops(document.getElementsByTagName('audio'));
  var labels = getprops(document.getElementsByClassName('label'));
  var screen = document.getElementById('screen');
  var buffer = document.createElement('canvas');
  buffer.width = screen.width/scale;
  buffer.height = screen.height/scale;
  
  var game = new Game(framerate, screen, buffer, images, audios, labels);
  var timer;
  var scrctx = screen.getContext('2d');
  scrctx.imageSmoothingEnabled = false;
  scrctx.webkitImageSmoothingEnabled = false;
  scrctx.mozImageSmoothingEnabled = false;
  scrctx.msImageSmoothingEnabled = false;
  
  var bufctx = buffer.getContext('2d');
  bufctx.imageSmoothingEnabled = false;
  bufctx.webkitImageSmoothingEnabled = false;
  bufctx.mozImageSmoothingEnabled = false;
  bufctx.msImageSmoothingEnabled = false;

  function repaint() {
    scrctx.drawImage(buffer,
		     0, 0, buffer.width, buffer.height,
		     0, 0, screen.width, screen.height);
  }    
  
  function idle() {
    if (game.active) {
      game.idle();
      game.repaint(bufctx);
      repaint();
    }
  };
  
  function keydown(e) {
    if (game.active) {
      game.keydown(e);
      switch (e.keyCode) {
      case 32:
      case 37:
      case 38:
      case 39:
      case 40:
	e.preventDefault();
	break;
      }
    }
  };
  
  function keyup(e) {
    if (game.active) {
      game.keyup(e);
    }
  };
  
  function focus(e) {
    if (!game.active) {
      game.focus(e);
      repaint();
    }
  };
  
  function blur(e) {
    if (game.active) {
      game.blur(e);
      repaint();
    }
    var size = 50;
    scrctx.save();
    scrctx.fillStyle = 'rgba(0,0,64, 0.5)'; // gray out.
    scrctx.fillRect(0, 0, screen.width, screen.height);
    scrctx.fillStyle = 'lightgray';
    scrctx.beginPath();		// draw a play button.
    scrctx.moveTo(screen.width/2-size, screen.height/2-size);
    scrctx.lineTo(screen.width/2-size, screen.height/2+size);
    scrctx.lineTo(screen.width/2+size, screen.height/2);
    scrctx.fill();
    scrctx.restore();
  };
  
  window.addEventListener('keydown', keydown);
  window.addEventListener('keyup', keyup);
  window.addEventListener('focus', focus);
  window.addEventListener('blur', blur);
  
  game.init();
  game.focus(null);
  timer = window.setInterval(idle, 1000/framerate);
}
