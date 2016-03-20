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
  
  tick: function () {
    this.update();
    if (0 < this.duration &&
	this.ticks0+this.duration < this.layer.ticks) {
      this.die();
    }
  },
  
  update: function () {
    // [OVERRIDE]
  },
  
});


// Queue: a list of Tasks that runs sequentially.
function Queue(tasks)
{
  this._Task();
  this.tasks = tasks;
}

define(Queue, Task, 'Task', {
  tick: function () {
    while (0 < this.tasks.length) {
      var task = this.tasks[0];
      if (task.layer === null) {
	task.start(this.layer);
      }
      task.tick();
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
  
  move: function (v) {
    this.window = this.window.add(v);
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
function Sprite(bounds, tileno)
{
  this._Task();
  this.visible = true;
  this.zorder = 0;
  this.bounds = (bounds === null)? bounds : bounds.copy();
  this.tileno = tileno;
  this.scale = new Vec2(1, 1);
  this.phase = 0;
}
Sprite.SIZE = null;
Sprite.IMAGE = null;

define(Sprite, Task, 'Task', {
  toString: function () {
    return '<Sprite: '+this.bounds+'>';
  },
  
  move: function (v) {
    // [OVERRIDE]
    this.bounds = this.bounds.add(v);
  },
  
  update: function () {
    // [OVERRIDE]
    this._Task_update();
  },
  
  render: function (ctx, bx, by) {
    // [OVERRIDE]
    var w = this.bounds.width;
    var h = this.bounds.height;
    if (typeof(this.tileno) === 'string') {
      ctx.fillStyle = this.tileno;
      ctx.fillRect(bx+this.bounds.x, by+this.bounds.y, w, h);
    } else {
      var src = this.getSpriteSrc(this.tileno, this.phase);
      drawImageScaled(ctx, Sprite.IMAGE,
		      src.x, src.y, src.width, src.height,
		      bx+this.bounds.x, by+this.bounds.y,
		      w*this.scale.x, h*this.scale.y);
    }
  },
  
  getSpriteSrc: function (tileno, phase) {
    // [OVERRIDE]
    var size = Sprite.SIZE;
    return new Rectangle(size.x*tileno, size.y*phase, size.x, size.y);
  },

});


// TileSprite: displays a tiled image repeatedly.
function TileSprite(bounds, image)
{
  this._Sprite(bounds);
  this.image = image;
  this.offset = new Vec2();
}

define(TileSprite, Sprite, 'Sprite', {
  render: function (ctx, bx, by) {
    bx += this.bounds.x;
    by += this.bounds.y;
    ctx.save();
    ctx.beginPath();
    ctx.rect(bx, by, this.bounds.width, this.bounds.height);
    ctx.clip();
    var w = this.image.width;
    var h = this.image.height;
    var dx0 = int(Math.floor(this.offset.x/w)*w - this.offset.x);
    var dy0 = int(Math.floor(this.offset.y/h)*h - this.offset.y);
    for (var dy = dy0; dy < this.bounds.height; dy += h) {
      for (var dx = dx0; dx < this.bounds.width; dx += w) {
	ctx.drawImage(this.image, bx+dx, by+dy);
      }
    }
    ctx.restore();
  },
  
});


// Actor: a character that can interact with other characters.
function Actor(bounds, hitbox, tileno)
{
  this._Sprite(bounds, tileno);
  this.hitbox = (hitbox === null)? null : hitbox.copy();
  this.maxspeed = new Vec2(16, 16);
  this.movement = new Vec2();
}

define(Actor, Sprite, 'Sprite', {
  toString: function () {
    return '<Actor: '+this.hitbox+'>';
  },

  collide: function (actor) {
    // [OVERRIDE]
  },

  update: function () {
    this._Sprite_update();
    this.move(this.getMove(this.movement, this.hitbox, true));
  },
  
  move: function (v) {
    this._Sprite_move(v);
    if (this.hitbox !== null) {
      this.hitbox = this.hitbox.add(v);
    }
  },
  
  isMovable: function (v0) {
    var v1 = this.getMove(v0, this.hitbox, true);
    return v1.equals(v0);
  },

  getMove: function (v, hitbox, force) {
    if (hitbox === null) return v;
    var range = hitbox.union(hitbox.add(v));
    var d0 = this.getContactFor(v, hitbox, force, range);
    v = v.sub(d0);
    hitbox = hitbox.add(d0);
    if (v.x != 0) {
      var d1 = this.getContactFor(new Vec2(v.x, 0), hitbox, force, range);
      v = v.sub(d1);
      hitbox = hitbox.add(d1);
    }
    if (v.y != 0) {
      var d2 = this.getContactFor(new Vec2(0, v.y), hitbox, force, range);
      v = v.sub(d2);
      hitbox = hitbox.add(d2);
    }
    var bounds = this.getConstraintsFor(hitbox, force);
    if (bounds !== null) {
      hitbox = hitbox.clamp(bounds);
    }
    return hitbox.diff(this.hitbox);
  },
  
  getContactFor: function (v, hitbox, force, range) {
    // [OVERRIDE]
    return v;
  },
  
  getConstraintsFor: function (hitbox, force) {
    // [OVERRIDE]
    return null;
  },

});


// PhysicalActor
function PhysicalActor(bounds, hitbox, tileno)
{
  this._Actor(bounds, hitbox, tileno);
  this.velocity = new Vec2();
  this.jumpfunc = (function (vy, t) { return (0 <= t && t <= 4)? -10 : vy+2; });
  this._jumpt = Infinity;
  this._jumpend = 0;
}

define(PhysicalActor, Actor, 'Actor', {
  setJump: function (jumpend) {
    if (0 < jumpend) {
      if (this.isLanded()) {
	this._jumpt = 0;
      }
    }
    this._jumpend = jumpend;
  },

  update: function () {
    this._Actor_update();
    this.fall();
    if (this._jumpt < this._jumpend) {
      this._jumpt++;
    } else {
      this._jumpt = Infinity;
    }
  },
  
  fall: function () {
    if (!this.isHolding()) {
      this.velocity.y = this.jumpfunc(this.velocity.y, this._jumpt);
      this.velocity = this.getMove(this.velocity, this.hitbox, false);
      this.move(this.velocity);
    }
  },

  isLanded: function () {
    var v = this.getMove(new Vec2(0, 1), this.hitbox, false);
    return (0 <= this.velocity.y && v.y == 0);
  },

  isHolding: function () {
    return false;
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
      dy = this.jumpfunc(dy, Infinity);
      var b = tilemap.coord2map(rect);
      if (stoppable.exists(b)) return hitbox;
      hitbox = rect;
    }
    return null;
  },

});
