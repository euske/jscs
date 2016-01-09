// planrunner.js
//   requires: utils.js
//   requires: geom.js
//   requires: tilemap.js
//   requires: planmap.js
'use strict';


//  PlanActionRunner
//
function PlanActionRunner(plan, actor)
{
  this.plan = plan;
  this.actor = actor;
  var cur = actor.getGridPos();
  this.action = plan.getAction(cur.x, cur.y);

  this.timeout = Infinity;
  this.count = Infinity;
  this.moveto = null;
  this.jump = null;
}

define(PlanActionRunner, Object, '', {
  toString: function () {
    return ('<PlanActionRunner: actor='+this.actor+', action='+this.action+'>');
  },

  update: function () {
    if (this.action === null || this.action.next === null) return false;
    if (this.count <= 0) return false;
    this.count--;
    
    var plan = this.plan;
    var actor = this.actor;
    var tilemap = plan.tilemap;
    var cur = actor.getGridPos();
    var dst = this.action.next.p;

    // Get a micro-level (greedy) plan.
    switch (this.action.type) {
    case A.NONE:
      break;

    case A.WALK:
    case A.CLIMB:
      if (this.moveto !== null) {
	this.moveto(dst);
      }
      if (cur.equals(dst)) {
	this.action = this.action.next;
	this.count = this.timeout;
      }
      break;
      
    case A.FALL:
      var map = tilemap.getRangeMap(T.isObstacle);
      var path = map.findSimplePath(cur.x, cur.y, dst.x, dst.y, actor.tilebounds);
      for (var i = 0; i < path.length; i++) {
	var r = actor.getHitboxAt(path[i]);
	var v = r.diff(actor.hitbox);
	if (actor.isMovable(v)) {
	  if (this.moveto !== null) {
	    this.moveto(path[i]);
	  }
	  break;
	}
      }
      if (cur.equals(dst)) {
	this.action = this.action.next;
	this.count = this.timeout;
      }
      break;
      
    case A.JUMP:
      if (actor.isLanded() && !actor.isHolding() &&
	  this.hasClearance(cur.x, dst.y)) {
	if (this.jump !== null) {
	  this.jump();
	}
	// once you leap, the action is considered finished.
	this.action = this.action.next;
	this.count = this.timeout;
      } else {
	// not landed, holding something, or has no clearance.
	if (this.moveto !== null) {
	  this.moveto(cur);
	}
      }
      break;
    }

    return true;
  },

  hasClearance: function (x, y) {
    var plan = this.plan;
    var actor = this.actor;
    var tilemap = plan.tilemap;

    var r = tilemap.map2coord(
      new Rectangle(x+actor.tilebounds.x, 
		    y+actor.tilebounds.y, 
		    actor.tilebounds.width, 
		    actor.tilebounds.height));
    r = r.union(actor.hitbox);
    var stoppable = tilemap.getRangeMap(T.isStoppable);
    return (stoppable.get(r.x, r.y, r.right(), r.bottom()) === 0);
  },

});


//  PlanningActor
//
function PlanningActor(tilemap, bounds, hitbox, tileno)
{
  this._JumpingActor(bounds, hitbox, tileno)
  this.tilemap = tilemap;
  this.tilebounds = new Rectangle(0, 0, 1, 1);
  this.target = null;
  this.runner = null;

  var gridsize = this.tilemap.tilesize/2;
  this.plan = new PlanMap(this, gridsize, this.tilemap);
  this.obstacle = this.tilemap.getRangeMap(T.isObstacle);
  this.grabbable = this.tilemap.getRangeMap(T.isGrabbable);
  this.stoppable = this.tilemap.getRangeMap(T.isStoppable);
  this.jumppts = calcJumpRange(gridsize, this.speed, this.jumpfunc, this.fallfunc);
  this.fallpts = calcFallRange(gridsize, this.speed, this.fallfunc);
}

