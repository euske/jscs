// main.js

function Scene(tiles, tilesize, width, height)
{
  this.tiles = tiles;
  this.tilesize = tilesize;
  this.floor = new Rectangle(0, height-this.tilesize, width, this.tilesize);
}
Scene.prototype.collide = function (rect, vx, vy)
{
  return collideRect(this.floor, rect, new Point(vx, vy));
}
Scene.prototype.repaint = function (ctx)
{
  for (var x = 0; x < this.floor.width; x += this.tilesize) {
    ctx.drawImage(this.tiles,
		  this.tilesize, 0, this.tilesize, this.tilesize,
		  x, this.floor.y,
		  this.tilesize, this.tilesize);
  }
}

function Player(scene, sprites, width, height)
{
  this.speed = 8;
  this.gravity = 2;
  this.maxspeed = 16;
  this.jumpacc = -16;
  this.scene = scene;
  this.sprites = sprites;
  this.rect = new Rectangle(0, 0, width, height);
  this.vx = this.vy = 0;
  this.gy = 0;
}
Player.prototype.idle = function ()
{
  var v = new Point(this.speed * this.vx, this.gy);
  var d = this.scene.collide(this.rect, v.x, v.y);
  d.x = this.scene.collide(this.rect, v.x, d.y).x;
  d.y = this.scene.collide(this.rect, d.x, v.y).y;
  this.rect.move(d.x, d.y);
  this.gy = Math.min(d.y + this.gravity, this.maxspeed);
}
Player.prototype.jump = function ()
{
  var v = this.scene.collide(this.rect, 0, this.gy);
  if (0 < this.gy && v.y == 0) {
    this.gy = this.jumpacc;
    return true;
  }
  return false;
}
Player.prototype.repaint = function (ctx)
{
  ctx.drawImage(this.sprites,
		0, 0, this.rect.width, this.rect.height,
		this.rect.x, this.rect.y,
		this.rect.width, this.rect.height);
}

function Game(canvas, tiles, sprites, music, audio)
{
  this.canvas = canvas;
  this.tiles = tiles;
  this.sprites = sprites;
  this.music = music;
  this.audio = audio;
  this.active = false;
}

Game.prototype.keydown = function (ev)
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

Game.prototype.keyup = function (ev)
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

Game.prototype.init = function ()
{
  var tilesize = 32;
  this.scene = new Scene(this.tiles, tilesize, this.canvas.width, this.canvas.height);
  this.player = new Player(this.scene, this.sprites, tilesize, tilesize);
  this.focus();
}

Game.prototype.idle = function ()
{
  this.player.idle();
}

Game.prototype.focus = function (ev)
{
  this.active = true;
  this.music.play();
}

Game.prototype.blur = function (ev)
{
  this.music.pause();
  this.active = false;
}

Game.prototype.repaint = function (ctx)
{
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  //ctx.fillStyle = 'blue';
  //ctx.fillRect(this.x, this.y, 100, 100);
  this.scene.repaint(ctx);
  this.player.repaint(ctx);
  ctx.restore();
}

Game.prototype.action = function ()
{
  if (this.player.jump()) {
    this.audio.play();
  }
}

function run()
{
  var canvas = document.getElementById('canvas');
  var tiles = document.getElementById('sprites');
  var sprites = document.getElementById('sprites');
  var music = document.getElementById('music');
  var audio = document.getElementById('audio');
  var ctx = canvas.getContext('2d');
  var game = new Game(canvas, tiles, sprites, music, audio);
  var dt = 1000/20;
  function idle() {
    if (game.active) {
      game.idle();
      game.repaint(ctx);
    }
    window.setTimeout(idle, dt);
  };
  window.setTimeout(idle, dt);
  function resize() {
  };
  window.addEventListener('resize', resize);
  window.addEventListener('keydown', function (e) { game.keydown(e); });
  window.addEventListener('keyup', function (e) { game.keyup(e); });
  window.addEventListener('focus', function (e) { game.focus(e); });
  window.addEventListener('blur', function (e) { game.blur(e); });
  game.init();
}
