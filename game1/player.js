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
  this.jumpfunc = (function (t) { return (t < 4)? -6 : 0; });
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
function Enemy(tilemap, bounds)
{
  this._Actor2(bounds, S.ENEMY);
  this.tilemap = tilemap;
  this.target = null;
  this.runner = null;
  this.plan = new PlanMap(tilemap);
  this.plan.tilebounds = this.tilebounds;
  this.plan.setJumpRange(this.speed, this.jumpfunc, this.fallfunc);
  this._jumpleft = 0;
}

define(Enemy, Actor2, 'Actor2', {
  toString: function () {
    return '<Enemy: '+this.bounds+'>';
  },

  jump: function (t) {
    this._jumpleft = t;
    this.setJumping(true);
  },

  moveToward: function (p) {
    if (p !== null) {
      var dx = (p.x - this.getPos().x);
      this.velocity.x = clamp(-this.speed, dx, +this.speed);
    } else {
      this.velocity.x = 0;
    }      
  },

  update: function () {
    if (0 < this._jumpleft) {
      this._jumpleft--;
      if (this._jumpleft === 0) {
	this.setJumping(false);
      }
    }
    if (this.isLanded()) {
      this._jumpleft = 0;
    }

    var target = this.target;
    if (target !== null) {
      var tilemap = this.tilemap;
      var hitbox = ((target.isLanded())? 
		    target.hitbox :
		    predictLandingPoint(tilemap, target.hitbox, 
					target.velocity, target.fallfunc));
      if (hitbox !== null) {
	// make a plan.
	var goal = tilemap.coord2map(hitbox.center()).topleft();
	if (this.runner === null || !this.runner.isValid(goal)) {
	  this.runner = null;
	  var range = MakeRect(goal, 1, 1).inflate(10, 10);
	  var start = this.getTilePos();
	  this.plan.initPlan(goal);
	  if (this.plan.fillPlan(range, start)) {
	    // start following a plan.
	    var actor = this;
	    this.runner = new PlanActionRunner(this.plan, this);
	    this.runner.timeout = this.scene.app.framerate*2;
	    this.runner.moveto = function (p) { actor.moveToward(p); }
	    this.runner.jump = function (t) { actor.jump(Infinity); }
	    log("begin:"+this.runner);
	  }
	}
      }
      // follow a plan.
      if (this.runner !== null) {
	// end following a plan.
	if (!this.runner.update()) {
	  log("end:  "+this.runner);
	  this.runner = null;
	  this.moveToward(null);
	}
      }
    }
    
    this._Actor2_update();
  },
  
  renderPlan: function (ctx, bx, by) {
    if (this.runner !== null) {
      this.runner.plan.render(ctx, bx, by, this.scene.tilesize);
    }
  },

});
