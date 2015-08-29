// app.js

// App class handles the event loop and global state management.
// It also has shared resources (images, audios, etc.)

function App(framerate, frame, images, audios, labels)
{
  this.framerate = framerate;
  this.frame = frame;
  this.images = images;
  this.audios = audios;
  this.labels = labels;
  this.active = false;
  this.msgs = [];
  this.music = null;

  // Initialize the off-screen bitmap.
  var scale = 2;
  this.screen = createCanvas(this.frame.width/scale,
			     this.frame.height/scale);
  this.ctx = getEdgeyContext(this.screen);

  // [GAME SPECIFIC CODE]
  this.sprites = this.images.sprites;
  this.tiles = this.images.tiles;
  
  this._key_left = false;
  this._key_right = false;
  this._key_up = false;
  this._key_down = false;
  this._key_action = false;
  this._vx = 0;
  this._vy = 0;
}

App.prototype.renderString = function (font, text, scale, x, y, align)
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
};

App.prototype.addElement = function (bounds)
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
};

App.prototype.removeElement = function (e)
{
  e.parentNode.removeChild(e);
};

App.prototype.keydown = function (ev)
{
  // [OVERRIDE]
  // [GAME SPECIFIC CODE]
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

App.prototype.keyup = function (ev)
{
  // [OVERRIDE]
  // [GAME SPECIFIC CODE]
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

App.prototype.mousedown = function (ev)
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

App.prototype.mouseup = function (ev)
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

App.prototype.mousemove = function (ev)
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

App.prototype.focus = function (ev)
{
  // [OVERRIDE]
  this.active = true;
  if (this.music !== null && this.music.loop) {
    this.music.play();
  }
};

App.prototype.blur = function (ev)
{
  // [OVERRIDE]
  if (this.music !== null) {
    this.music.pause();
  }
  this.active = false;
};

App.prototype.init = function (scene)
{
  // [OVERRIDE]
  removeChildren(this.frame.parentNode, 'div');
  if (this.music !== null) {
    this.music.pause();
  }

  this.scene = scene;
  this.scene.init();
  this.music = this.scene.music;
  
  if (this.music !== null) {
    playSound(this.music);
  }
};

App.prototype.post = function (msg)
{
  this.msgs.push(msg);
};

App.prototype.update = function ()
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

App.prototype.repaint = function ()
{
  // [OVERRIDE]
  this.ctx.clearRect(0, 0, this.screen.width, this.screen.height);
  this.ctx.save();
  this.scene.render(this.ctx, 0, 0);
  this.ctx.restore();
};
