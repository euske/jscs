// planmap.js
//   requires: utils.js
//   requires: geom.js
//   requires: tilemap.js
//   requires: rangemap.js
'use strict';

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

// calcJumpRange
function calcJumpRange(
  tilemap, speed, jumpfunc, fallfunc, maxtime)
{
  maxtime = (maxtime !== undefined)? maxtime : 15;
  var ts = tilemap.tilesize;
  var p = new Vec2(0, 0);
  var vy = 0;
  var pts = {};
  for (var t = 0; t < maxtime; t++) {
    var cy = Math.ceil(p.y/ts+.5);
    for (var x = 0; x <= p.x; x++) {
      var c = new Vec2(int(x/ts+.5), cy);
      if (c.x == 0 && c.y == 0) continue;
      pts[c.x+','+c.y] = c;
    }
    var dy = jumpfunc(t);
    vy = fallfunc(vy+dy);
    if (0 <= vy) break;
    p.x += speed;
    p.y += vy;      
  }
  var a = [];
  for (var k in pts) {
    a.push(pts[k]);
  }
  return a;
}

// calcFallRange
function calcFallRange(
  tilemap, speed, fallfunc, maxtime)
{
  maxtime = (maxtime !== undefined)? maxtime : 15;
  var ts = tilemap.tilesize;
  var p = new Vec2(0, 0);
  var vy = 0;
  var pts = {};
  for (var t = 0; t < maxtime; t++) {
    var cy = Math.floor(p.y/ts+.5);
    for (var x = 0; x <= p.x; x++) {
      var c = new Vec2(int(x/ts+.5), cy);
      if (c.x == 0 && c.y == 0) continue;
      pts[c.x+','+c.y] = c;
    }
    vy = fallfunc(vy);
    p.x += speed;
    p.y += vy;      
  }
  var a = [];
  for (var k in pts) {
    a.push(pts[k]);
  }
  return a;
}

//  PlanMap
//
function PlanMap(tilemap, tilebounds)
{
  tilebounds = ((tilebounds !== undefined)?
		tilebounds : new Rectangle(0, 0, 1, 1));
  this.tilemap = tilemap;
  this.tilebounds = tilebounds;
}

