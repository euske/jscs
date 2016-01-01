// planaction.js
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
  var cur = actor.getTilePos();
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
    var cur = actor.getTilePos();
    var dst = this.action.next.p;

    // Get a micro-level (greedy) plan.
    switch (this.action.type) {
    case A.NONE:
      break;

    case A.WALK:
    case A.CLIMB:
      if (this.moveto !== null) {
	var r = tilemap.map2coord(dst);
	this.moveto(r.center());
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
	var r = tilemap.map2coord(path[i]);
	var v = r.diff(actor.hitbox);
	if (actor.isMovable(v)) {
	  if (this.moveto !== null) {
	    this.moveto(r.center());
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
	  var r = tilemap.map2coord(cur);
	  this.moveto(r.center());
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
function PlanningActor(bounds, hitbox, tileno)
{
  this._JumpingActor(bounds, hitbox, tileno)
  this.tilebounds = new Rectangle(0, 0, 1, 1);
  this.target = null;
  this.plan = null;
  this.runner = null;
}

define(PlanningActor, JumpingActor, 'JumpingActor', {
  isHolding: function () {
    var tilemap = this.scene.tilemap;
    var f = (function (x,y,c) { return T.isGrabbable(c); });
    return (tilemap.apply(f, tilemap.coord2map(this.hitbox)) !== null);
  },

  getContactFor: function (range, hitbox, v) {
    return this.scene.tilemap.contactTile(hitbox, T.isObstacle, v);
  },
  
  getTilePos: function () {
    var r = this.scene.tilemap.coord2map(this.hitbox.center());
    return new Vec2(r.x, r.y);
  },

  moveToward: function (p) {
    var dx = (p.x - this.hitbox.centerx());
    this.velocity.x = clamp(-this.speed, dx, +this.speed);
  },

  start: function (scene) {
    this._JumpingActor_start(scene);
    this.plan = new PlanMap(scene.tilemap);
    this.plan.tilebounds = this.tilebounds;
    this.plan.setJumpRange(scene.tilemap.tilesize,
			   this.speed, this.jumpfunc, this.fallfunc);
  },

  startPlan: function (runner) {
    var actor = this;
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
      var tilemap = this.scene.tilemap;
      var hitbox = ((target.isLanded())? 
		    target.hitbox :
		    predictLandingPoint(tilemap, target.hitbox, 
					target.velocity, target.fallfunc));
      if (hitbox !== null) {
	// make a plan.
	var goal = tilemap.coord2map(hitbox.center()).topleft();
	if (this.runner === null ||
	    !this.runner.plan.goal.equals(goal)) {
	  this.stopPlan();
	  var range = MakeRect(goal, 1, 1).inflate(10, 10);
	  var start = this.getTilePos();
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

});
