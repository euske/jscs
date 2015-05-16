// player.js

// GAME SPECIFIC CODE

// Player
function Player(bounds)
{
  this.scene = null;
  this.alive = true;
  
  this.speed = 8;
  this.gravity = 2;
  this.maxspeed = 16;
  this.jumpacc = -16;
  
  this.bounds = bounds;
  this.hitbox = bounds.inset(4, 4);
  this.picked = new Slot(this);
  this.jumped = new Slot(this);

  this._gy = 0;
}

Player.prototype.start = Actor.prototype.start;

Player.prototype.idle = function ()
{
  if (this.scene == null) return;
  var r = this.scene.collide(this);
  for (var i = 0; i < r.length; i++) {
    var a = r[i];
    if (a instanceof StaticActor) {
      this.pick(a);
    }
  }
};

Player.prototype.repaint = function (ctx, x, y)
{
  if (this.scene == null) return;
  var ts = this.scene.tilesize;
  ctx.drawImage(this.scene.game.images.sprites,
		Sprite.PLAYER*ts, 0, ts, ts,
		x, y, this.bounds.width, this.bounds.height);
};

Player.prototype.move = function (vx, vy)
{
  if (this.scene == null) return;
  var tilemap = this.scene.tilemap;
  var v = new Point(this.speed * vx, this._gy);
  var f = (function (x,y) { return Tile.isObstacle(tilemap.get(x,y)); });
  var d = tilemap.collide(this.hitbox, new Point(v.x, v.y), f);
  d.x = tilemap.collide(this.hitbox, new Point(v.x, d.y), f).x;
  d.y = tilemap.collide(this.hitbox, new Point(d.x, v.y), f).y;
  this.bounds = this.bounds.move(d.x, d.y);
  this.hitbox = this.hitbox.move(d.x, d.y);
  this._gy = Math.min(d.y + this.gravity, this.maxspeed);
};

Player.prototype.jump = function ()
{
  if (this.scene == null) return;
  var tilemap = this.scene.tilemap;
  var f = (function (x,y) { return Tile.isObstacle(tilemap.get(x,y)); });
  var d = tilemap.collide(this.hitbox, new Point(0, this._gy), f);
  if (0 < this._gy && d.y == 0) {
    this._gy = this.jumpacc;
    this.jumped.signal();
  }
};

Player.prototype.pick = function (a)
{
  // pick it.
  a.alive = false;
  this.picked.signal();
  
  // show a particle.
  var particle = new Particle(a.bounds, Sprite.YAY, this.scene.game.framerate);
  this.scene.addParticle(particle);
  
  // show a balloon.
  var frame = this.scene.game.frame;
  var text = "Got a thingy!";
  var e = this.scene.game.addElement(new Rectangle(20, 20, frame.width-60, 60))
  e.align = "left";
  e.style.padding = "10px";
  e.style.color = "black";
  e.style.background = "white";
  e.style.border = "solid black 2px";
  var i = 0;
  function balloon(task) {
    if ((task.scene.ticks % 2) == 0) {
      if (i < text.length) {
	i++;
	e.innerHTML = text.substring(0, i);
      } else {
	task.scene.game.removeElement(e);
	task.alive = false;
      }
    }
  }
  this.scene.addTask(new Task(balloon));
};
