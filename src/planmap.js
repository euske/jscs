// planmap.js
//   requires: utils.js
//   requires: geom.js
//   requires: tilemap.js
'use strict';

// calcJumpRange
function calcJumpRange(
  gridsize, speed, jumpfunc, fallfunc, maxtime)
{
  maxtime = (maxtime !== undefined)? maxtime : 15;
  var p = new Vec2(0, 0);
  var vy = 0;
  var pts = {};
  for (var t = 0; t < maxtime; t++) {
    var dy = jumpfunc(t);
    vy = fallfunc(vy+dy);
    if (0 < vy) break;
    p.x += speed;
    p.y += vy;      
    var cy = Math.ceil(p.y/gridsize);
    for (var x = 0; x <= p.x; x++) {
      var c = new Vec2(int(x/gridsize+.5), cy);
      if (c.x == 0 && c.y == 0) continue;
      pts[c.x+','+c.y] = c;
    }
  }
  var a = [];
  for (var k in pts) {
    a.push(pts[k]);
  }
  return a;
}

// calcFallRange
function calcFallRange(
  gridsize, speed, fallfunc, maxtime)
{
  maxtime = (maxtime !== undefined)? maxtime : 15;
  var p = new Vec2(0, 0);
  var vy = 0;
  var pts = {};
  for (var t = 0; t < maxtime; t++) {
    vy = fallfunc(vy);
    p.x += speed;
    p.y += vy;
    var cy = Math.ceil(p.y/gridsize);
    for (var x = 0; x <= p.x; x++) {
      var c = new Vec2(int(x/gridsize+.5), cy);
      if (c.x == 0 && c.y == 0) continue;
      pts[c.x+','+c.y] = c;
    }
  }
  var a = [];
  for (var k in pts) {
    a.push(pts[k]);
  }
  return a;
}


// predictLandingPoint: returns the estimated landing position.
function predictLandingPoint(
  tilemap, hitbox,
  velocity, fallfunc, maxtime)
{
  maxtime = (maxtime !== undefined)? maxtime : 15;
  var stoppable = tilemap.getRangeMap(T.isStoppable);
  var dy = velocity.y;
  for (var t = 0; t < maxtime; t++) {
    var rect = hitbox.move(velocity.x, dy);
    dy = fallfunc(dy);
    var b = tilemap.coord2map(rect);
    if (stoppable.exists(b)) return hitbox;
    hitbox = rect;
  }
  return null;
}


//  PlanAction
//
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

function PlanAction(p, context, type, next, dc)
{
  context = (context !== undefined)? context : null;
  type = (type !== undefined)? type : A.NONE;
  next = (next !== undefined)? next : null;
  dc = (dc !== undefined)? dc : 0;
  assert(0 <= dc);
  this.p = p;
  this.context = context;
  this.type = type;
  this.next = next;
  this.cost = (next === null)? 0 : next.cost+dc;
  this.key = getKey(p.x, p.y);
}

define(PlanAction, Object, '', {
  toString: function () {
    return ('<PlanAction('+this.p.x+','+this.p.y+'): '+this.type+' cost='+this.cost+'>');
  },

});


//  PlanMap
//
function PlanMap(actor, gridsize, tilemap, tilebounds)
{
  tilebounds = ((tilebounds !== undefined)?
		tilebounds : new Rectangle(0, 0, 1, 1));
  this.actor = actor;
  this.gridsize = gridsize;
  this.tilemap = tilemap;
  this.obstacle = tilemap.getRangeMap(T.isObstacle);
  this.stoppable = tilemap.getRangeMap(T.isStoppable);
  this.grabbable = tilemap.getRangeMap(T.isGrabbable);
  this.tilebounds = tilebounds;
  this.start = null;
  this.goal = null;
}

