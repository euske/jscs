// planmap.js

// ascend: calculate the displacement of a falling object.
function ascend(v0, dt, g)
{
  return (v0*dt - (dt-1)*dt*g/2);
}

// predictLandingPoint: compute the landing position.
function predictLandingPoint(
  tilemap, pos, cb, 
  velocity, gravity, maxdt)
{
  maxdt = (maxdt !== undefined)? maxdt : 20;
  var stoppable = tilemap.getRangeMap(T.isStoppable);
  var y0 = Math.floor(pos.y / tilemap.tilesize);
  for (var dt = 0; dt < maxdt; dt++) {
    var x = Math.floor((pos.x+velocity.x*dt) / tilemap.tilesize);
    if (x < 0 || tilemap.width <= x) continue;
    var x0 = x+cb.x;
    var x1 = x+cb.x+cb.width;
    var y1 = Math.ceil((pos.y - ascend(0, dt, gravity)) / tilemap.tilesize);
    for (var y = y0; y <= y1; y++) {
      if (y < 0 || tilemap.height <= y) continue;
      var yb = y+cb.y+cb.height;
      if (stoppable.get(x0, yb, x1, yb+1) != 0) return null;
      if (stoppable.get(x0, yb+1, x1, yb+2) != 0) {
	return new Vec2(x, y);
      }
    }
    y0 = y1;
  }
  return null;
}

// PlanMap
  // public var tilemap:TileMap;
  // public var goal:Point;
  // public var bounds:Rectangle;
  // public var cb:Rectangle;
  // public var speed:int;
  // public var jumpspeed:int;
  // public var gravity:int;
  // private var _map:Object;
  // private var _madx:int;
  // private var _mady:int;
function PlanMap(tilemap, goal, bounds, cb,
		 speed, jumpspeed, gravity)
{
  this.tilemap = tilemap;
  this.goal = goal;
  this.bounds = bounds;
  this.cb = cb;
  this.speed = speed;
  this.jumpspeed = jumpspeed;
  this.gravity = gravity;
  
  this._map = {}
  // madt: maximum amount of time for ascending.
  var madt = Math.floor(jumpspeed / gravity);
  // madx: maximum horizontal distance while ascending.
  this._madx = Math.floor(madt*speed / tilemap.tilesize);
  // mady: maximum vertical distance while ascending.
  this._mady = Math.floor(ascend(jumpspeed, madt, gravity) / tilemap.tilesize);
}

PlanMap.prototype.toString = function ()
{
  return ('<PlanMap '+this.bounds+'>');
};

PlanMap.prototype.isValid = function (p)
{
  return (p != null && this.goal.equals(p));
};

PlanMap.prototype.getAction = function (x, y, context)
{
  return this._map[getKey(x, y, context)];
};

PlanMap.prototype.getAllActions = function ()
{
  var a = [];
  for (var k in _map) {
    a.push(this._map[k]);
  }
  return a;
};

PlanMap.prototype.addQueue = function (queue, start, a1)
{
  var a0 = this._map[a1.key];
  if (a0 == null || a1.cost < a0.cost) {
    this._map[a1.key] = a1;
    var dist = ((start == null)? 0 :
		Math.abs(start.x-a1.p.x)+Math.abs(start.y-a1.p.y));
    queue.push({ action:a1, prio:dist });
  }
};

