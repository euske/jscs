// player.js

// [GAME SPECIFIC CODE]

// Player
function Player(bounds)
{
  Actor.call(this, bounds, Sprite.PLAYER);
  this.speed = 8;
  this.gravity = 2;
  this.maxspeed = 16;
  this.jumpacc = -8;
  this.maxacctime = 8;
  
  this.hitbox = bounds.inset(4, 4);
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
    if (a instanceof Actor && a.sprite == Sprite.COLLECTIBLE) {
      this.pick(a);
    }
  }
};

Player.prototype.move = function (vx, vy)
{
  if (this.scene === null) return;
  var tilemap = this.scene.tilemap;
  var f = (function (x,y) { return Tile.isObstacle(tilemap.get(x,y)); });
  var v = tilemap.getMove(this.hitbox, new Point(vx*this.speed, this._gy), f);
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
  var f = (function (x,y) { return Tile.isObstacle(tilemap.get(x,y)); });
  if (jumping) {
    var d = tilemap.collide(this.hitbox, new Point(0, this._gy), f);
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
  var particle = new SpriteParticle(a.bounds, this.scene.game.framerate, Sprite.YAY);
  this.scene.addParticle(particle);
};
