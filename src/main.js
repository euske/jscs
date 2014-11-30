// main.js

function Scene(sprites, ctx, width, height)
{
  this.tilesize = 32;
  this.sprites = sprites;
  this.ctx = ctx;
  this.floor = rect_make(0, height-this.tilesize, width, this.tilesize);
}
Scene.prototype.collide = function (rect, vx, vy)
{
  return collideRect(this.floor, rect, pt_make(vx, vy));
}
Scene.prototype.repaint = function()
{
  for (var x = 0; x < this.floor.width; x += this.tilesize) {
    this.ctx.drawImage(this.sprites,
		       this.tilesize, 0, this.tilesize, this.tilesize,
		       x, this.floor.y,
		       this.tilesize, this.tilesize);
  }
}

function Player(sprites, ctx, scene, width, height)
{
  this.speed = 8;
  this.gravity = 2;
  this.maxspeed = 16;
  this.jumpacc = -16;
  this.sprites = sprites;
  this.ctx = ctx;
  this.scene = scene;
  this.rect = rect_make(0, 0, width, height);
  this.vx = this.vy = 0;
  this.gy = 0;
}
Player.prototype.idle = function()
{
  var v = pt_make(this.speed * this.vx, this.gy);
  var d = this.scene.collide(this.rect, v.x, v.y);
  d.x = this.scene.collide(this.rect, v.x, d.y).x;
  d.y = this.scene.collide(this.rect, d.x, v.y).y;
  this.rect.x += d.x;
  this.rect.y += d.y;
  this.gy = Math.min(d.y + this.gravity, this.maxspeed);
}
Player.prototype.jump = function()
{
  var v = this.scene.collide(this.rect, 0, this.gy);
  if (0 < this.gy && v.y == 0) {
    this.gy = this.jumpacc;
    return true;
  }
  return false;
}
Player.prototype.repaint = function()
{
  this.ctx.drawImage(this.sprites,
		     0, 0, this.rect.width, this.rect.height,
		     this.rect.x, this.rect.y,
		     this.rect.width, this.rect.height);
}

function Game(canvas, sprites, audio)
{
  this.canvas = canvas;
  this.ctx = canvas.getContext('2d');
  this.sprites = sprites;
  this.audio = audio;
}

Game.prototype.init = function()
{
  this.scene = new Scene(this.sprites, this.ctx, this.canvas.width, this.canvas.height);
  this.player = new Player(this.sprites, this.ctx, this.scene, 32, 32);
}

Game.prototype.keydown = function(ev)
{
  switch (ev.keyCode) {
  case 37:			// LEFT
  case 65:			// A
  case 72:			// H
    this.player.vx = -1;
    break;
  case 39:			// RIGHT
  case 68:			// D
  case 76:			// L
    this.player.vx = +1;
    break;
  case 38:			// UP
  case 87:			// W
  case 75:			// K
    this.player.vy = -1;
    break;
  case 40:			// DOWN
  case 83:			// S
  case 74:			// J
    this.player.vy = +1;
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
    this.player.vx = 0;
    break;
  case 38:			// UP
  case 87:			// W
  case 75:			// K
  case 40:			// DOWN
  case 83:			// S
  case 74:			// J
    this.player.vy = 0;
    break;
  }
}

Game.prototype.idle = function()
{
  this.player.idle();
  this.repaint();
}

Game.prototype.repaint = function()
{
  this.ctx.clearRect(0, 0, canvas.width, canvas.height);
  this.ctx.save();
  //this.ctx.fillStyle = 'blue';
  //this.ctx.fillRect(this.x, this.y, 100, 100);
  this.scene.repaint();
  this.player.repaint();
  this.ctx.restore();
}

Game.prototype.action = function()
{
  if (this.player.jump()) {
    this.audio.play();
  }
}

function run()
{
  var dt = 1000/20;
  var canvas = document.getElementById('canvas');
  var sprites = document.getElementById('sprites');
  var audio = document.getElementById('audio');
  var game = new Game(canvas, sprites, audio);
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
