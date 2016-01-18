// actor.js
//   requires: utils.js
//   requires: geom.js
'use strict';

// Task: a single procedure that runs at each frame.
function Task()
{
  this.layer = null;
  this.duration = 0;
  this.died = new Slot(this);
}

define(Task, Object, '', {
  start: function (layer) {
    this.layer = layer;
    this.ticks0 = layer.ticks;
  },

  isAlive: function () {
    return (this.layer !== null);
  },
  
  getTime: function () {
    return (this.layer.ticks - this.ticks0);
  },
  
  die: function () {
    this.layer = null;
    this.died.signal();
  },
  
  update: function () {
    // [OVERRIDE]
    if (0 < this.duration &&
	this.ticks0+this.duration < this.layer.ticks) {
      this.die();
    }
  },
  
});


// Queue: a list of Tasks that runs sequentially.
function Queue(tasks)
{
  this._Task();
  this.tasks = tasks;
}

define(Queue, Task, 'Task', {
  update: function () {
    while (0 < this.tasks.length) {
      var task = this.tasks[0];
      if (task.layer === null) {
	task.start(this.layer);
      }
      task.update();
      if (task.layer !== null) return;
      this.tasks.shift();
    }
    this.die();
  },
  
  add: function (task) {
    this.tasks.push(task);
  },
  
  remove: function (task) {
    removeArray(this.tasks, task);
  },
  
});


// Camera: a camera object.
function Camera(window)
{
  this._Task();
  this.window = window;
}

define(Camera, Task, 'Task', {
  toString: function () {
    return '<Camera: '+this.window+'>';
  },
  
  move: function (dx, dy) {
    this.window = this.window.move(dx, dy);
  },

  movev: function (v) {
    this.window = this.window.movev(v);
  },
  
  renderTilesFromBottomLeft: function (ctx, bx, by, tilemap, tiles, ft) {
    var window = this.window;
    var ts = tilemap.tilesize;
    var x0 = Math.floor(window.x/ts);
    var y0 = Math.floor(window.y/ts);
    var x1 = Math.ceil((window.x+window.width)/ts);
    var y1 = Math.ceil((window.y+window.height)/ts);
    var fx = x0*ts-window.x;
    var fy = y0*ts-window.y;
    tilemap.renderFromBottomLeft(
      ctx, tiles, ft, 
      bx+fx, by+fy, x0, y0, x1-x0+1, y1-y0+1);
  },

  renderTilesFromTopRight: function (ctx, bx, by, tilemap, tiles, ft) {
    var window = this.window;
    var ts = tilemap.tilesize;
    var x0 = Math.floor(window.x/ts);
    var y0 = Math.floor(window.y/ts);
    var x1 = Math.ceil((window.x+window.width)/ts);
    var y1 = Math.ceil((window.y+window.height)/ts);
    var fx = x0*ts-window.x;
    var fy = y0*ts-window.y;
    tilemap.renderFromTopRight(
      ctx, tiles, ft, 
      bx+fx, by+fy, x0, y0, x1-x0+1, y1-y0+1);
  },
  
  setCenter: function (world, rect) {
    if (this.window.width < rect.width) {
      this.window.x = (rect.width-this.window.width)/2;
    } else if (rect.x < this.window.x) {
      this.window.x = rect.x;
    } else if (this.window.x+this.window.width < rect.x+rect.width) {
      this.window.x = rect.x+rect.width - this.window.width;
    }
    if (this.window.height < rect.height) {
      this.window.y = (rect.height-this.window.height)/2;
    } else if (rect.y < this.window.y) {
      this.window.y = rect.y;
    } else if (this.window.y+this.window.height < rect.y+rect.height) {
      this.window.y = rect.y+rect.height - this.window.height;
    }
    this.window.x = clamp(0, this.window.x, world.width-this.window.width);
    this.window.y = clamp(0, this.window.y, world.height-this.window.height);
  },

});


// Sprite: a moving object that doesn't interact.
function Sprite(bounds)
{
  this._Task();
  this.visible = true;
  this.zorder = 0;
  this.bounds = (bounds === null)? bounds : bounds.copy();
}

define(Sprite, Task, 'Task', {
  toString: function () {
    return '<Sprite: '+this.bounds+'>';
  },
  
  move: function (dx, dy) {
    // [OVERRIDE]
    this.bounds = this.bounds.move(dx, dy);
  },

  movev: function (v) {
    // [OVERRIDE]
    this.bounds = this.bounds.movev(v);
  },
  
  update: function () {
    // [OVERRIDE]
    this._Task_update();
  },
  
  render: function (ctx, bx, by) {
    // [OVERRIDE]
  },
  
});


//  Layer
// 
function Layer(app)
{
  this.app = app;
  this.init();
}

