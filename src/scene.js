// scene.js
// Scene object takes care of every in-game object and the scrollable map.
//   requires: utils.js
//   requires: geom.js
//   requires: actor.js
'use strict';

function Scene(app)
{
  this.app = app;
  this.screen = new Rectangle(0, 0, app.screen.width, app.screen.height);
}

define(Scene, Object, '', {
  changeScene: function (scene) {
    var app = this.app;
    app.post(function () { app.init(scene); });
  },
  
  init: function () {
    // [OVERRIDE]
  },

  tick: function () {
    // [OVERRIDE]
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
  
  render: function (ctx, bx, by) {
    ctx.fillStyle = 'rgb(0,0,0)';
    ctx.fillRect(bx, by, this.screen.width, this.screen.height);
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


//  Layer
// 
function Layer()
{
  this.init();
}

define(Layer, Object, '', {
  init: function () {
    this.ticks = 0;
    this.tasks = [];
    this.sprites = [];
    this.colliders = [];
  },
  
  tick: function () {
    this.ticks++;
    this.updateObjects(this.tasks);
    this.collideObjects(this.colliders);
    this.cleanObjects(this.tasks);
    this.cleanObjects(this.sprites);
    this.cleanObjects(this.colliders);
  },

  render: function (ctx, bx, by) {
    for (var i = 0; i < this.sprites.length; i++) {
      var obj = this.sprites[i];
      if (obj.layer === this) {
	if (obj.visible) {
	  obj.render(ctx, bx, by);
	}
      }
    }
  },

  scroll: function (v) {
    for (var i = 0; i < this.sprites.length; i++) {
      var obj = this.sprites[i];
      if (obj.layer === null) continue;
      if (obj.bounds === null) continue;
      obj.bounds = obj.bounds.add(v);
    }
    for (var i = 0; i < this.colliders.length; i++) {
      var obj = this.colliders[i];
      if (obj.layer === null) continue;
      if (obj.hitbox === null) continue;
      obj.hitbox = obj.hitbox.add(v);
    }
  },

  addObject: function (obj) {
    if (obj.tick !== undefined) {
      if (obj.layer === null) {
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
    if (obj.tick !== undefined) {
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
      if (obj.layer === this) {
	obj.tick();
      }
    }
  },

  collideObjects: function (objs) {
    for (var i = 0; i < objs.length; i++) {
      var obj0 = objs[i];
      if (obj0.layer === this && obj0.hitbox !== null) {
	for (var j = i+1; j < objs.length; j++) {
	  var obj1 = objs[j];
	  if (obj1.layer === this && obj1.hitbox !== null &&
	      obj1 !== obj0 && obj1.hitbox.overlap(obj0.hitbox)) {
	    obj0.collide(obj1);
	    obj1.collide(obj0);
	    if (obj0.layer === null || obj0.hitbox === null) break;
	  }
	}
      }
    }
  },
    
  cleanObjects: function (objs) {
    function f(obj) { return obj.layer === null; }
    removeArray(objs, f);
  },

  findObjects: function (rect, f) {
    var a = [];
    for (var i = 0; i < this.colliders.length; i++) {
      var obj1 = this.colliders[i];
      if (obj1.layer === this && obj1.hitbox !== null &&
	  (f === undefined || f(obj1)) && obj1.hitbox.overlap(rect)) {
	a.push(obj1);
      }
    }
    return a;
  },

});


//  GameScene
// 
function GameScene(app)
{
  this._Scene(app);
  this.layer = new Layer();
}

define(GameScene, Scene, 'Scene', {
  init: function () {
    // [OVERRIDE]
    this._Scene_init();
    this.layer.init();
    this.sprites = this.layer.sprites;
    this.colliders = this.layer.colliders;
  },

  tick: function () {
    // [OVERRIDE]
    this._Scene_tick();
    this.layer.tick();
  },

  render: function (ctx, bx, by) {
    // [OVERRIDE]
    this._Scene_render(ctx, bx, by);
    this.layer.render(ctx, bx, by);
  },

  addObject: function (obj) {
    this.layer.addObject(obj);
  },
  removeObject: function (obj) {
    this.layer.removeObject(obj);
  },
  findObjects: function (rect, f) {
    return this.layer.findObjects(rect, f);
  },

});
