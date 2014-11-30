// main.js

function Game(canvas, audio)
{
  this.canvas = canvas;
  this.ctx = canvas.getContext('2d');
  this.audio = audio;
}

Game.prototype.init = function()
{
  this.x = this.y = 0;
  this.vx = this.vy = 0;
}

Game.prototype.keydown = function(ev)
{
  switch (ev.keyCode) {
  case 37:			// LEFT
  case 65:			// A
  case 72:			// H
    this.vx = -1;
    break;
  case 39:			// RIGHT
  case 68:			// D
  case 76:			// L
    this.vx = +1;
    break;
  case 38:			// UP
  case 87:			// W
  case 75:			// K
    this.vy = -1;
    break;
  case 40:			// DOWN
  case 83:			// S
  case 74:			// J
    this.vy = +1;
    break;
  case 13:			// ENTER
  case 32:			// SPACE
  case 90:			// Z
  case 88:			// X
    this.action();
    break;
  case 112:			// F1
    break;
  }
}

Game.prototype.keyup = function(ev)
{
  switch (ev.keyCode) {
  case 37:			// LEFT
  case 65:			// A
  case 72:			// H
  case 39:			// RIGHT
  case 68:			// D
  case 76:			// L
    this.vx = 0;
    break;
  case 38:			// UP
  case 87:			// W
  case 75:			// K
  case 40:			// DOWN
  case 83:			// S
  case 74:			// J
    this.vy = 0;
    break;
  }
}

Game.prototype.idle = function()
{
  this.repaint();
  this.x += this.vx; this.y += this.vy;
}

Game.prototype.repaint = function()
{
  this.ctx.clearRect(0, 0, canvas.width, canvas.height);
  this.ctx.save();
  this.ctx.fillStyle = 'blue';
  this.ctx.fillRect(this.x, this.y, 100, 100);
  this.ctx.restore();
}

Game.prototype.action = function()
{
  this.audio.play();
}

function run()
{
  var dt = 1000/20;
  var canvas = document.getElementById('canvas');
  var audio = document.getElementById('audio');
  var game = new Game(canvas, audio);
  var idle = function() { game.idle(); window.setTimeout(idle, dt); };
  var keydown = function(e) { game.keydown(e); };
  var keyup = function(e) { game.keyup(e); };
  var resize = function(e) { alert(e); };
  window.setTimeout(idle, dt);
  window.addEventListener('keydown', keydown);
  window.addEventListener('keyup', keyup);
  canvas.addEventListener('resize', resize);
  game.init();
}
