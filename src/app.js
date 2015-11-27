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
  this.font = new Font(this.images.font, 'white');
  
  this._key_left = false;
  this._key_right = false;
  this._key_up = false;
  this._key_down = false;
  this.key_action = false;
  this.key_dir = new Vec2();
}

define(App, Object, '', {
  addElement: function (bounds) {
    var e = document.createElement('div');
    e.style.position = 'absolute';
    e.style.left = bounds.x+'px';
    e.style.top = bounds.y+'px';
    e.style.width = bounds.width+'px';
    e.style.height = bounds.height+'px';
    e.style.padding = '0px';
    this.frame.parentNode.appendChild(e);
    return e;
  },

  removeElement: function (e) {
    e.parentNode.removeChild(e);
  },

  keydown: function (ev) {
    // [OVERRIDE]
    // [GAME SPECIFIC CODE]
    var keysym = getKeySym(ev.keyCode);
    switch (keysym) {
    case 'left':
      this._key_left = true;
      this.key_dir.x = -1;
      this.scene.set_dir(this.key_dir.x, 0);
      break;
    case 'right':
      this._key_right = true;
      this.key_dir.x = +1;
      this.scene.set_dir(this.key_dir.x, 0);
      break;
    case 'up':
      this._key_up = true;
      this.key_dir.y = -1;
      this.scene.set_dir(0, this.key_dir.y);
      break;
    case 'down':
      this._key_down = true;
      this.key_dir.y = +1;
      this.scene.set_dir(0, this.key_dir.y);
      break;
    case 'action':
      if (!this.key_action) {
	this.key_action = true;
	this.scene.set_action(this.key_action);
      }
      break;
    default:
      switch (ev.keyCode) {
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
      break;
    }
    this.scene.keydown(ev.keyCode);
  },

  keyup: function (ev) {
    // [OVERRIDE]
    // [GAME SPECIFIC CODE]
    var keysym = getKeySym(ev.keyCode);
    switch (keysym) {
    case 'left':
      this._key_left = false;
      this.key_dir.x = (this._key_right) ? +1 : 0;
      this.scene.set_dir(this.key_dir.x, 0);
      break;
    case 'right':
      this._key_right = false;
      this.key_dir.x = (this._key_left) ? -1 : 0;
      this.scene.set_dir(this.key_dir.x, 0);
      break;
    case 'up':
      this._key_up = false;
      this.key_dir.y = (this._key_down) ? +1 : 0;
      this.scene.set_dir(0, this.key_dir.y);
      break;
    case 'down':
      this._key_down = false;
      this.key_dir.y = (this._key_up) ? -1 : 0;
      this.scene.set_dir(0, this.key_dir.y);
      break;
    case 'action':
      if (this.key_action) {
	this.key_action = false;
	this.scene.set_action(this.key_action);
      }
      break;
    }
    this.scene.keyup(ev.keyCode);
  },

  mousedown: function (ev) {
    // [OVERRIDE]
    if (this.scene.mousedown !== undefined) {
      if (ev.target === this.frame) {
	this.scene.mousedown(
	  ev.layerX*this.screen.width/this.frame.width,
	  ev.layerY*this.screen.height/this.frame.height,
	  ev.button);
      }
    }
  },

  mouseup: function (ev) {
    // [OVERRIDE]
    if (this.scene.mouseup !== undefined) {
      if (ev.target === this.frame) {
	this.scene.mouseup(
	  ev.layerX*this.screen.width/this.frame.width,
	  ev.layerY*this.screen.height/this.frame.height,
	  ev.button);
      }
    }
  },

  mousemove: function (ev) {
    // [OVERRIDE]
    if (this.scene.mousemove !== undefined) {
      if (ev.target === this.frame) {
	this.scene.mousemove(
	  ev.layerX*this.screen.width/this.frame.width,
	  ev.layerY*this.screen.height/this.frame.height);
      }
    }
  },

  focus: function (ev) {
    // [OVERRIDE]
    this.active = true;
    if (this.music !== null && this.music.loop) {
      this.music.play();
    }
  },

  blur: function (ev) {
    // [OVERRIDE]
    if (this.music !== null) {
      this.music.pause();
    }
    this.active = false;
  },

  init: function (scene) {
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
  },

  post: function (msg) {
    this.msgs.push(msg);
  },

  update: function () {
    // [OVERRIDE]
    // [GAME SPECIFIC CODE]
    this.scene.update();

    while (0 < this.msgs.length) {
      var msg = this.msgs.shift();
      msg();
    }
  },

  repaint: function () {
    // [OVERRIDE]
    this.ctx.clearRect(0, 0, this.screen.width, this.screen.height);
    this.ctx.save();
    this.scene.render(this.ctx, 0, 0);
    this.ctx.restore();
  },

});