define(PlanMap, Object, '', {
  toString: function () {
    return ('<PlanMap '+this.goal+'>');
  },

  setJumpRange: function (speed, jumpfunc, fallfunc, maxtime) {
    this.jumppts = calcJumpRange(this.gridsize, speed, jumpfunc, fallfunc, maxtime);
    this.fallpts = calcFallRange(this.gridsize, speed, fallfunc, maxtime);
  },

  coord2grid: function (p) {
    var gs = this.gridsize;
    return new Vec2(int(p.x/gs), int(p.y/gs));
  },

  grid2coord: function (p) {
    var gs = this.gridsize;
    return new Vec2(p.x*gs, p.y*gs);
  },

  getAction: function (x, y, context) {
    var k = getKey(x, y, context);
    if (this._map.hasOwnProperty(k)) {
      return this._map[k];
    } else {
      return null;
    }
  },

  addAction: function (start, action) {
    var prev = this._map[action.key];
    if (prev === undefined || action.cost < prev.cost) {
      this._map[action.key] = action;
      var dist = ((start === null)? Infinity :
		  (Math.abs(start.x-action.p.x)+
		   Math.abs(start.y-action.p.y)));
      this._queue.push({ action:action, total:(dist+action.cost) });
    }
  },

  isValidPos: function (p) {
    // a start position cannot be in the mid air.
    var cb = this.tilebounds;
    var pb = new Rect(this.tilebounds.x, this.tilebounds.bottom(),
		      this.tilebounds.width, 1);
    return (grabbable.exists(cb.movev(p)) ||
	    stoppable.exists(pb.movev(p)));
  },
  
  initPlan: function (goal) {
    this.goal = goal;
    this._map = {};
    this._queue = [];
    this.addAction(null, new PlanAction(goal));
  },

  fillPlan: function (range, start, maxcost) {
    start = (start !== undefined)? start : null;
    maxcost = (maxcost !== undefined)? maxcost : 20;

    this.start = start;
    while (0 < this._queue.length) {
      var a0 = this._queue.shift().action;
      if (maxcost <= a0.cost) continue;
      var p = a0.p;
      var context = a0.context;
      if (start !== null && start.equals(p)) return true;
      if (!this.actor.canMoveTo(this, p)) continue;
      // a character cannot stand in the mid air.
      if (context === null &&
	  !(this.actor.canGrabAt(this, p) ||
	    this.actor.canStandAt(this, p))) continue;
      // assert(range.x <= p.x && p.x <= range.right());
      // assert(range.y <= p.y && p.y <= range.bottom());

      // try climbing down.
      var dp = new Vec2(p.x, p.y-1);
      if (context === null &&
	  range.contains(dp) &&
	  this.actor.canClimbDown(this, dp)) {
	this.addAction(start, new PlanAction(dp, null, A.CLIMB, a0, 1));
      }
      // try climbing up.
      var up = new Vec2(p.x, p.y+1);
      if (context === null &&
	  range.contains(up) &&
	  this.actor.canClimbUp(this, up)) {
	this.addAction(start, new PlanAction(up, null, A.CLIMB, a0, 1));
      }

      // for left and right.
      for (var vx = -1; vx <= +1; vx += 2) {
	var bx0 = (0 < vx)? this.tilebounds.x : this.tilebounds.right();
	var bx1 = (0 < vx)? this.tilebounds.right() : this.tilebounds.x;
	var by0 = this.tilebounds.y, by1 = this.tilebounds.bottom();

	// try walking.
	var wp = new Vec2(p.x-vx, p.y);
	if (context === null &&
	    range.x <= wp.x && wp.x <= range.right() &&
	    this.actor.canMoveTo(this, wp) &&
	    (this.actor.canGrabAt(this, wp) ||
	     this.actor.canStandAt(this, wp))) {
	  this.addAction(start, new PlanAction(wp, null, A.WALK, a0, 1));
	}

	// try falling.
	if (context === null) {
	  for (var i = 0; i < this.fallpts.length; i++) {
	    var v = this.fallpts[i];
	    var fp = p.move(-v.x*vx, -v.y);
	    if (!range.contains(fp)) continue;
	    //  +--+....  [vx = +1]
	    //  |  |....
	    //  +-X+.... (fp.x,fp.y) original position.
	    // ##.......
	    //   ...+--+
	    //   ...|  |
	    //   ...+-X+ (p.x,p.y)
	    //     ######
	    if (!this.actor.canMoveTo(this, fp)) continue;
	    var dc = Math.abs(v.x)+Math.abs(v.y);
	    if (0 < v.x &&
		this.stoppable.get(fp.x+bx0+vx, fp.y+by0, 
				   p.x+bx1, p.y+by1) === 0 &&
		(this.actor.canGrabAt(this, fp) ||
		 this.actor.canStandAt(this, fp))) {
	      // normal fall.
	      this.addAction(start, new PlanAction(fp, null, A.FALL, a0, dc));
	    }
	    if (v.y === 0 ||
		this.stoppable.get(fp.x+bx0, fp.y+by1, 
				   p.x+bx1, p.y+by1) === 0) {
	      // fall after jump.
	      this.addAction(start, new PlanAction(fp, A.FALL, A.FALL, a0, dc));
	    }
	  }
	}

	// try jumping.
	if (context === A.FALL) {
	  for (var i = 0; i < this.jumppts.length; i++) {
	    var v = this.jumppts[i];
	    if (v.x === 0) continue;
	    var jp = p.move(-v.x*vx, -v.y);
	    if (!range.contains(jp)) continue;
	    //  ....+--+  [vx = +1]
	    //  ....|  |
	    //  ....+-X+ (p.x,p.y) tip point
	    //  .......
	    //  +--+...
	    //  |  |...
	    //  +-X+... (jp.x,jp.y) original position.
	    // ######
	    if (!(this.actor.canGrabAt(this, jp) ||
		  this.actor.canStandAt(this, jp))) continue;
	    if (this.stoppable.get(jp.x+bx0, jp.y+by1, 
				   p.x+bx1-vx, p.y+by0) !== 0) continue;
	    // extra care is needed not to allow the following case:
	    //      .#
	    //    +--+
	    //    |  |  (this is impossible!)
	    //    +-X+
	    //       #
	    if (this.obstacle.exists(new Rect(p.x+bx1, p.y+by0-1, 1, 1)) &&
		this.obstacle.exists(new Rect(p.x+bx1, p.y+by1+1, 1, 1)) &&
		!this.obstacle.exists(new Rect(p.x+bx1-vx, p.y+by0-1, 1, 1))) continue;
	    var dc = Math.abs(v.x)+Math.abs(v.y);
	    this.addAction(start, new PlanAction(jp, null, A.JUMP, a0, dc));
	  }
	}
      }
      
      // A* search.
      this._queue.sort(function (a,b) { return a.total-b.total; });
    }
    
    return false;
  },

  render: function (ctx, bx, by) {
    var gs = this.gridsize;
    var rs = gs/2;
    ctx.lineWidth = 1;
    for (var k in this._map) {
      var a = this._map[k];
      var p0 = a.p;
      switch (a.type) {
      case A.WALK:
	ctx.strokeStyle = 'white';
	break;
      case A.FALL:
	ctx.strokeStyle = 'blue';
	break;
      case A.JUMP:
	ctx.strokeStyle = 'magenta';
	break;
      case A.CLIMB:
	ctx.strokeStyle = 'cyan';
	break;
      default:
	continue;
      }
      ctx.strokeRect(bx+gs*p0.x+(gs-rs)/2+.5,
		     by+gs*p0.y+(gs-rs)/2+.5,
		     rs, rs);
      if (a.next !== null) {
	var p1 = a.next.p;
	ctx.beginPath();
	ctx.moveTo(bx+gs*p0.x+rs+.5, by+gs*p0.y+rs+.5);
	ctx.lineTo(bx+gs*p1.x+rs+.5, by+gs*p1.y+rs+.5);
	ctx.stroke();
      }
    }
    if (this.start !== null) {
      ctx.strokeStyle = '#ff0000';
      ctx.strokeRect(bx+gs*this.start.x+.5,
		     by+gs*this.start.y+.5,
		     gs, gs);
    }
    if (this.goal !== null) {
      ctx.strokeStyle = '#00ff00';
      ctx.strokeRect(bx+gs*this.goal.x+.5,
		     by+gs*this.goal.y+.5,
		     gs, gs);
    }
  },

});
