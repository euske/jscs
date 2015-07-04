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
  var sprites = this.scene.game.sprites;
  var tw = sprites.height;
  var w = this.bounds.width;
  var h = this.bounds.height;
  ctx.drawImage(sprites,
		this.tileno*tw, tw-h, w, h,
		x, y, w, h);
};


// Player
function Player(bounds)
{
  var hitbox = bounds.inflate(-4, -4);
  Actor.call(this, bounds, hitbox, S.PLAYER);
  this.speed = 8;
  this.gravity = 2;
  this.maxspeed = 16;
  this.jumpacc = -8;
  this.maxacctime = 8;
  
  this.picked = new Slot(this);
  this.jumped = new Slot(this);

  this._gy = 0;
  this._jumpt = -1;
}

Player.prototype = Object.create(Actor.prototype);

Player.prototype.toString = function ()
{
  return '<Player: '+this.bounds+'>';
}

Player.prototype.update = function ()
{
  if (this.scene === null) return;
  var r = this.scene.collide(this);
  for (var i = 0; i < r.length; i++) {
    var a = r[i];
    if (a instanceof Actor && a.tileno == S.THINGY) {
      this.pick(a);
    }
  }
  if (0 <= this._jumpt && this._jumpt < this.maxacctime) {
    this._jumpt++;
  } else {
    this._gy = Math.min(this._gy + this.gravity, this.maxspeed);
  }
};

Player.prototype.move = function (vx, vy)
{
  if (this.scene === null) return null;
  var tilemap = this.scene.tilemap;
  var v = this.getMove(new Vec2(vx, vy));
  Actor.prototype.move.call(this, v.x, v.y);
  return v;
};

Player.prototype.usermove = function (vx, vy)
{
  var v = this.move(vx*this.speed, this._gy);
  if (v !== null) {
    this._gy = v.y;
  }
}

Player.prototype.jump = function (jumping)
{
  if (this.scene === null) return;
  var tilemap = this.scene.tilemap;
  var f = (function (x,y) { return T.isObstacle(tilemap.get(x,y)); });
  if (jumping) {
    var v = new Vec2(0, this._gy);
    var d = this.collideTile(this.hitbox, v);
    if (0 < this._gy && d.y == 0) {
      this._gy = this.jumpacc;
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
  var particle = new FixedSprite(a.bounds, this.scene.game.framerate, S.YAY);
  this.scene.addObject(particle);
};

Player.prototype.getMove = function (v)
{
  var rect = this.hitbox;
  var d0 = this.collideTile(rect, v);
  rect = rect.move(d0.x, d0.y);
  v = v.sub(d0);
  var d1 = this.collideTile(rect, new Vec2(v.x, 0));
  rect = rect.move(d1.x, d1.y);
  v = v.sub(d1);
  var d2 = this.collideTile(rect, new Vec2(0, v.y));
  return new Vec2(d0.x+d1.x+d2.x,
		  d0.y+d1.y+d2.y);
};

Player.prototype.collideTile = function (rect, v0)
{
  var tilemap = this.scene.tilemap;
  var ts = tilemap.tilesize;
  function f(x, y, v) {
    if (T.isObstacle(tilemap.get(x, y))) {
      var bounds = new Rectangle(x*ts, y*ts, ts, ts);
      v = rect.collide(v, bounds);
    }
    return v;
  }
  var r = rect.move(v0.x, v0.y).union(rect);
  return tilemap.reduce(tilemap.coord2map(r), f, v0);
};
