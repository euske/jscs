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
  var hitbox = bounds.inflate(-4, -4);
  this._Actor(bounds, hitbox, tileno);
  this.speed = 8;
  this.gravity = 2;
  this.maxspeed = 16;
  this.jumpacc = -8;
  this.tilebounds = new Rectangle(0, 0, 1, 1);
  this.velocity = new Vec2(0, 0);
  this.landed = false;
}

define(Actor2, Actor, 'Actor', {
  update: function () {
    this.velocity.y += this.gravity;
    this.velocity.y = clamp(-this.maxspeed, this.velocity.y, this.maxspeed);
    var v = this.getMove(this.velocity);
    this.landed = (0 < this.velocity.y && v.y === 0);
    this.velocity = v;
    this.move(this.velocity.x, this.velocity.y);
  },

  getMove: function (v) {
    var rect = this.hitbox;
    var tilemap = this.scene.tilemap;
    var d0 = tilemap.contactTile(rect, T.isObstacle, v);
    rect = rect.move(d0.x, d0.y);
    v = v.sub(d0);
    var d1 = tilemap.contactTile(rect, T.isObstacle, new Vec2(v.x, 0));
    rect = rect.move(d1.x, d1.y);
    v = v.sub(d1);
    var d2 = tilemap.contactTile(rect, T.isObstacle, new Vec2(0, v.y));
    return new Vec2(d0.x+d1.x+d2.x,
		    d0.y+d1.y+d2.y);
  },

  getPos: function () {
    return this.hitbox.center();
  },

  getTilePos: function () {
    var r = this.scene.tilemap.coord2map(this.hitbox.center());
    return new Vec2(r.x, r.y);
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
    return (tilemap.apply(tilemap.coord2map(this.hitbox), f) !== null);
  },

});

// Player
function Player(bounds)
{
  this._Actor2(bounds, S.PLAYER);
  this.maxacctime = 8;
  
  this.picked = new Slot(this);
  this.jumped = new Slot(this);
  this._jumpt = -1;
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

  update: function () {
    if (0 <= this._jumpt && this._jumpt < this.maxacctime) {
      this._jumpt++;
      this.velocity.y -= this.gravity;
    }
    this._Actor2_update(this);  
  },
  
  usermove: function (vx, vy) {
    this.velocity.x = vx*this.speed;
  },

  jump: function (jumping) {
    if (jumping) {
      if (this.isLanded()) {
	this._jumpt = 0;
	this.velocity.y = this.jumpacc;
	this.jumped.signal();
      }
    } else {
      this._jumpt = -1;
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
  this.jumpacc = -16;
  this.target = null;
  this.runner = null;
}

RANGE = 10;
define(Enemy, Actor2, 'Actor2', {
  toString: function () {
    return '<Enemy: '+this.bounds+'>';
  },

  jump: function () {
    if (this.isLanded()) {
      this.velocity.y = this.jumpacc;
    }
  },

  moveToward: function (p) {
    var dx = (p.x - this.getPos().x);
    this.velocity.x = ((0 < dx) ? +1 : -1) * this.speed;
  },

  update: function () {
    this._Actor2_update();

    if (this.target === null) return;

    var actor = this;
    var target = this.target;
    function jump(e) {
      actor.jump();
    }
    function moveto(e, p) {
      actor.moveToward(p);
    }
    function ascend(t) {
      return t;
    }
    function descend(t) {
      return t*t*actor.gravity;
    }
    function t_descend(t) {
      return t*t*target.gravity;
    }
    
    var scene = this.scene;
    var tilemap = scene.tilemap;
    var hitbox = ((target.isLanded())? 
		  target.hitbox :
		  predictLandingPoint(tilemap, target.hitbox, 
				      target.velocity, t_descend));
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
      var range = new Rectangle(goal.x-RANGE, goal.y-RANGE, RANGE*2+1, RANGE*2+1);
      var plan = new PlanMap(tilemap, goal, range,
			     tilebounds, this.speed,
			     new Vec2(2, 3), ascend, descend);
      if (plan.fillPlan(this.getTilePos())) {
	// start following a plan.
	this.runner = new PlanActionRunner(plan, this, scene.app.framerate*2);
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
  },
  
  renderPlan: function (ctx, bx, by) {
    if (this.runner !== null) {
      this.runner.plan.render(ctx, bx, by, this.scene.tilesize);
    }
  },

});
