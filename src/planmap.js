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
  var pts = {};
  for (var jt = 1; jt < maxtime; jt++) {
    var p = new Vec2(0, 0);
    var vy = 0;
    for (var t = 0; t < maxtime; t++) {
      vy = (t < jt)? jumpfunc(vy, t) : vy;
      vy = fallfunc(vy);
      if (0 <= vy) {
	// tip point.
	var cy = Math.ceil(p.y/gridsize);
	for (var x = 0; x <= p.x; x++) {
	  var c = new Vec2(int(x/gridsize+.5), cy);
	  if (c.x == 0 && c.y == 0) continue;
	  pts[c.x+','+c.y] = c;
	}
	break;
      }
      p.x += speed;
      p.y += vy;
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
function PlanMap(actor, gridsize, tilemap)
{
  this.actor = actor;
  this.gridsize = gridsize;
  this.tilemap = tilemap;
  this.start = null;
  this.goal = null;
}

define(PlanMap, Object, '', {
  toString: function () {
    return ('<PlanMap '+this.goal+'>');
  },

  coord2grid: function (p) {
    var gs = this.gridsize;
    return new Vec2(int(p.x/gs+.5),
		    int(p.y/gs+.5));
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

  render: function (ctx, bx, by) {
    var gs = this.gridsize;
    var rs = gs/2;
    ctx.lineWidth = 1;
    for (var k in this._map) {
      var a = this._map[k];
      var p0 = this.grid2coord(a.p);
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
      ctx.strokeRect(bx+p0.x-rs/2+.5,
		     by+p0.y-rs/2+.5,
		     rs, rs);
      if (a.next !== null) {
	var p1 = this.grid2coord(a.next.p);
	ctx.beginPath();
	ctx.moveTo(bx+p0.x+.5, by+p0.y+.5);
	ctx.lineTo(bx+p1.x+.5, by+p1.y+.5);
	ctx.stroke();
      }
    }
    if (this.start !== null) {
      var p = this.grid2coord(this.start);
      ctx.strokeStyle = '#ff0000';
      ctx.strokeRect(bx+p.x-gs/2+.5,
		     by+p.y-gs/2+.5,
		     gs, gs);
    }
    if (this.goal !== null) {
      var p = this.grid2coord(this.goal);
      ctx.strokeStyle = '#00ff00';
      ctx.strokeRect(bx+p.x-gs/2+.5,
		     by+p.y-gs/2+.5,
		     gs, gs);
    }
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
      if (start !== null && start.equals(p)) return true;
      // assert(range.contains(p));

      // try climbing down.
      var dp = new Vec2(p.x, p.y-1);
      if (range.contains(dp) &&
	  this.actor.canClimbDown(dp)) {
	this.addAction(start, new PlanAction(dp, null, A.CLIMB, a0, 1));
      }
      // try climbing up.
      var up = new Vec2(p.x, p.y+1);
      if (range.contains(up) &&
	  this.actor.canClimbUp(up)) {
	this.addAction(start, new PlanAction(up, null, A.CLIMB, a0, 1));
      }

      // for left and right.
      for (var vx = -1; vx <= +1; vx += 2) {

	// try walking.
	var wp = new Vec2(p.x-vx, p.y);
	if (range.contains(wp) &&
	    this.actor.canMoveTo(wp) &&
	    (this.actor.canGrabAt(wp) ||
	     this.actor.canStandAt(wp))) {
	  this.addAction(start, new PlanAction(wp, null, A.WALK, a0, 1));
	}

	// try falling.
	var fallpts = this.actor.getFallPoints();
	for (var i = 0; i < fallpts.length; i++) {
	  var v = fallpts[i];
	  var fp = p.move(-v.x*vx, -v.y);
	  // try the v.x == 0 case only once.
	  if (v.x === 0 && vx < 0) continue;
	  if (!range.contains(fp)) continue;
	  //  +--+....  [vx = +1]
	  //  |  |....
	  //  +-X+.... (fp.x,fp.y) original position.
	  // ##.......
	  //   ...+--+
	  //   ...|  |
	  //   ...+-X+ (p.x,p.y)
	  //     ######
	  if (!this.actor.canMoveTo(fp)) continue;
	  if (this.actor.canFall(fp, p) && 
	      this.actor.canStandAt(p)) {
	    var dc = Math.abs(v.x)+Math.abs(v.y);
	    this.addAction(start, new PlanAction(fp, null, A.FALL, a0, dc));
	  }
	}

	// try jumping.
	if (a0.type === A.FALL) {
	  var jumppts = this.actor.getJumpPoints();
	  for (var i = 0; i < jumppts.length; i++) {
	    var v = jumppts[i];
	    // try the v.x == 0 case only once.
	    if (v.x === 0 && vx < 0) continue;
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
	    if (!this.actor.canMoveTo(jp)) continue;
	    if (this.actor.canJump(jp, p) &&
		(this.actor.canGrabAt(jp) || this.actor.canStandAt(jp))) {
	      var dc = Math.abs(v.x)+Math.abs(v.y);
	      this.addAction(start, new PlanAction(jp, null, A.JUMP, a0, dc));
	    }
	  }
	}
      }
      
      // A* search.
      this._queue.sort(function (a,b) { return a.total-b.total; });
    }
    
    return false;
  },

});
