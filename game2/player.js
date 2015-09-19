// player.js

// [GAME SPECIFIC CODE]

// FixedSprite
function FixedSprite(bounds, duration, tileno)
{
  Sprite.call(this, bounds);
  this.duration = duration;
  this.tileno = tileno;
}

FixedSprite.prototype = Object.create(Sprite.prototype);

FixedSprite.prototype.update = function ()
{
  Sprite.prototype.update.call(this);
  this.alive = (this.scene.ticks < this.ticks0+this.duration);
  this.bounds.y -= 1;
};

FixedSprite.prototype.render = function (ctx, x, y)
{
  var sprites = this.scene.app.sprites;
  var tw = sprites.height;
  var w = this.bounds.width;
  var h = this.bounds.height;
  ctx.drawImage(sprites,
		this.tileno*tw, tw-h, w, h,
		x+this.bounds.x, y+this.bounds.y, w, h);
};


// Thingy
function Thingy(bounds)
{
  var hitbox = bounds.inflate(-4, -4);
  Actor.call(this, bounds, hitbox, S.THINGY);
}

Thingy.prototype = Object.create(Actor.prototype);

Thingy.prototype.render = function (ctx, x, y)
{
  var sprites = this.scene.app.sprites;
  var tw = sprites.height;
  var w = this.bounds.width;
  var h = this.bounds.height;
  ctx.drawImage(sprites,
		S.SHADOW*tw, tw-h, w, h,
		x+this.bounds.x, y+this.bounds.y, w, h);
  Actor.prototype.render.call(this, ctx, x, y);
};


// Player
function Player(bounds)
{
  var hitbox = bounds.inflate(-4, -4);
  Actor.call(this, bounds, hitbox, S.PLAYER);
  this.speed = 8;
  this.gravity = -2;
  this.maxspeed = -16;
  this.jumpacc = 8;
  this.maxacctime = 8;
  
  this.picked = new Slot(this);
  this.jumped = new Slot(this);

  this.z = 0;
  this._gz = 0;
  this._jumpt = -1;
}

Player.prototype = Object.create(Actor.prototype);

Player.prototype.toString = function ()
{
  return '<Player: '+this.bounds+'>';
};

Player.prototype.collide = function (actor)
{
  if (actor instanceof Actor && actor.tileno == S.THINGY) {
    this.pick(actor);
  }
};

Player.prototype.update = function ()
{
  if (this.scene === null) return;
  if (0 <= this._jumpt && this._jumpt < this.maxacctime) {
    this._jumpt++;
  } else {
    this._gz = Math.max(this._gz + this.gravity, this.maxspeed);
  }
};

Player.prototype.render = function (ctx, x, y, front)
{
  var sprites = this.scene.app.sprites;
  var tw = sprites.height;
  var w = this.bounds.width;
  var h = this.bounds.height;
  var afloat = (this.scene.tilesize <= this.z);
  var shadow = true;
  var tilemap = this.scene.tilemap;
  var r = tilemap.coord2map(this.hitbox);
  function isfloor(x, y) {
    return (tilemap.get(x, y) == T.FLOOR);
  }
  x += this.bounds.x;
  y += this.bounds.y;
  if (front) {
    if (afloat) {
      if (tilemap.apply(r, isfloor) !== null) {
	ctx.drawImage(sprites,
		      S.SHADOW*tw, tw-h, w, h,
		      x, y-h/2, w, h);
      }
    }
  } else if (!afloat) {
    var d = this.z/4;
    ctx.drawImage(sprites,
		  S.SHADOW*tw, tw-h, w, h,
		  x+d, y+d, w-d*2, h-d*2);
  }
  if ((front && afloat) || (!front && !afloat)) {
    ctx.drawImage(sprites,
		  this.tileno*tw, tw-h, w, h,
		  x, y-this.z/2, w, h);
  }
};

Player.prototype.move = function (vx, vy)
{
  if (this.scene === null) return null;
  var v = this.getMove(new Vec3(vx, vy, this._gz));
  Actor.prototype.move.call(this, v.x, v.y);
  return v;
};

Player.prototype.usermove = function (vx, vy)
{
  var v = this.move(vx*this.speed, vy*this.speed);
  if (v !== null) {
    this.z += v.z;
    this._gz = v.z;
  }
};

Player.prototype.contactTile = function (p, v0)
{
  var tilemap = this.scene.tilemap;
  var ts = tilemap.tilesize;
  var bs = new Vec3(ts, ts, ts);
  var ws = new Vec3(ts, ts, 999);
  var box = new Box(p, new Vec3(this.hitbox.width, this.hitbox.height, ts));
  function f(x, y, v) {
    var c = tilemap.get(x, y);
    if (T.isWall(c)) {
      var bounds = new Box(new Vec3(x*ts, y*ts, 0), ws);
      v = box.contact(v, bounds);
    } else if (T.isObstacle(c)) {
      var bounds = new Box(new Vec3(x*ts, y*ts, 0), bs);
      v = box.contact(v, bounds);
    }
    return v;
  }
  var r = box.movev(v0).union(box);
  r = new Rectangle(r.origin.x, r.origin.y, r.size.x, r.size.y);
  v0 = tilemap.reduce(tilemap.coord2map(r), f, v0);
  v0 = box.contactXYPlane(v0, 0, null);
  return v0;
};

Player.prototype.getMove = function (v)
{
  var p = new Vec3(this.hitbox.x, this.hitbox.y, this.z);
  var d0 = this.contactTile(p, v);
  p = p.add(d0);
  v = v.sub(d0);
  var d1 = this.contactTile(p, new Vec3(v.x,0,0));
  p = p.add(d1);
  v = v.sub(d1);
  var d2 = this.contactTile(p, new Vec3(0,v.y,0));
  p = p.add(d2);
  v = v.sub(d2);
  var d3 = this.contactTile(p, new Vec3(0,0,v.z));
  return new Vec3(d0.x+d1.x+d2.x+d3.x,
		  d0.y+d1.y+d2.y+d3.y, 
		  d0.z+d1.z+d2.z+d3.z);
};

Player.prototype.jump = function (jumping)
{
  if (this.scene === null) return;
  if (jumping) {
    var p = new Vec3(this.hitbox.x, this.hitbox.y, this.z);
    var v = new Vec3(0, 0, this._gz);
    var d = this.contactTile(p, v);
    if (this._gz < 0 && d.z === 0) {
      this._gz = this.jumpacc;
      this._jumpt = 0;
      this.jumped.signal();
    }
  } else {
    this._jumpt = -1;
  }
};

Player.prototype.pick = function (a)
{
  a.alive = false;
  this.picked.signal();
  // show a particle.
  var particle = new FixedSprite(a.bounds, this.scene.app.framerate, S.YAY);
  this.scene.addObject(particle);
};
