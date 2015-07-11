// planmap.js

function ascend(v0, dt, g)
{
  return (v0*dt - (dt-1)*dt*g/2);
}

function getLandingPoint(
  tilemap, pos, cb, 
  velocity, gravity, maxdt)
{
  var stoppable = tilemap.getRangeMap(Tile.isStoppable);
  var y0 = Math.floor(pos.y / tilemap.tilesize);
  for (var dt = 0; dt < maxdt; dt++) {
    var x = Math.floor((pos.x+velocity.x*dt) / tilemap.tilesize);
    if (x < 0 || tilemap.width <= x) continue;
    var y1 = Math.ceil((pos.y - ascend(0, dt, gravity)) / tilemap.tilesize);
    for (var y = y0; y <= y1; y++) {
      if (y < 0 || tilemap.height <= y) continue;
      if (stoppable.hasTile(x+cb.left, y+cb.bottom, 
			    x+cb.right, y+cb.bottom)) return null;
      if (stoppable.hasTile(x+cb.left, y+cb.bottom+1, 
			    x+cb.right, y+cb.bottom+1)) {
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
  return ('<PlanMap ('+bounds.left+','+bounds.top+')-('+
	  bounds.right+','+bounds.bottom+')>');
};

PlanMap.prototype.isValid = function (p)
{
  return (p != null && goal.equals(p));
};

PlanMap.prototype.getAction = function (x, y, context)
{
  return _map[PlanAction.getKey(x, y, context)];
};

PlanMap.prototype.getAllActions = function ()
{
  var a = [];
  for (var k in _map) {
    a.push(_map[k]);
  }
  return a;
};

PlanMap.prototype.addQueue = function (queue, start, a1)
{
  var a0 = _map[a1.key];
  if (a0 == null || a1.cost < a0.cost) {
    _map[a1.key] = a1;
    var dist = ((start == null)? 0 :
		Math.abs(start.x-a1.p.x)+Math.abs(start.y-a1.p.y));
    queue.push({ action:a1, prio:dist });
  }
};

PlanMap.prototype.fillPlan = function (start, n, falldx, falldy)
{
  var obstacle = tilemap.getRangeMap(Tile.isObstacle);
  var stoppable = tilemap.getRangeMap(Tile.isStoppable);
  var grabbable = tilemap.getRangeMap(Tile.isGrabbable);

  if (start != null &&
      !grabbable.hasTile(start.x+cb.left, start.y+cb.top,
			 start.y+cb.right, start.y+cb.bottom) &&
      !stoppable.hasTile(start.x+cb.left, start.y+cb.bottom+1, 
			 start.x+cb.right, start.y+cb.bottom+1)) return false;
  
  var queue = [];
  addQueue(queue, start, new PlanAction(goal));
  while (0 < n && 0 < queue.length) {
    var cost;
    var q = queue.pop();
    var a0 = q.action;
    var p = a0.p;
    var context = a0.context;
    if (start != null && start.equals(p)) return true;
    if (obstacle.hasTile(p.x+cb.left, p.y+cb.top, 
			 p.x+cb.right, p.y+cb.bottom)) continue;
    if (context == null &&
	!grabbable.hasTile(p.x+cb.left, p.y+cb.top,
			   p.x+cb.right, p.y+cb.bottom) &&
	!stoppable.hasTile(p.x+cb.left, p.y+cb.bottom+1, 
			   p.x+cb.right, p.y+cb.bottom+1)) continue;
    // assert(bounds.left <= p.x && p.x <= bounds.right);
    // assert(bounds.top <= p.y && p.y <= bounds.bottom);

    // try climbing down.
    if (context == null &&
	bounds.top <= p.y-1 &&
	grabbable.hasTile(p.x+cb.left, p.y+cb.bottom,
			  p.x+cb.right, p.y+cb.bottom)) {
      cost = a0.cost+1;
      addQueue(queue, start, 
	       new PlanAction(new Vec2(p.x, p.y-1), null,
			      PlanAction.CLIMB, cost, a0));
    }
    // try climbing up.
    if (context == null &&
	p.y+1 <= bounds.bottom &&
	grabbable.hasTile(p.x+cb.left, p.y+cb.top+1,
			  p.x+cb.right, p.y+cb.bottom+1)) {
      cost = a0.cost+1;
      addQueue(queue, start, 
	       new PlanAction(new Vec2(p.x, p.y+1), null,
			      PlanAction.CLIMB, cost, a0));
    }

    // for left and right.
    for (var vx = -1; vx <= +1; vx += 2) {
      var bx0 = (0 < vx)? cb.left : cb.right;
      var bx1 = (0 < vx)? cb.right : cb.left;

      // try walking.
      var wx = p.x-vx;
      if (context == null &&
	  bounds.left <= wx && wx <= bounds.right &&
	  !obstacle.hasTile(wx+cb.left, p.y+cb.top,
			    wx+cb.right, p.y+cb.bottom) &&
	  (grabbable.hasTile(wx+cb.left, p.y+cb.top,
			     wx+cb.right, p.y+cb.bottom) ||
	   stoppable.hasTile(wx+cb.left, p.y+cb.bottom+1,
			     wx+cb.right, p.y+cb.bottom+1))) {
	cost = a0.cost+1;
	addQueue(queue, start, 
		 new PlanAction(new Vec2(wx, p.y), null,
				PlanAction.WALK, cost, a0));
      }

      // try falling.
      if (context == null) {
	for (var fdx = 0; fdx <= falldx; fdx++) {
	  var fx = p.x-vx*fdx;
	  if (fx < bounds.left || bounds.right < fx) break;
	  // fdt: time for falling.
	  var fdt = Math.floor(tilemap.tilesize*fdx/speed);
	  // fdy: amount of falling.
	  var fdy = Math.ceil(-ascend(0, fdt, gravity) / tilemap.tilesize);
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
	    if (obstacle.hasTile(fx+cb.left, fy+cb.top,
				 fx+cb.right, fy+cb.bottom)) continue;
	    cost = a0.cost+Math.abs(fdx)+Math.abs(fdy)+1;
	    if (0 < fdx &&
		!stoppable.hasTile(fx+bx0+vx, fy+cb.top, 
				   p.x+bx1, p.y+cb.bottom) &&
		(grabbable.hasTile(fx+cb.left, fy+cb.top, 
				   fx+cb.right, fy+cb.bottom) ||
		 stoppable.hasTile(fx+cb.left, fy+cb.bottom+1, 
				   fx+cb.right, fy+cb.bottom+1))) {
	      // normal fall.
	      addQueue(queue, start, 
		       new PlanAction(new Vec2(fx, fy), null,
				      PlanAction.FALL, cost, a0));
	    }
	    if (fdy == 0 ||
		!stoppable.hasTile(fx+bx0, fy+cb.bottom, 
				   p.x+bx1, p.y+cb.bottom)) {
	      // fall after jump.
	      addQueue(queue, start, 
		       new PlanAction(new Vec2(fx, fy), PlanAction.FALL,
				      PlanAction.FALL, cost, a0));
	    }
	  }
	}
      }

      // try jumping.
      if (context == PlanAction.FALL) {
	for (var jdx = 1; jdx <= _madx; jdx++) {
	  // adt: time for ascending.
	  var adt = Math.floor(jdx*tilemap.tilesize/speed);
	  // ady: minimal ascend.
	  var ady = Math.floor(ascend(jumpspeed, adt, gravity) / tilemap.tilesize);
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
	    if (stoppable.hasTile(jx+bx0, jy+cb.bottom, 
				  p.x+bx1-vx, p.y+cb.top)) break;
	    if (!grabbable.hasTile(jx+cb.left, jy+cb.top, 
				   jx+cb.right, jy+cb.bottom) &&
		!stoppable.hasTile(jx+cb.left, jy+cb.bottom+1, 
				   jx+cb.right, jy+cb.bottom+1)) continue;
	    // extra care is needed not to allow the following case:
	    //      .#
	    //    +--+
	    //    |  |  (this is impossible!)
	    //    +-X+
	    //       #
	    if (tilemap.isTile(p.x+bx1, p.y+cb.top-1, Tile.isObstacle) &&
		tilemap.isTile(p.x+bx1, p.y+cb.bottom+1, Tile.isObstacle) &&
		!tilemap.isTile(p.x+bx1-vx, p.y+cb.top-1, Tile.isObstacle)) continue;
	    cost = a0.cost+Math.abs(jdx)+Math.abs(jdy)+1;
	    addQueue(queue, start, 
		     new PlanAction(new Vec2(jx, jy), null,
				    PlanAction.JUMP, cost, a0));
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
