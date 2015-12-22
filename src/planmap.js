// planmap.js

// predictLandingPoint: returns the estimated landing position.
function predictLandingPoint(
  tilemap, hitbox,
  velocity, fallfunc, maxdt)
{
  maxdt = (maxdt !== undefined)? maxdt : 20;
  var stoppable = tilemap.getRangeMap(T.isStoppable);
  var rect0 = hitbox;
  var dy = velocity.y;
  for (var dt = 0; dt < maxdt; dt++) {
    var rect1 = hitbox.move(velocity.x*dt, dy);
    var b = tilemap.coord2map(rect1);
    if (stoppable.exists(b)) {
      return rect0;
    }
    rect0 = rect1;
    dy += fallfunc(dt);
  }
  return null;
}

// PlanMap
// public var tilemap:TileMap;
// public var range:Rectangle; // search range
// public var tilebounds:Rectangle;    // character offset and size
// public var speed:int;       // moving speed while jumping
// public var jumprange:Point;   // jump range
// public var ascend:Function;   // ascend at t
// public var descend:Function;   // descende at t
function PlanMap(tilemap, range, tilebounds,
		 speed, jumprange, ascend, descend)
{
  this.tilemap = tilemap;
  this.range = range;
  this.tilebounds = new Rectangle(0, 0, 1, 1);
  this.speed = 1;
  this.jumprange = new Vec2(1, 1);
  this.ascend = (function (t) { return t; });
  this.descend = (function (t) { return t*t; });
  this.init(null);
}

define(PlanMap, Object, '', {
  toString: function () {
    return ('<PlanMap '+this.range+'>');
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

  init: function (goal) {
    this._goal = goal;
    this._map = {};
  },
  
  fillPlan: function (start, maxcost, falldx, falldy) {
    maxcost = (maxcost !== undefined)? maxcost : 100;
    falldx = (falldx !== undefined)? falldx : 10;
    falldy = (falldy !== undefined)? falldy : 20;

    var tilemap = this.tilemap;
    var range = this.range;
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
	  for (var fdx = 0; fdx <= falldx; fdx++) {
	    var fx = p.x-vx*fdx;
	    if (fx < range.x || range.right() < fx) break;
	    // fdt: time for falling.
	    var fdt = Math.floor(tilemap.tilesize*fdx/this.speed);
	    // fdy: amount of falling.
	    var fdy = Math.ceil(this.descend(fdt) / tilemap.tilesize);
	    for (; fdy <= falldy; fdy++) {
	      var fy = p.y-fdy;
	      if (fy < range.y || range.bottom() < fy) break;
	      var fp = new Vec2(fx, fy);
	      //  +--+....  [vx = +1]
	      //  |  |....
	      //  +-X+.... (fx,fy) original position.
	      // ##.......
	      //   ...+--+
	      //   ...|  |
	      //   ...+-X+ (p.x,p.y)
	      //     ######
	      if (obstacle.exists(cb.movev(fp))) continue;
	      cost += Math.abs(fdx)+Math.abs(fdy)+1;
	      if (0 < fdx &&
		  stoppable.get(fx+bx0+vx, fy+by0, 
				p.x+bx1, p.y+by1) === 0 &&
		  (grabbable.exists(cb.movev(fp)) ||
		   stoppable.exists(pb.movev(fp)))) {
		// normal fall.
		this.addAction(queue, start, 
			       new PlanAction(new Vec2(fx, fy), null, A.FALL, cost, a0));
	      }
	      if (fdy === 0 ||
		  stoppable.get(fx+bx0, fy+by1, 
				p.x+bx1, p.y+by1) === 0) {
		// fall after jump.
		this.addAction(queue, start, 
			       new PlanAction(new Vec2(fx, fy), A.FALL, A.FALL, cost, a0));
	      }
	    }
	  }
	}

	// try jumping.
	if (context === A.FALL) {
	  for (var jdx = 1; jdx <= this.jumprange.x; jdx++) {
	    // adt: time for ascending.
	    var adt = Math.floor(jdx*tilemap.tilesize/this.speed);
	    // ady: minimal ascend.
	    var ady = Math.floor(this.ascend(adt) / tilemap.tilesize);
	    for (var jdy = ady; jdy <= this.jumprange.y; jdy++) {
	      // (jx,jy): original position.
	      var jx = p.x-vx*jdx;
	      if (jx < range.x || range.right() < jx) break;
	      var jy = p.y+jdy;
	      if (jy < range.y || range.bottom() < jy) break;
	      var jp = new Vec2(jx, jy);
	      //  ....+--+  [vx = +1]
	      //  ....|  |
	      //  ....+-X+ (p.x,p.y) tip point
	      //  .......
	      //  +--+...
	      //  |  |...
	      //  +-X+... (jx,jy) original position.
	      // ######
	      if (stoppable.get(jx+bx0, jy+by1, 
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
	      cost += Math.abs(jdx)+Math.abs(jdy)+1;
	      this.addAction(queue, start, 
			     new PlanAction(new Vec2(jx, jy), null, A.JUMP, cost, a0));
	    }
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
