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
    if (!this._key_action) {
      this._key_action = true;
      this.scene.action();
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
    this._key_action = false;
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

Game.prototype.init = function (state)
{
  // [OVERRIDE]
  // [GAME SPECIFIC CODE]
  removeChildren(this.frame.parentNode, 'div');

  var game = this;
  function title_changed(e, arg) {
    game.post(function () { game.init(1); });
  }
  function level_finished(e) {
    game.post(function () { game.init(2); });
  }
  switch (state) {
  case 0:
    this.scene = new Title(this);
    this.scene.init("<b>Sample Game</b><p>Made with JSCS<p>Press Enter to start.");
    this.scene.changed.subscribe(title_changed);
    break;
  case 1:
    this.scene = new Scene(this);
    this.scene.init();
    this.scene.changed.subscribe(level_finished);
    this.score_node = this.addElement(new Rectangle(10, 10, 100, 20));
    this.score_node.align = 'left';
    this.score_node.style.color = 'white';
    this.score = 0;
    this.addScore(0);
    break;
  case 2:
    this.scene = new Title(this);
    this.scene.init("<b>You Won!</b><p>Press Enter to restart.");
    this.scene.changed.subscribe(title_changed);
    break;
  }
};

Game.prototype.post = function (msg)
{
  this.msgs.push(msg);
};

Game.prototype.idle = function ()
{
  // [OVERRIDE]
  // [GAME SPECIFIC CODE]
  this.scene.move(this._vx, this._vy);
  this.scene.idle();

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

Game.prototype.addScore = function (d)
{
  // [GAME SPECIFIC CODE]
  this.score += d;
  this.score_node.innerHTML = ('Score: '+this.score);
};