PlanMap.prototype.fillPlan = function (start, n, falldx, falldy)
{
  n = (n !== undefined)? n : 1000;
  falldx = (falldx !== undefined)? falldx : 10;
  falldy = (falldy !== undefined)? falldy : 20;
  
  var tilemap = this.tilemap;
  var obstacle = tilemap.getRangeMap(T.isObstacle);
  var stoppable = tilemap.getRangeMap(T.isStoppable);
  var grabbable = tilemap.getRangeMap(T.isGrabbable);
  var cbx0 = this.cb.x, cbx1 = this.cb.right();
  var cby0 = this.cb.y, cby1 = this.cb.bottom();

  if (start != null &&
      grabbable.get(start.x+cbx0, start.y+cby0,
		    start.y+cbx1, start.y+cby1) == 0 &&
      stoppable.get(start.x+cbx0, start.y+cby1+1, 
		    start.x+cbx1, start.y+cby1+1) == 0) return false;
  
  var queue = [];
  this.addQueue(queue, start, new PlanAction(this.goal));
  while (0 < n && 0 < queue.length) {
    var cost;
    var q = queue.pop();
    var a0 = q.action;
    var p = a0.p;
    var context = a0.context;
    if (start != null && start.equals(p)) return true;
    if (obstacle.get(p.x+cbx0, p.y+cby0, 
		     p.x+cbx1, p.y+cby1) != 0) continue;
    if (context == null &&
	grabbable.get(p.x+cbx0, p.y+cby0,
		      p.x+cbx1, p.y+cby1) == 0 &&
	stoppable.get(p.x+cbx0, p.y+cby1+1, 
		      p.x+cbx1, p.y+cby1+1) == 0) continue;
    // assert(bounds.left <= p.x && p.x <= bounds.right);
    // assert(bounds.top <= p.y && p.y <= bounds.bottom);

    // try climbing down.
    if (context == null &&
	bounds.top <= p.y-1 &&
	grabbable.get(p.x+cbx0, p.y+cby1,
		      p.x+cbx1, p.y+cby1) != 0) {
      cost = a0.cost+1;
      this.addQueue(queue, start, 
		    new PlanAction(new Vec2(p.x, p.y-1), null,
				   A.CLIMB, cost, a0));
    }
    // try climbing up.
    if (context == null &&
	p.y+1 <= bounds.bottom &&
	grabbable.get(p.x+cbx0, p.y+cby0+1,
		      p.x+cbx1, p.y+cby1+1) != 0) {
      cost = a0.cost+1;
      this.addQueue(queue, start, 
		    new PlanAction(new Vec2(p.x, p.y+1), null,
				   A.CLIMB, cost, a0));
    }

    // for left and right.
    for (var vx = -1; vx <= +1; vx += 2) {
      var bx0 = (0 < vx)? cbx0 : cbx1;
      var bx1 = (0 < vx)? cbx1 : cbx0;

      // try walking.
      var wx = p.x-vx;
      if (context == null &&
	  bounds.left <= wx && wx <= bounds.right &&
	  obstacle.get(wx+cbx0, p.y+cby0,
		       wx+cbx1, p.y+cby1) == 0 &&
	  (grabbable.get(wx+cbx0, p.y+cby0,
			 wx+cbx1, p.y+cby1) != 0 ||
	   stoppable.get(wx+cbx0, p.y+cby1+1,
			 wx+cbx1, p.y+cby1+1) != 0)) {
	cost = a0.cost+1;
	this.addQueue(queue, start, 
		      new PlanAction(new Vec2(wx, p.y), null,
				     A.WALK, cost, a0));
      }

      // try falling.
      if (context == null) {
	for (var fdx = 0; fdx <= falldx; fdx++) {
	  var fx = p.x-vx*fdx;
	  if (fx < bounds.left || bounds.right < fx) break;
	  // fdt: time for falling.
	  var fdt = Math.floor(tilemap.tilesize*fdx/this.speed);
	  // fdy: amount of falling.
	  var fdy = Math.ceil(-ascend(0, fdt, this.gravity) / tilemap.tilesize);
	  for (; fdy <= falldy; fdy++) {
	    var fy = p.y-fdy;
	    if (fy < bounds.top || bounds.bottom < fy) break;
	    //  +--+....  [vx = +1]
	    //  |  |....
	    //  +-X+.... (fx,fy) original position.
	    // ##.......
	    //   ...+--+
	    //   ...|  |
	    //   ...+-X+ (p.x,p.y)
	    //     ######
	    if (obstacle.get(fx+cbx0, fy+cby0,
			     fx+cbx1, fy+cby1) != 0) continue;
	    cost = a0.cost+Math.abs(fdx)+Math.abs(fdy)+1;
	    if (0 < fdx &&
		stoppable.get(fx+bx0+vx, fy+cby0, 
			      p.x+bx1, p.y+cby1) == 0 &&
		(grabbable.get(fx+cbx0, fy+cby0, 
			       fx+cbx1, fy+cby1) != 0 ||
		 stoppable.get(fx+cbx0, fy+cby1+1, 
			       fx+cbx1, fy+cby1+1) != 0)) {
	      // normal fall.
	      this.addQueue(queue, start, 
			    new PlanAction(new Vec2(fx, fy), null,
					   A.FALL, cost, a0));
	    }
	    if (fdy == 0 ||
		stoppable.get(fx+bx0, fy+cby1, 
			      p.x+bx1, p.y+cby1) == 0) {
	      // fall after jump.
	      this.addQueue(queue, start, 
			    new PlanAction(new Vec2(fx, fy), A.FALL,
					   A.FALL, cost, a0));
	    }
	  }
	}
      }

      // try jumping.
      if (context == A.FALL) {
	for (var jdx = 1; jdx <= _madx; jdx++) {
	  // adt: time for ascending.
	  var adt = Math.floor(jdx*tilemap.tilesize/this.speed);
	  // ady: minimal ascend.
	  var ady = Math.floor(ascend(this.jumpspeed, adt, this.gravity) / tilemap.tilesize);
	  for (var jdy = ady; jdy <= _mady; jdy++) {
	    // (jx,jy): original position.
	    var jx = p.x-vx*jdx;
	    if (jx < bounds.left || bounds.right < jx) break;
	    var jy = p.y+jdy;
	    if (jy < bounds.top || bounds.bottom < jy) break;
	    //  ....+--+  [vx = +1]
	    //  ....|  |
	    //  ....+-X+ (p.x,p.y) tip point
	    //  .......
	    //  +--+...
	    //  |  |...
	    //  +-X+... (jx,jy) original position.
	    // ######
	    if (stoppable.get(jx+bx0, jy+cby1, 
			      p.x+bx1-vx, p.y+cby0) != 0) break;
	    if (grabbable.get(jx+cbx0, jy+cby0, 
			      jx+cbx1, jy+cby1) == 0 &&
		stoppable.get(jx+cbx0, jy+cby1+1, 
			      jx+cbx1, jy+cby1+1) == 0) continue;
	    // extra care is needed not to allow the following case:
	    //      .#
	    //    +--+
	    //    |  |  (this is impossible!)
	    //    +-X+
	    //       #
	    if (T.isObstacle(tilemap.get(p.x+bx1, p.y+cby0-1)) &&
		T.isObstacle(tilemap.get(p.x+bx1, p.y+cby1+1)) &&
		!T.isObstacle(tilemap.get(p.x+bx1-vx, p.y+cby0-1))) continue;
	    cost = a0.cost+Math.abs(jdx)+Math.abs(jdy)+1;
	    this.addQueue(queue, start, 
			  new PlanAction(new Vec2(jx, jy), null,
					 A.JUMP, cost, a0));
	  }
	}
      }
    }
    if (start != null) {
      // A* search.
      queue.sort(function (a,b) { return b.prio-a.prio; });
    }
    n--;
  }

  return false;
};

PlanMap.prototype.render = function (ctx, x, y)
{
};
