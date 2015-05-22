// player.js

// [GAME SPECIFIC CODE]

// Player
function Player(bounds)
{
  this.init();
  this.sprite = Sprite.PLAYER;
  
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

Player.prototype.toString = function ()
{
  return "<Player: "+this.bounds+">";
}

Player.prototype.init = Actor.prototype.init;

Player.prototype.start = Actor.prototype.start;

Player.prototype.idle = function ()
{
  if (this.scene == null) return;
  var r = this.scene.collide(this);
  for (var i = 0; i < r.length; i++) {
    var a = r[i];
    if (a instanceof Actor && a.sprite == Sprite.COLLECTIBLE) {
      this.pick(a);
    }
  }
};

Player.prototype.render = Actor.prototype.render;

Player.prototype.move = function (vx, vy)
{
  if (this.scene == null) return;
  var tilemap = this.scene.tilemap;
  var f = (function (x,y) { return Tile.isObstacle(tilemap.get(x,y)); });
  vx *= this.speed;
  vy = this._gy;
  var d1 = tilemap.collide(this.hitbox, new Point(vx, vy), f);
  this.hitbox = this.hitbox.move(d1.x, d1.y);
  vx -= d1.x;
  vy -= d1.y;
  var d2 = tilemap.collide(this.hitbox, new Point(vx, 0), f);
  this.hitbox = this.hitbox.move(d2.x, d2.y);
  vx -= d2.x;
  vy -= d2.y;
  var d3 = tilemap.collide(this.hitbox, new Point(0, vy), f);
  this.hitbox = this.hitbox.move(d3.x, d3.y);
  var d = new Point(d1.x+d2.x+d3.x, d1.y+d2.y+d3.y);
  this.bounds = this.bounds.move(d.x, d.y);
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
