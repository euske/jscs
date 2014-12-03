// main.js

function Scene(tilemap, width, height)
{
  this.tilemap = tilemap;
  this.buffer = document.createElement('canvas');
  this.buffer.width = width;
  this.buffer.height = height;
  this.ctx = this.buffer.getContext('2d');
  this.tilemap.render(this.ctx);
}
Scene.prototype.collide = function (rect, vx, vy)
{
  var f = function (c) { return (c != 0); }
  return this.tilemap.collide(rect, new Point(vx, vy), f);
}
Scene.prototype.repaint = function (ctx)
{
  ctx.drawImage(this.buffer, 0, 0);
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
  var tilemap = new TileMap(tilesize, this.tiles);
  this.scene = new Scene(tilemap, this.canvas.width, this.canvas.height);
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
  ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  ctx.save();
  this.scene.repaint(ctx);
  this.player.repaint(ctx);
  if (!this.active) {
    var size = 50;
    ctx.fillStyle = 'rgba(0,0,64, 0.5)'; // gray out
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.fillStyle = 'lightgray';
    ctx.beginPath();
    ctx.moveTo(this.canvas.width/2-size, this.canvas.height/2-size);
    ctx.lineTo(this.canvas.width/2-size, this.canvas.height/2+size);
    ctx.lineTo(this.canvas.width/2+size, this.canvas.height/2);
    ctx.fill();
  }
  ctx.restore();
}

Game.prototype.action = function ()
{
  if (this.player.jump()) {
    this.audio.play();
  }
}