define(Layer, Object, '', {
  init: function () {
    this.ticks = 0;
    this.tasks = [];
    this.sprites = [];
    this.colliders = [];
  },
  
  update: function () {
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

  addObject: function (obj) {
    if (obj.update !== undefined) {
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
      if (obj.layer === this) {
	obj.update();
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


// Actor: a character that can interact with other characters.
function Actor(bounds, hitbox, tileno)
{
  this._Sprite(bounds);
  this.hitbox = (hitbox === null)? null : hitbox.copy();
  this.tileno = tileno;
  this.scale = new Vec2(1, 1);
  this.phase = 0;
}

define(Actor, Sprite, 'Sprite', {
  toString: function () {
    return '<Actor: '+this.hitbox+'>';
  },

  collide: function (actor) {
    // [OVERRIDE]
  },

  render: function (ctx, bx, by) {
    // [OVERRIDE]
    var app = this.layer.app;
    var w = this.bounds.width;
    var h = this.bounds.height;
    if (typeof(this.tileno) === 'string') {
      ctx.fillStyle = this.tileno;
      ctx.fillRect(bx+this.bounds.x, by+this.bounds.y, w, h);
    } else {
      var size = app.sprites_size;
      drawImageScaled(ctx, app.sprites,
		      size.x*this.tileno, size.y*(this.phase+1)-h, w, h,
		      bx+this.bounds.x, by+this.bounds.y,
		      w*this.scale.x, h*this.scale.y);
    }
  },
  
  move: function (dx, dy) {
    this._Sprite_move(dx, dy);
    if (this.hitbox !== null) {
      this.hitbox = this.hitbox.move(dx, dy);
    }
  },

  movev: function (v) {
    this._Sprite_movev(v);
    if (this.hitbox !== null) {
      this.hitbox = this.hitbox.movev(v);
    }
  },
  
  getMove: function (v) {
    var hitbox = this.hitbox;
    var range = hitbox.union(hitbox.movev(v));
    var d0 = this.getContactFor(range, hitbox, v);
    v = v.sub(d0);
    hitbox = hitbox.move(d0.x, d0.y);
    if (v.x != 0) {
      var d1 = this.getContactFor(range, hitbox, new Vec2(v.x, 0));
      v = v.sub(d1);
      hitbox = hitbox.move(d1.x, d1.y);
    }
    if (v.y != 0) {
      var d2 = this.getContactFor(range, hitbox, new Vec2(0, v.y));
      v = v.sub(d2);
      hitbox = hitbox.move(d2.x, d2.y);
    }
    return hitbox.diff(this.hitbox);
  },
  
  getContactFor: function (range, hitbox, v) {
    // [OVERRIDE]
    return v;
  },

});


// JumpingActor
function JumpingActor(bounds, hitbox, tileno)
{
  this._Actor(bounds, hitbox, tileno);
  this.speed = 8;
  this.jumpfunc = (function (vy, t) { return (t <= 4)? vy-6 : vy; });
  this.fallfunc = (function (vy) { return clamp(-16, vy+2, +16); });
  this.velocity = new Vec2(0, 0);
  this._jumpt = Infinity;
  this._jumpend = 0;
}

define(JumpingActor, Actor, 'Actor', {
  update: function () {
    var v = this.velocity.copy();
    if (this._jumpt < this._jumpend) {
      v.y = this.jumpfunc(v.y, this._jumpt);
      this._jumpt++;
    }
    v.y = this.fallfunc(v.y);
    this.velocity = this.getMove(v);
    this.movev(this.velocity);
  },

  setJump: function (jumpend) {
    if (0 < jumpend) {
      if (this.isLanded()) {
	this._jumpt = 0;
      }
    }
    this._jumpend = jumpend;
  },

  isMovable: function (v0) {
    var v1 = this.getMove(v0);
    return v1.equals(v0);
  },

  isLanded: function () {
    return (0 <= this.velocity.y && !this.isMovable(new Vec2(0,1)));
  },

  // getEstimatedHitbox: returns the estimated landing position.
  getEstimatedHitbox: function (tilemap, maxtime) {
    if (this.isLanded()) {
      return this.hitbox;
    }
    maxtime = (maxtime !== undefined)? maxtime : 15;
    var stoppable = tilemap.getRangeMap(T.isStoppable);
    var hitbox = this.hitbox;
    var dy = this.velocity.y;
    for (var t = 0; t < maxtime; t++) {
      var rect = hitbox.move(this.velocity.x, dy);
      dy = this.fallfunc(dy);
      var b = tilemap.coord2map(rect);
      if (stoppable.exists(b)) return hitbox;
      hitbox = rect;
    }
    return null;
  },

});
