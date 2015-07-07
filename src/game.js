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
  this.msgs = [];
  this.music = null;

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
  this._key_action = false;
  this._vx = 0;
  this._vy = 0;
}

Game.prototype.renderString = function (font, text, scale, x, y, align)
{
  var fs = font.height;
  if (align == 'right') {
    x -= fs*scale*text.length;
  } else if (align == 'center') {
    x -= fs*scale*text.length/2;
  }
  for (var i = 0; i < text.length; i++) {
    var c = text.charCodeAt(i);
    this.ctx.drawImage(font,
		       (c-32)*fs, 0, fs, fs,
		       x, y, fs*scale, fs*scale);
    x += fs*scale;
  }
}

Game.prototype.addElement = function (bounds)
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

Game.prototype.removeElement = function (e)
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
    if (!this._key_action) {
      this._key_action = true;
      if (this.scene.action !== undefined) {
	this.scene.action(true);
      }
    }
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
  case 13:			// ENTER
  case 32:			// SPACE
  case 90:			// Z
  case 88:			// X
    if (this._key_action) {
      this._key_action = false;
      if (this.scene.action !== undefined) {
	this.scene.action(false);
      }
    }
    break;
  }
};

Game.prototype.mousedown = function (ev)
{
  // [OVERRIDE]
  if (this.scene.mousedown !== undefined) {
    if (ev.target === this.frame) {
      this.scene.mousedown(
	ev.layerX*this.screen.width/this.frame.width,
	ev.layerY*this.screen.height/this.frame.height,
	ev.button);
    }
  }
};

Game.prototype.mouseup = function (ev)
{
  // [OVERRIDE]
  if (this.scene.mouseup !== undefined) {
    if (ev.target === this.frame) {
      this.scene.mouseup(
	ev.layerX*this.screen.width/this.frame.width,
	ev.layerY*this.screen.height/this.frame.height,
	ev.button);
    }
  }
};

Game.prototype.mousemove = function (ev)
{
  // [OVERRIDE]
  if (this.scene.mousemove !== undefined) {
    if (ev.target === this.frame) {
      this.scene.mousemove(
	ev.layerX*this.screen.width/this.frame.width,
	ev.layerY*this.screen.height/this.frame.height);
    }
  }
};

Game.prototype.focus = function (ev)
{
  // [OVERRIDE]
  this.active = true;
  if (this.music !== null) {
    this.music.play();
  }
};

Game.prototype.blur = function (ev)
{
  // [OVERRIDE]
  if (this.music !== null) {
    this.music.pause();
  }
  this.active = false;
};

Game.prototype.init = function (state, score)
{
  // [OVERRIDE]
  // [GAME SPECIFIC CODE]
  removeChildren(this.frame.parentNode, 'div');
  if (this.music !== null) {
    this.music.pause();
  }

  var game = this;
  function title_changed(e) {
    game.post(function () { game.init(1); });
  }
  function level_changed(e, arg, score) {
    switch (arg) {
    case 'WON': game.post(function () { game.init(2, score); }); break;
    case 'LOST': game.post(function () { game.init(3, score); }); break;
    }
  }
  switch (state) {
  case 0:
    this.scene = new Title(this);
    this.scene.init('<b>Sample Game</b><p>Made with JSCS<p>Press Enter to start.');
    this.scene.changed.subscribe(title_changed);
    this.music = null;
    break;
  case 1:
    this.scene = new Level1(this);
    this.scene.init();
    this.scene.changed.subscribe(level_changed);
    this.music = this.scene.music;
    break;
  case 2:
    this.scene = new Title(this);
    this.scene.init('<b>You Won!</b><p><b>Score:'+score+'</b><p>Press Enter to restart.');
    this.scene.changed.subscribe(title_changed);
    this.music = this.audios.ending;
    break;
  case 3:
    this.scene = new Title(this);
    this.scene.init('<b>You Lost!</b><p><b>Score:'+score+'</b><p>Press Enter to restart.');
    this.scene.changed.subscribe(title_changed);
    this.music = this.audios.explosion;
    break;
  }
  
  if (this.music !== null) {
    playSound(this.music);
  }
};

Game.prototype.post = function (msg)
{
  this.msgs.push(msg);
};

Game.prototype.update = function ()
{
  // [OVERRIDE]
  // [GAME SPECIFIC CODE]
  this.scene.move(this._vx, this._vy);
  this.scene.update();

  while (0 < this.msgs.length) {
    var msg = this.msgs.shift();
    msg();
  }
};

Game.prototype.repaint = function ()
{
  // [OVERRIDE]
  // [GAME SPECIFIC CODE]
  this.ctx.clearRect(0, 0, this.screen.width, this.screen.height);
  this.ctx.save();
  this.scene.render(this.ctx, 0, 0);
  this.ctx.restore();
};