define(PlanMap, Object, '', {
  toString: function () {
    return ('<PlanMap '+this._goal+'>');
  },

  setJumpRange: function (speed, jumpfunc, fallfunc, maxtime) {
    this.jumppts = calcJumpRange(this.tilemap, speed, jumpfunc, fallfunc, maxtime);
    this.fallpts = calcFallRange(this.tilemap, speed, fallfunc, maxtime);
    log("jump="+this.jumppts);
    log("fall="+this.fallpts);
  },

  isValid: function (p) {
    return (p !== null && this._goal.equals(p));
  },

  getAction: function (x, y, context) {
    var k = getKey(x, y, context);
    if (this._map.hasOwnProperty(k)) {
      return this._map[k];
    } else {
      return null;
    }
  },

  addAction: function (queue, start, action) {
    var prev = this._map[action.key];
    if (prev === undefined || action.cost < prev.cost) {
      this._map[action.key] = action;
      var dist = ((start === null)? 0 :
		  (Math.abs(start.x-action.p.x)+
		   Math.abs(start.y-action.p.y)));
      queue.push({ action:action, prio:dist });
    }
  },

  initPlan: function (goal) {
    this._goal = goal;
    this._map = {};
  },
  
  fillPlan: function (range, start, maxcost) {
    start = (start !== undefined)? start : null;
    maxcost = (maxcost !== undefined)? maxcost : 100;

    var tilemap = this.tilemap;
    var obstacle = tilemap.getRangeMap(T.isObstacle);
    var stoppable = tilemap.getRangeMap(T.isStoppable);
    var grabbable = tilemap.getRangeMap(T.isGrabbable);
    var cb = this.tilebounds;
    var cb1 = this.tilebounds.move(0, 1);
    var pb = new Rect(this.tilebounds.x, this.tilebounds.bottom(),
		      this.tilebounds.width, 1);

    // a start position cannot be in the mid air.
    if (start !== null &&
	!grabbable.exists(cb.movev(start)) &&
	!stoppable.exists(pb.movev(start))) return false;

    var queue = [];
    this.addAction(queue, start, new PlanAction(this._goal));
    while (0 < queue.length) {
      var a0 = queue.pop().action;
      var p = a0.p;
      var context = a0.context;
      if (start !== null && start.equals(p)) return true;
      if (obstacle.exists(cb.movev(p))) continue;
      // a character cannot stand in the mid air.
      if (context === null &&
	  !grabbable.exists(cb.movev(p)) &&
	  !stoppable.exists(pb.movev(p))) continue;
      // assert(range.x <= p.x && p.x <= range.right());
      // assert(range.y <= p.y && p.y <= range.bottom());
      var cost = a0.cost;
      if (maxcost < cost) continue;

      // try climbing down.
      if (context === null &&
	  range.y <= p.y-1 &&
	  grabbable.exists(pb.movev(p))) {
	cost += 1;
	this.addAction(queue, start, 
		       new PlanAction(new Vec2(p.x, p.y-1), null, A.CLIMB, cost, a0));
      }
      // try climbing up.
      if (context === null &&
	  p.y+1 <= range.bottom &&
	  grabbable.exists(cb1.movev(p))) {
	cost += 1;
	this.addAction(queue, start, 
		       new PlanAction(new Vec2(p.x, p.y+1), null, A.CLIMB, cost, a0));
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
	    !obstacle.exists(cb.movev(wp)) &&
	    (grabbable.exists(cb.movev(wp)) ||
	     stoppable.exists(pb.movev(wp)))) {
	  cost += 1;
	  this.addAction(queue, start, 
			 new PlanAction(wp, null, A.WALK, cost, a0));
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
	    if (obstacle.exists(cb.movev(fp))) continue;
	    cost += (v.x+v.y+1);
	    if (0 < v.x &&
		stoppable.get(fp.x+bx0+vx, fp.y+by0, 
			      p.x+bx1, p.y+by1) === 0 &&
		(grabbable.exists(cb.movev(fp)) ||
		 stoppable.exists(pb.movev(fp)))) {
	      // normal fall.
	      this.addAction(queue, start, 
			     new PlanAction(fp, null, A.FALL, cost, a0));
	    }
	    if (v.y === 0 ||
		stoppable.get(fp.x+bx0, fp.y+by1, 
			      p.x+bx1, p.y+by1) === 0) {
	      // fall after jump.
	      this.addAction(queue, start, 
			     new PlanAction(fp, A.FALL, A.FALL, cost, a0));
	    }
	  }
	}

	// try jumping.
	if (context === A.FALL) {
	  for (var i = 0; i < this.jumppts.length; i++) {
	    var v = this.jumppts[i];
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
	    if (stoppable.get(jp.x+bx0, jp.y+by1, 
			      p.x+bx1-vx, p.y+by0) !== 0) break;
	    if (!grabbable.exists(cb.movev(jp)) &&
		!stoppable.exists(pb.movev(jp))) continue;
	    // extra care is needed not to allow the following case:
	    //      .#
	    //    +--+
	    //    |  |  (this is impossible!)
	    //    +-X+
	    //       #
	    if (T.isObstacle(tilemap.get(p.x+bx1, p.y+by0-1)) &&
		T.isObstacle(tilemap.get(p.x+bx1, p.y+by1+1)) &&
		!T.isObstacle(tilemap.get(p.x+bx1-vx, p.y+by0-1))) continue;
	    cost += (v.x+v.y+1);
	    this.addAction(queue, start, 
			   new PlanAction(jp, null, A.JUMP, cost, a0));
	  }
	}
      }
      
      if (start !== null) {
	// A* search.
	queue.sort(function (a,b) { return b.prio-a.prio; });
      }
    }
    
    return false;
  },

  render: function (ctx, bx, by, tilesize) {
    var rs = tilesize/2;
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
      ctx.strokeRect(bx+tilesize*p0.x+(tilesize-rs)/2+.5,
		     by+tilesize*p0.y+(tilesize-rs)/2+.5,
		     rs, rs);
      if (a.next !== null) {
	var p1 = a.next.p;
	ctx.beginPath();
	ctx.moveTo(bx+tilesize*p0.x+rs+.5, by+tilesize*p0.y+rs+.5);
	ctx.lineTo(bx+tilesize*p1.x+rs+.5, by+tilesize*p1.y+rs+.5);
	ctx.stroke();
      }
    }
  },

});
