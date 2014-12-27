// actor.js

// Actor
function Actor(rect)
{
  this.bounds = rect;
  this.hitbox = rect;
  this.alive = true;
}

Actor.prototype.repaint = function(ctx, x, y)
{
};

Actor.prototype.idle = function(ticks)
{
};

// Collectible
function Collectible(scene, rect)
{
  this.scene = scene;
  this.bounds = rect;
  this.hitbox = rect.inset(16, 16);
  this.alive = true;
}

Collectible.prototype.repaint = function(ctx, x, y)
{
  var ts = this.scene.tilesize;
  ctx.drawImage(this.scene.game.images.sprites,
		Sprite.COLLECTIBLE*ts, 0, ts, ts,
		x, y, this.bounds.width, this.bounds.height);
};

Collectible.prototype.idle = Actor.prototype.idle;

// Player
function Player(scene, rect)
{
  this.speed = 8;
  this.gravity = 2;
  this.maxspeed = 16;
  this.jumpacc = -16;
  
  this.scene = scene;
  this.bounds = rect;
  this.hitbox = rect.inset(4, 4);
  this.alive = true;
  this._gy = 0;
}

Player.prototype.repaint = function (ctx, x, y)
{
  var ts = this.scene.tilesize;
  ctx.drawImage(this.scene.game.images.sprites,
		Sprite.PLAYER*ts, 0, ts, ts,
		x, y, this.bounds.width, this.bounds.height);
};

Player.prototype.idle = function (ticks)
{
};

Player.prototype.move = function (vx, vy)
{
  var tilemap = this.scene.tilemap;
  var v = new Point(this.speed * vx, this._gy);
  var f = (function (x,y) { return Tile.isObstacle(tilemap.get(x,y)); });
  var d = tilemap.collide(this.hitbox, new Point(v.x, v.y), f);
  d.x = tilemap.collide(this.hitbox, new Point(v.x, d.y), f).x;
  d.y = tilemap.collide(this.hitbox, new Point(d.x, v.y), f).y;
  this.bounds = this.bounds.move(d.x, d.y);
  this.hitbox = this.hitbox.move(d.x, d.y);
  this._gy = Math.min(d.y + this.gravity, this.maxspeed);
}

Player.prototype.pick = function ()
{
  var picked = 0;
  var r = this.scene.collide(this);
  for (var i = 0; i < r.length; i++) {
    var a = r[i];
    if (a instanceof Collectible) {
      a.alive = false;
      picked++;
    }
  }
  return picked;
};

Player.prototype.jump = function ()
{
  var tilemap = this.scene.tilemap;
  var f = (function (x,y) { return Tile.isObstacle(tilemap.get(x,y)); });
  var d = tilemap.collide(this.hitbox, new Point(0, this._gy), f);
  if (0 < this._gy && d.y == 0) {
    this._gy = this.jumpacc;
    return true;
  }
  return false;
};
