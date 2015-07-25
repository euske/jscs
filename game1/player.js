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

FixedSprite.prototype.render = function (ctx, bx, by)
{
  var sprites = this.scene.game.sprites;
  var tw = sprites.height;
  var w = this.bounds.width;
  var h = this.bounds.height;
  ctx.drawImage(sprites,
		this.tileno*tw, tw-h, w, h,
		bx+this.bounds.x, by+this.bounds.y, w, h);
};

// Actor2
function Actor2(bounds, tileno)
{
  var hitbox = bounds.inflate(-4, -4);
  Actor.call(this, bounds, hitbox, tileno);
  this.speed = 8;
  this.gravity = 2;
  this.maxspeed = 16;
  this.jumpacc = -8;
  this.tilebounds = new Rectangle(0, 0, 1, 1);
  this.velocity = new Vec2(0, 0);
  this.landed = false;
}

Actor2.prototype = Object.create(Actor.prototype);

Actor2.prototype.update = function ()
{
  if (this.scene === null) return;
  this.velocity.y += this.gravity;
  this.velocity.y = clamp(-this.maxspeed, this.velocity.y, this.maxspeed);
  var v = this.getMove(this.velocity);
  this.landed = (0 < this.velocity.y && v.y == 0);
  this.velocity = v;
  this.move(this.velocity.x, this.velocity.y);
};

Actor2.prototype.getMove = function (v)
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

Actor2.prototype.getPos = function ()
{
  return this.hitbox.center();
};

Actor2.prototype.getTilePos = function ()
{
  var r = this.scene.tilemap.coord2map(this.hitbox.center());
  return new Vec2(r.x, r.y);
};

Actor2.prototype.isMovable = function (v0)
{
  var v1 = this.getMove(v0);
  return v1.equals(v0);
};

Actor2.prototype.isLanded = function ()
{
  return this.landed;
};

Actor2.prototype.isHolding = function ()
{
  var tilemap = this.scene.tilemap;
  var f = (function (x,y) { return T.isGrabbable(tilemap.get(x,y)); });
  return (tilemap.apply(tilemap.coord2map(this.hitbox), f) !== null);
};

Actor2.prototype.collideTile = function (rect, v0)
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

// Player
function Player(bounds)
{
  Actor2.call(this, bounds, S.PLAYER);
  this.maxacctime = 8;
  
  this.picked = new Slot(this);
  this.jumped = new Slot(this);
  this._jumpt = -1;
}

Player.prototype = Object.create(Actor2.prototype);

Player.prototype.toString = function ()
{
  return '<Player: '+this.bounds+'>';
};

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
    this.velocity.y -= this.gravity;
  }
  
  Actor2.prototype.update.call(this);  
};

Player.prototype.usermove = function (vx, vy)
{
  this.velocity.x = vx*this.speed;
};

Player.prototype.jump = function (jumping)
{
  if (this.scene === null) return;
  if (jumping) {
    if (this.isLanded()) {
      this._jumpt = 0;
      this.velocity.y = this.jumpacc;
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

// Enemy
function Enemy(bounds)
{
  Actor2.call(this, bounds, S.ENEMY);
  this.target = null;
  this.runner = null;
}

Enemy.prototype = Object.create(Actor2.prototype);

Enemy.prototype.toString = function ()
{
  return '<Enemy: '+this.bounds+'>';
};

Enemy.prototype.jump = function ()
{
  if (this.isLanded()) {
    this.velocity.y = this.jumpacc;
  }
};

Enemy.prototype.moveToward = function (p)
{
  var dx = (p.x - this.getPos().x);
  this.velocity.x = ((0 < dx) ? +1 : -1) * this.speed;
};

RANGE = 10;
Enemy.prototype.update = function ()
{
  Actor2.prototype.update.call(this);

  if (this.scene === null) return;
  if (this.target === null) return;

  var scene = this.scene;
  var tilemap = scene.tilemap;
  var hitbox = ((this.target.isLanded())? 
		this.target.hitbox :
		predictLandingPoint(tilemap, this.target.hitbox, 
				    this.target.velocity, this.target.gravity));
  if (hitbox === null) return;
  var goal = this.target.getTilePos();
  
  var actor = this;
  function jump(e) {
    actor.jump();
  }
  function moveto(e, p) {
    actor.moveToward(p);
  }
  
  // adjust the goal position when it cannot fit.
  var tilebounds = this.tilebounds;
  var obstacle = tilemap.getRangeMap(T.isObstacle);
  for (var dx = 0; dx <= tilebounds.width; dx++) {
    if (obstacle.get(goal.x-dx+tilebounds.x, goal.y+tilebounds.y,
		     goal.x-dx+tilebounds.right(), goal.y+tilebounds.bottom()) == 0) {
      goal.x -= dx;
      break;
    }
  }
  
  // make a plan.
  if (this.runner === null) {
    var range = new Rectangle(goal.x-RANGE, goal.y-RANGE, RANGE*2+1, RANGE*2+1);
    var plan = new PlanMap(tilemap, goal, range,
			   tilebounds, this.speed,
			   this.jumpspeed, this.gravity);
    if (plan.fillPlan(this.getTilePos())) {
      // start following a plan.
      this.runner = new PlanActionRunner(plan, this);
      this.runner.jump.subscribe(jump);
      this.runner.moveto.subscribe(moveto);
      log("begin:"+this.runner);
    }
  }

  // follow a plan.
  if (this.runner !== null) {
    // end following a plan.
    if (!this.runner.update(goal)) {
      log("end:  "+this.runner);
      //this.runner.jump.unsubscribe(jump);
      //this.runner.moveto.unsubscribe(moveto);
      this.runner = null;
    }
  }
};

Enemy.prototype.renderPlan = function (ctx, bx, by)
{
  if (this.runner !== null && this.runner.plan !== null) {
    this.runner.plan.render(ctx, bx, by, this.scene.tilesize/2);
  }
};
