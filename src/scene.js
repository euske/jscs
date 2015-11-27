// scene.js
// Scene object takes care of every in-game object and the scrollable map.

function Scene(app)
{
  this.app = app;
  this.music = null;
  this.frame = new Rectangle(0, 0, app.screen.width, app.screen.height);
}

define(Scene, Object, '', {
  changeScene: function (scene) {
    var app = this.app;
    app.post(function () { app.init(scene); });
  },
  
  init: function () {
    // [OVERRIDE]
    this.ticks = 0;
  },

  update: function () {
    // [OVERRIDE]
    this.ticks++;
  },

  render: function (ctx, bx, by) {
    // [OVERRIDE]
  },

  set_dir: function (vx, vy) {
    // [OVERRIDE]
  },

  set_action: function (action) {
    // [OVERRIDE]
  },

  keydown: function (key) {
    // [OVERRIDE]
  },

  keyup: function (key) {
    // [OVERRIDE]
  },

  mousedown: function (x, y, button) {
    // [OVERRIDE]
  },

  mouseup: function (x, y, button) {
    // [OVERRIDE]
  },

  mousemove: function (x, y) {
    // [OVERRIDE]
  },

});


//  TextScene
//
function TextScene(app, text)
{
  this._Scene(app);
  this.text = text;
}

define(TextScene, Scene, 'Scene', {
  init: function () {
    this._Scene_init();
    var scene = this;
    var frame = this.app.frame;
    var e = this.app.addElement(
      new Rectangle(frame.width/8, frame.height/4,
		  3*frame.width/4, frame.height/2));
    e.align = 'left';
    e.style.padding = '10px';
    e.style.color = 'black';
    e.style.background = 'white';
    e.style.border = 'solid black 2px';
    e.innerHTML = this.text;
    e.onmousedown = (function (e) { scene.change(); });
  },

  change: function () {
    // [OVERRIDE]
  },

  mousedown: function (x, y, button) {
    this.change();
  },

  keydown: function (key) {
    this.change();
  },
  
});


//  GameScene
// 
function GameScene(app)
{
  this._Scene(app);
}

define(GameScene, Scene, 'Scene', {
  init: function () {
    // [OVERRIDE]
    this._Scene_init();
    this.tasks = [];
    this.sprites = [];
    this.colliders = [];
  },

  update: function () {
    // [OVERRIDE]
    this._Scene_update();
    this.updateObjects(this.tasks);
    this.collideObjects(this.colliders);
    this.cleanObjects(this.tasks);
    this.cleanObjects(this.sprites);
    this.cleanObjects(this.colliders);
  },

  render: function (ctx, bx, by) {
    // [OVERRIDE]
    this._Scene_render(ctx, bx, by);

    // Draw the sprites.
    for (var i = 0; i < this.sprites.length; i++) {
      var obj = this.sprites[i];
      if (obj.scene !== this) continue;
      if (obj.visible) {
	obj.render(ctx, bx, by);
      }
    }
  },

  addObject: function (obj) {
    if (obj.update !== undefined) {
      if (obj.scene === null) {
	obj.start(this);
      }
      this.tasks.push(obj);
    }
    if (obj.render !== undefined) {
      this.sprites.push(obj);
      this.sprites.sort(function (a,b) { return a.zorder-b.zorder; });
    }
    if (obj.hitbox !== undefined) {
      this.colliders.push(obj);
    }
  },

  removeObject: function (obj) {
    if (obj.update !== undefined) {
      removeArray(this.tasks, obj);
    }
    if (obj.render !== undefined) {
      removeArray(this.sprites, obj);
    }
    if (obj.hitbox !== undefined) {
      removeArray(this.colliders, obj);
    }
  },

  updateObjects: function (objs) {
    for (var i = 0; i < objs.length; i++) {
      var obj = objs[i];
      if (obj.scene !== this) continue;
      obj.update();
    }
  },

  collideObjects: function (objs) {
    for (var i = 0; i < objs.length; i++) {
      var obj0 = objs[i];
      if (obj0.scene === this && obj0.hitbox !== null) {
	for (var j = i+1; j < objs.length; j++) {
	  var obj1 = objs[j];
	  if (obj1.scene === this && obj1.hitbox !== null &&
	      obj1 !== obj0 && obj1.hitbox.overlap(obj0.hitbox)) {
	    obj0.collide(obj1);
	    obj1.collide(obj0);
	  }
	}
      }
    }
  },
    
  cleanObjects: function (objs) {
    function f(obj) { return obj.scene === null; }
    removeArray(objs, f);
  },

  findObjects: function (rect, f) {
    var a = [];
    for (var i = 0; i < this.colliders.length; i++) {
      var obj1 = this.colliders[i];
      if (obj1.scene === this && obj1.hitbox !== null &&
	  f(obj1) && obj1.hitbox.overlap(rect)) {
	a.push(obj1);
      }
    }
    return a;
  },

});
