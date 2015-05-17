// game.js

// Game class handles the event loop and global state management.
// It also has shared resources (images, audios, etc.)

function Game(framerate, frame, images, audios, labels)
{
  this.framerate = framerate;
  this.frame = frame;
  this.images = images;
  this.audios = audios;
  this.labels = labels;
  this.active = false;

  // [GAME SPECIFIC CODE]
  this.sprites = this.images.sprites;
  this.tiles = this.images.tiles;

  // Initialize the off-screen bitmap.
  var scale = 2;
  this.screen = createCanvas(this.frame.width/scale,
			     this.frame.height/scale);
  this.ctx = getEdgeyContext(this.screen)
  
  this._key_left = false;
  this._key_right = false;
  this._key_up = false;
  this._key_down = false;
  this._vx = 0;
  this._vy = 0;
}

Game.prototype.renderString = function(font, text, scale, x, y)
{
  var fs = font.height;
  for (var i = 0; i < text.length; i++) {
    var c = text.charCodeAt(i);
    this.ctx.drawImage(font,
		       (c-32)*fs, 0, fs, fs,
		       x, y, fs*scale, fs*scale);
    x += fs*scale;
  }
}

Game.prototype.addElement = function(bounds)
{
  var e = document.createElement('div');
  e.style.position = 'absolute';
  e.style.left = bounds.x+'px';
  e.style.top = bounds.y+'px';
  e.style.width = bounds.width+'px';
  e.style.height = bounds.height+'px';
  e.style.padding = '0px';
  this.frame.parentNode.appendChild(e);
  return e;
}

Game.prototype.removeElement = function(e)
{
  e.parentNode.removeChild(e);
}

Game.prototype.keydown = function (ev)
{
  // [OVERRIDE]
  switch (ev.keyCode) {
  case 37:			// LEFT
  case 65:			// A
  case 72:			// H
    this._key_left = true;
    this._vx = -1;
    break;
  case 39:			// RIGHT
  case 68:			// D
  case 76:			// L
    this._key_right = true;
    this._vx = +1;
    break;
  case 38:			// UP
  case 87:			// W
  case 75:			// K
    this._key_up = true;
    this._vy = -1;
    break;
  case 40:			// DOWN
  case 83:			// S
  case 74:			// J
    this._key_down = true;
    this._vy = +1;
    break;
  case 13:			// ENTER
  case 32:			// SPACE
  case 90:			// Z
  case 88:			// X
    this.action();
    break;
  case 112:			// F1
    break;
  case 27:			// ESC
    if (this.active) {
      this.blur();
    } else {
      this.focus();
    }
    break;
  }
};

Game.prototype.keyup = function (ev)
{
  // [OVERRIDE]
  switch (ev.keyCode) {
  case 37:			// LEFT
  case 65:			// A
  case 72:			// H
    this._key_left = false;
    this._vx = (this._key_right) ? +1 : 0;
    break;
  case 39:			// RIGHT
  case 68:			// D
  case 76:			// L
    this._key_right = false;
    this._vx = (this._key_left) ? -1 : 0;
    break;
  case 38:			// UP
  case 87:			// W
  case 75:			// K
    this._key_up = false;
    this._vy = (this._key_down) ? +1 : 0;
    break;
  case 40:			// DOWN
  case 83:			// S
  case 74:			// J
    this._key_down = false;
    this._vy = (this._key_up) ? -1 : 0;
    break;
  }
};

Game.prototype.focus = function (ev)
{
  // [OVERRIDE]
  this.active = true;
  //this.audios.music.play();
};

Game.prototype.blur = function (ev)
{
  // [OVERRIDE]
  //this.audios.music.pause();
  this.active = false;
};

Game.prototype.init = function ()
{
  // [OVERRIDE]
  // [GAME SPECIFIC CODE]
  removeChildren(this.frame.parentNode, 'div');

  var tilesize = 32;
  this.scene = new Scene(this, tilesize);
  this.scene.init();
  
  var rect = new Rectangle(1, 10, 1, 1);
  this.player = new Player(this.scene.tilemap.map2coord(rect));
  this.scene.addActor(this.player);
  
  var game = this;
  function player_jumped(e) {
    game.audios.jump.currentTime = 0;
    game.audios.jump.play();
  }
  function player_picked(e) {
    game.audios.pick.currentTime = 0;
    game.audios.pick.play();
    game.addScore(+1);
  }
  this.player.picked.subscribe(player_picked);
  this.player.jumped.subscribe(player_jumped);
  
  this.score_node = this.addElement(new Rectangle(10, 10, 100, 20));
  this.score_node.align = 'left';
  this.score_node.style.color = 'white';
  this.score = 0;
  this.addScore(0);
};

Game.prototype.idle = function ()
{
  // [OVERRIDE]
  // [GAME SPECIFIC CODE]
  this.player.move(this._vx, this._vy);
  var window = this.scene.window;
  var rect = this.player.bounds.inset(-window.width/4, -window.height/4);
  this.scene.setCenter(rect);
  this.scene.idle();
};

Game.prototype.repaint = function ()
{
  // [OVERRIDE]
  // [GAME SPECIFIC CODE]
  this.ctx.clearRect(0, 0, this.screen.width, this.screen.height);
  this.ctx.save();
  this.scene.render(this.ctx,
		    (this.screen.width-this.scene.window.width)/2,
		    (this.screen.height-this.scene.window.height)/2);
  this.ctx.restore();
};

Game.prototype.action = function()
{
  // [OVERRIDE]
  // [GAME SPECIFIC CODE]
  this.player.jump();
};

Game.prototype.addScore = function (d)
{
  // [GAME SPECIFIC CODE]
  this.score += d;
  this.score_node.innerHTML = ('Score: '+this.score);
};
