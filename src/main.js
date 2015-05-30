// main.js

// Browser interaction.

function run()
{
  // [NO NEED TO CHANGE]
  
  function getprops(a) {
    var d = {};
    for (var i = 0; i < a.length; i++) { d[a[i].id] = a[i]; }
    return d;
  }
  
  var framerate = 30;
  var images = getprops(document.getElementsByTagName('img'));
  var audios = getprops(document.getElementsByTagName('audio'));
  var labels = getprops(document.getElementsByClassName('label'));
  var frame = document.getElementById('main');
  var game = new Game(framerate, frame, images, audios, labels);
  var ctx = getEdgeyContext(frame);
  var timer;
  
  function repaint() {
    ctx.drawImage(game.screen,
		  0, 0, game.screen.width, game.screen.height,
		  0, 0, frame.width, frame.height);
  }    
  
  function update() {
    if (game.active) {
      game.update();
      game.repaint();
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
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,64, 0.5)'; // gray out.
    ctx.fillRect(0, 0, frame.width, frame.height);
    ctx.fillStyle = 'lightgray';
    ctx.beginPath();		// draw a play button.
    ctx.moveTo(frame.width/2-size, frame.height/2-size);
    ctx.lineTo(frame.width/2-size, frame.height/2+size);
    ctx.lineTo(frame.width/2+size, frame.height/2);
    ctx.fill();
    ctx.restore();
  };
  
  window.addEventListener('keydown', keydown);
  window.addEventListener('keyup', keyup);
  window.addEventListener('focus', focus);
  window.addEventListener('blur', blur);
  
  game.init(0);
  game.focus(null);
  timer = window.setInterval(update, 1000/framerate);
}
