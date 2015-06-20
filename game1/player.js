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
  var hitbox = bounds.inset(4, 4);
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
  var r = this.scene.collide(this);
  for (var i = 0; i < r.length; i++) {
    var a = r[i];
    if (a instanceof Actor && a.tileno == S.COLLECTIBLE) {
      this.pick(a);
    }
  }
};

Player.prototype.move = function (vx, vy)
{
  if (this.scene === null) return;
  var tilemap = this.scene.tilemap;
  var f = (function (x,y) { return T.isObstacle(tilemap.get(x,y)); });
  var v = tilemap.getMove(this.hitbox, new Vec2(vx*this.speed, this._gy), f);
  Actor.prototype.move.call(this, v.x, v.y);
  if (0 <= this._jumpt && this._jumpt < this.maxacctime) {
    this._jumpt++;
  } else {
    this._gy = Math.min(v.y + this.gravity, this.maxspeed);
  }
};

Player.prototype.jump = function (jumping)
{
  if (this.scene === null) return;
  var tilemap = this.scene.tilemap;
  var f = (function (x,y) { return T.isObstacle(tilemap.get(x,y)); });
  if (jumping) {
    var d = tilemap.collide(this.hitbox, new Vec2(0, this._gy), f);
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
