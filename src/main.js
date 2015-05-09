// main.js

function run()
{
  function getprops(a) {
    var d = {};
    for (var i = 0; i < a.length; i++) { d[a[i].id] = a[i]; }
    return d;
  }
  
  var framerate = 30;
  var images = getprops(document.getElementsByTagName('img'));
  var audios = getprops(document.getElementsByTagName('audio'));
  var labels = getprops(document.getElementsByClassName('label'));
  var canvas = document.getElementById('canvas');
  var ctx = canvas.getContext('2d');
  var game = new Game(framerate, canvas, images, audios, labels);
  var timer;
  
  function idle() {
    if (game.active) {
      game.idle();
      game.repaint(ctx);
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
      game.repaint(ctx);
    }
  };
  
  function blur(e) {
    if (game.active) {
      game.blur(e);
      game.repaint(ctx);
    }
  };
  
  window.addEventListener('keydown', keydown);
  window.addEventListener('keyup', keyup);
  window.addEventListener('focus', focus);
  window.addEventListener('blur', blur);
  
  game.init();
  game.focus(null);
  timer = window.setInterval(idle, 1000/framerate);
}
