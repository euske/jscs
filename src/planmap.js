// planmap.js

// ascend: calculate the displacement of a falling object.
function ascend(v0, dt, g)
{
  return (v0*dt - (dt-1)*dt*g/2);
}

// predictLandingPoint: returns the estimated landing position.
function predictLandingPoint(
  tilemap, hitbox,
  velocity, gravity, maxdt)
{
  maxdt = (maxdt !== undefined)? maxdt : 20;
  var stoppable = tilemap.getRangeMap(T.isStoppable);
  var rect0 = hitbox;
  for (var dt = 0; dt < maxdt; dt++) {
    var rect1 = hitbox.move(velocity.x*dt, ascend(velocity.y, dt, gravity));
    var b = tilemap.coord2map(rect1);
    if (stoppable.get(b.x, b.y, b.x+b.width, b.y+b.height) != 0) {
      return rect0;
    }
    rect0 = rect1;
  }
  return null;
}

// PlanMap
  // public var tilemap:TileMap;
  // public var goal:Point;      // target position
  // public var range:Rectangle; // search range
  // public var cb:Rectangle;    // character offset and size
  // public var speed:int;       // moving speed while jumping
  // public var jumpspeed:int;   // initial jumping speed
  // public var gravity:int;     // gravity acceleration
function PlanMap(tilemap, goal, range, cb,
		 speed, jumpspeed, gravity)
{
  this.tilemap = tilemap;
  this.goal = goal;
  this.range = range;
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
  return ('<PlanMap '+this.range+'>');
};

PlanMap.prototype.isValid = function (p)
{
  return (p !== null && this.goal.equals(p));
};

PlanMap.prototype.getAction = function (x, y, context)
{
  var k = getKey(x, y, context);
  if (this._map.hasOwnProperty(k)) {
    return this._map[k];
  } else {
    return null;
  }
};

PlanMap.prototype.getAllActions = function ()
{
  var a = [];
  for (var k in this._map) {
    a.push(this._map[k]);
  }
  return a;
};

PlanMap.prototype.addQueue = function (queue, start, a1)
{
  var a0 = this._map[a1.key];
  if (a0 === undefined || a1.cost < a0.cost) {
    this._map[a1.key] = a1;
    var dist = ((start === null)? 0 :
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
  var range = this.range;
  var obstacle = tilemap.getRangeMap(T.isObstacle);
  var stoppable = tilemap.getRangeMap(T.isStoppable);
  var grabbable = tilemap.getRangeMap(T.isGrabbable);
  var cbx0 = this.cb.x, cbx1 = this.cb.right();
  var cby0 = this.cb.y, cby1 = this.cb.bottom();

  if (start !== null &&
      grabbable.get(start.x+cbx0, start.y+cby0,
		    start.y+cbx1, start.y+cby1) == 0 &&
      stoppable.get(start.x+cbx0, start.y+cby1, 
		    start.x+cbx1, start.y+cby1+1) == 0) return false;

  var queue = [];
  this.addQueue(queue, start, new PlanAction(this.goal));
  while (0 < n && 0 < queue.length) {
    var a0 = queue.pop().action;
    var p = a0.p;
    var context = a0.context;
    if (start !== null && start.equals(p)) return true;
    if (obstacle.get(p.x+cbx0, p.y+cby0, 
		     p.x+cbx1, p.y+cby1) != 0) continue;
    if (context === null &&
	grabbable.get(p.x+cbx0, p.y+cby0,
		      p.x+cbx1, p.y+cby1) == 0 &&
	stoppable.get(p.x+cbx0, p.y+cby1, 
		      p.x+cbx1, p.y+cby1+1) == 0) continue;
    // assert(range.x <= p.x && p.x <= range.right());
    // assert(range.y <= p.y && p.y <= range.bottom());
    var cost = a0.cost;

    // try climbing down.
    if (context === null &&
	range.y <= p.y-1 &&
	grabbable.get(p.x+cbx0, p.y+cby1,
		      p.x+cbx1, p.y+cby1+1) != 0) {
      cost += 1;
      this.addQueue(queue, start, 
		    new PlanAction(new Vec2(p.x, p.y-1), null,
				   A.CLIMB, cost, a0));
    }
    // try climbing up.
    if (context === null &&
	p.y+1 <= range.bottom &&
	grabbable.get(p.x+cbx0, p.y+cby0+1,
		      p.x+cbx1, p.y+cby1+1) != 0) {
      cost += 1;
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
      if (context === null &&
	  range.x <= wx && wx <= range.right() &&
	  obstacle.get(wx+cbx0, p.y+cby0,
		       wx+cbx1, p.y+cby1) == 0 &&
	  (grabbable.get(wx+cbx0, p.y+cby0,
			 wx+cbx1, p.y+cby1) != 0 ||
	   stoppable.get(wx+cbx0, p.y+cby1,
			 wx+cbx1, p.y+cby1+1) != 0)) {
	cost += 1;
	this.addQueue(queue, start, 
		      new PlanAction(new Vec2(wx, p.y), null,
				     A.WALK, cost, a0));
      }

      // try falling.
      if (context === null) {
	for (var fdx = 0; fdx <= falldx; fdx++) {
	  var fx = p.x-vx*fdx;
	  if (fx < range.x || range.right() < fx) break;
	  // fdt: time for falling.
	  var fdt = Math.floor(tilemap.tilesize*fdx/this.speed);
	  // fdy: amount of falling.
	  var fdy = Math.ceil(-ascend(0, fdt, this.gravity) / tilemap.tilesize);
	  for (; fdy <= falldy; fdy++) {
	    var fy = p.y-fdy;
	    if (fy < range.y || range.bottom() < fy) break;
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
	    cost += Math.abs(fdx)+Math.abs(fdy)+1;
	    if (0 < fdx &&
		stoppable.get(fx+bx0+vx, fy+cby0, 
			      p.x+bx1, p.y+cby1) == 0 &&
		(grabbable.get(fx+cbx0, fy+cby0, 
			       fx+cbx1, fy+cby1) != 0 ||
		 stoppable.get(fx+cbx0, fy+cby1, 
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
      if (context === A.FALL) {
	for (var jdx = 1; jdx <= this._madx; jdx++) {
	  // adt: time for ascending.
	  var adt = Math.floor(jdx*tilemap.tilesize/this.speed);
	  // ady: minimal ascend.
	  var ady = Math.floor(ascend(this.jumpspeed, adt, this.gravity) / tilemap.tilesize);
	  for (var jdy = ady; jdy <= this._mady; jdy++) {
	    // (jx,jy): original position.
	    var jx = p.x-vx*jdx;
	    if (jx < range.x || range.right() < jx) break;
	    var jy = p.y+jdy;
	    if (jy < range.y || range.bottom() < jy) break;
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
		stoppable.get(jx+cbx0, jy+cby1, 
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
	    cost += Math.abs(jdx)+Math.abs(jdy)+1;
	    this.addQueue(queue, start, 
			  new PlanAction(new Vec2(jx, jy), null,
					 A.JUMP, cost, a0));
	  }
	}
      }
    }
    if (start !== null) {
      // A* search.
      queue.sort(function (a,b) { return b.prio-a.prio; });
    }
    n--;
  }
  
  return false;
};

PlanMap.prototype.render = function (ctx, bx, by, tilesize)
{
  ctx.lineWidth = 1;
  for (var k in this._map) {
    var a = this._map[k];
    var p = a.p;
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
    ctx.strokeRect(bx+tilesize*p.x, by+tilesize*p.y,
		   tilesize, tilesize);
  }
};
