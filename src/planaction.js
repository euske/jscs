// planaction.js
//   requires: utils.js
//   requires: geom.js
//   requires: tilemap.js
//   requires: rangemap.js
//   requires: planmap.js
'use strict';

var A = {
  NONE: 'NONE',
  WALK: 'WALK',
  FALL: 'FALL',
  JUMP: 'JUMP',
  CLIMB: 'CLIMB',
  MOVETO: 'MOVETO',
};

function getKey(x, y, context)
{
  return (context === undefined)? (x+','+y) : (x+','+y+':'+context);
}

function PlanAction(p, context, type, cost, next)
{
  context = (context !== undefined)? context : null;
  type = (type !== undefined)? type : A.NONE;
  cost = (cost !== undefined)? cost : 0;
  next = (next !== undefined)? next : null;
  assert(0 <= cost);
  this.p = p;
  this.context = context;
  this.type = type;
  this.cost = cost;
  this.next = next;
  this.key = getKey(p.x, p.y);
}

define(PlanAction, Object, '', {
  toString: function () {
    return ('<PlanAction('+this.p.x+','+this.p.y+'): '+this.type+' cost='+this.cost+'>');
  },

});

function PlanActionRunner(plan, actor)
{
  this.plan = plan;
  this.actor = actor;
  var cur = actor.getTilePos();
  this.action = plan.getAction(cur.x, cur.y);

  this.timeout = -1;
  this.moveto = null;
  this.jump = null;
}

define(PlanActionRunner, Object, '', {
  toString: function () {
    return ('<PlanActionRunner: actor='+this.actor+', action='+this.action+'>');
  },

  isValid: function (goal) {
    return this.plan.isValid(goal);
  },

  update: function () {
    if (this.action === null || this.action.next === null) return false;
    if (this.count == 0) return false;
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