define(PlanningActor, JumpingActor, 'JumpingActor', {
  isHolding: function () {
    var tilemap = this.tilemap;
    var f = (function (x,y,c) { return T.isGrabbable(c); });
    return (tilemap.apply(f, tilemap.coord2map(this.hitbox)) !== null);
  },

  getContactFor: function (range, hitbox, v) {
    return this.tilemap.contactTile(hitbox, T.isObstacle, v);
  },
  
  startPlan: function (runner) {
    var actor = this;
    var plan = this.plan;
    var app = this.scene.app;
    runner.timeout = app.framerate*2;
    runner.moveto = function (p) { actor.moveToward(p); }
    runner.jump = function (t) { actor.setJump(Infinity); }
    this.runner = runner;
    log("begin:"+this.runner);
  },
  
  stopPlan: function () {
    if (this.runner !== null) {
      log("end:  "+this.runner);
      this.velocity = new Vec2();
    }
    this.runner = null;
  },

  update: function () {
    var target = this.target;
    if (target !== null) {
      var tilemap = this.tilemap;
      var hitbox = ((target.isLanded())? 
		    target.hitbox :
		    predictLandingPoint(tilemap, target.hitbox, 
					target.velocity, target.fallfunc));
      if (hitbox !== null) {
	// make a plan.
	var goal = this.plan.coord2grid(hitbox.center());
	if (this.runner === null ||
	    !this.runner.plan.goal.equals(goal)) {
	  this.stopPlan();
	  var range = MakeRect(goal, 1, 1).inflate(10, 10);
	  var start = this.getGridPos();
	  this.plan.initPlan(goal);
	  if (this.plan.fillPlan(range, start)) {
	    // start following a plan.
	    this.startPlan(new PlanActionRunner(this.plan, this));
	  }
	}
      }
      // follow a plan.
      if (this.runner !== null) {
	// end following a plan.
	if (!this.runner.update()) {
	  this.stopPlan();
	}
      }
    }
    
    this._JumpingActor_update();
  },

  getGridPos: function () {
    var gs = this.plan.gridsize;
    return new Vec2(int(this.hitbox.centerx()/gs),
		    int((this.hitbox.bottom()-1)/gs));
  },
  getJumpPoints: function () {
    return this.jumppts;
  },
  getFallPoints: function () {
    return this.fallpts;
  },
  getHitboxAt: function (p) {
    var gs = this.plan.gridsize;
    return new Rect(int((p.x+.5)*gs-this.hitbox.width/2),
		    (p.y+1)*gs-this.hitbox.height,
		    this.hitbox.width, this.hitbox.height);
  },
  canMoveTo: function (p) {
    var hitbox = this.getHitboxAt(p);
    return !this.obstacle.exists(this.tilemap.coord2map(hitbox));
  },
  canGrabAt: function (p) {
    var hitbox = this.getHitboxAt(p);
    return this.grabbable.exists(this.tilemap.coord2map(hitbox));
  },
  canStandAt: function (p) {
    var hitbox = this.getHitboxAt(p).move(0, this.hitbox.height);
    return this.stoppable.exists(this.tilemap.coord2map(hitbox));
  },
  canClimbUp: function (p) {
    var hitbox = this.getHitboxAt(p);
    return this.grabbable.exists(this.tilemap.coord2map(hitbox));
  },
  canClimbDown: function (p) {
    var hitbox = this.getHitboxAt(p).move(0, this.hitbox.height);
    return this.grabbable.exists(this.tilemap.coord2map(hitbox));
  },
  canFall: function (p0, p1) {
    //  +--+....
    //  |  |....
    //  +-X+.... (p0.x,p0.y) original position.
    // ##.......
    //   ...+--+
    //   ...|  |
    //   ...+-X+ (p1.x,p1.y)
    //     ######
    var hb0 = this.getHitboxAt(p0);
    var hb1 = this.getHitboxAt(p1);
    var x0 = Math.min(hb0.right(), hb1.x);
    var x1 = Math.max(hb0.x, hb1.right());
    var y0 = Math.min(hb0.y, hb1.y);
    var y1 = Math.max(hb0.bottom(), hb1.bottom());
    var rect = new Rectangle(x0, y0, x1-x0, y1-y0);
    return !this.stoppable.exists(this.tilemap.coord2map(rect));
  },
  canJump: function (p0, p1) {
    //  ....+--+
    //  ....|  |
    //  ....+-X+ (p1.x,p1.y) tip point
    //  .......
    //  +--+...
    //  |  |...
    //  +-X+... (p0.x,p0.y) original position.
    // ######
    var hb0 = this.getHitboxAt(p0);
    var hb1 = this.getHitboxAt(p1);
    // extra care is needed not to allow the following case:
    //      .#
    //    +--+
    //    |  |  (this is impossiburu!)
    //    +-X+
    //       #
    var rect = hb0.union(hb1);
    return !this.stoppable.exists(this.tilemap.coord2map(rect));
  },

  moveToward: function (p) {
    var r = this.getHitboxAt(p);
    var v = r.diff(this.hitbox);
    this.velocity.x = clamp(-this.speed, v.x, +this.speed);
  },

});
