// player.js

// [APP SPECIFIC CODE]

// FixedSprite
function FixedSprite(bounds, duration, tileno)
{
  this._Sprite(bounds);
  this.duration = duration;
  this.tileno = tileno;
}

define(FixedSprite, Sprite, 'Sprite', {
  update: function () {
    this._Sprite_update(this);
    this.bounds.y -= 1;
  },

  render: function (ctx, bx, by) {
    var sprites = this.scene.app.sprites;
    var tw = sprites.height;
    var w = this.bounds.width;
    var h = this.bounds.height;
    ctx.drawImage(sprites,
		  this.tileno*tw, tw-h, w, h,
		  bx+this.bounds.x, by+this.bounds.y, w, h);
  },

});

// Actor2
function Actor2(bounds, tileno)
{
  var hitbox = bounds.inflate(-2, -2);
  this._Actor(bounds, hitbox, tileno);
  this.tilebounds = new Rectangle(0, 0, 1, 1);
  this.speed = 8;
  this.jumpfunc = (function (t) { return (t < 8)? -8 : 0; });
  this.fallfunc = (function (vy) { return clamp(-16, vy+2, +16); });
  this.velocity = new Vec2(0, 0);
  this.landed = false;
  this._jumpt = -1;
}

define(Actor2, Actor, 'Actor', {
  update: function () {
    var v = this.velocity.copy();
    if (0 <= this._jumpt) {
      v.y += this.jumpfunc(this._jumpt);
      this._jumpt++;
    }
    v.y = this.fallfunc(v.y);
    this.velocity = this.getMove(v);
    this.landed = (0 < v.y && this.velocity.y < v.y);
    this.movev(this.velocity);
  },

  getMove: function (v) {
    var hitbox = this.hitbox;
    var tilemap = this.scene.tilemap;
    var d0 = tilemap.contactTile(hitbox, T.isObstacle, v);
    hitbox = hitbox.move(d0.x, d0.y);
    v = v.sub(d0);
    var d1 = tilemap.contactTile(hitbox, T.isObstacle, new Vec2(v.x, 0));
    hitbox = hitbox.move(d1.x, d1.y);
    v = v.sub(d1);
    var d2 = tilemap.contactTile(hitbox, T.isObstacle, new Vec2(0, v.y));
    return new Vec2(d0.x+d1.x+d2.x,
		    d0.y+d1.y+d2.y);
  },

  isMovable: function (v0) {
    var v1 = this.getMove(v0);
    return v1.equals(v0);
  },

  isLanded: function () {
    return this.landed;
  },

  isHolding: function () {
    var tilemap = this.scene.tilemap;
    var f = (function (x,y,c) { return T.isGrabbable(c); });
    return (tilemap.apply(f, tilemap.coord2map(this.hitbox)) !== null);
  },

  getPos: function () {
    return this.hitbox.center();
  },

  getTilePos: function () {
    var r = this.scene.tilemap.coord2map(this.hitbox.center());
    return new Vec2(r.x, r.y);
  },

  setJumping: function (jumping) {
    if (jumping && this.landed) {
      this._jumpt = 0;
    } else {
      this._jumpt = -1;
    }
  },

});

// Player
function Player(bounds)
{
  this._Actor2(bounds, S.PLAYER);
  
  this.picked = new Slot(this);
  this.jumped = new Slot(this);
}

define(Player, Actor2, 'Actor2', {
  toString: function () {
    return '<Player: '+this.bounds+'>';
  },

  collide: function (actor) {
    if (actor instanceof Actor && actor.tileno == S.THINGY) {
      this.pick(actor);
    }
  },

  usermove: function (vx, vy) {
    this.velocity.x = vx*this.speed;
  },

  jump: function (jumping) {
    if (jumping) {
      if (this.isLanded()) {
	this.setJumping(true);
	this.jumped.signal();
      }
    } else {
      this.setJumping(false);
    }
  },

  pick: function (a) {
    a.die();
    this.picked.signal();
    // show a particle.
    var particle = new FixedSprite(a.bounds, this.scene.app.framerate, S.YAY);
    this.scene.addObject(particle);
  },

});

// Enemy
function Enemy(bounds)
{
  this._Actor2(bounds, S.ENEMY);
  this.target = null;
  this.runner = null;
  this._jumptime = 0;
}

define(Enemy, Actor2, 'Actor2', {
  toString: function () {
    return '<Enemy: '+this.bounds+'>';
  },

  jump: function (t) {
    this._jumptime = t;
    this.setJumping(true);
  },

  moveToward: function (p) {
    var dx = (p.x - this.getPos().x);
    this.velocity.x = ((0 < dx) ? +1 : -1) * this.speed;
  },

  update: function () {
    if (0 < this._jumptime) {
      this._jumptime--;
      if (this._jumptime === 0) {
	this.setJumping(false);
      }
    }
    this._Actor2_update();

    if (this.target === null) return;

    const DT = 10;
    const R = 10;
    var target = this.target;
    var scene = this.scene;
    var tilemap = scene.tilemap;
    var hitbox = ((target.isLanded())? 
		  target.hitbox :
		  predictLandingPoint(tilemap, target.hitbox, 
				      target.velocity, target.fallfunc, DT));
    if (hitbox === null) return;
    var goal = target.getTilePos();
    
    // adjust the goal position when it cannot fit.
    var tilebounds = this.tilebounds;
    var obstacle = tilemap.getRangeMap(T.isObstacle);
    for (var dx = 0; dx <= tilebounds.width; dx++) {
      if (obstacle.get(goal.x-dx+tilebounds.x, goal.y+tilebounds.y,
		       goal.x-dx+tilebounds.right(), goal.y+tilebounds.bottom()) === 0) {
	goal.x -= dx;
	break;
      }
    }
    
    // make a plan.
    if (this.runner === null) {
      var range = new Rectangle(goal.x-R, goal.y-R, R*2+1, R*2+1);
      var plan = new PlanMap(tilemap);
      plan.tilebounds = tilebounds;
      plan.setJumpRange(this.speed, this.jumpfunc, this.fallfunc, DT);
      plan.initPlan(goal);
      if (plan.fillPlan(range, this.getTilePos())) {
	// start following a plan.
	var actor = this;
	this.runner = new PlanActionRunner(plan, this);
	this.runner.timeout = scene.app.framerate*2;
	this.runner.moveto = function (p) { actor.moveToward(p); }
	this.runner.jump = function (t) { actor.jump(10); }
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
  },
  
  renderPlan: function (ctx, bx, by) {
    if (this.runner !== null) {
      this.runner.plan.render(ctx, bx, by, this.scene.tilesize);
    }
  },

});
