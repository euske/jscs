// planaction.js

A = {
  NONE: 'NONE',
  WALK: 'WALK',
  FALL: 'FALL',
  JUMP: 'JUMP',
  CLIMB: 'CLIMB',
  MOVETO: 'MOVETO',
};

function getKey(x, y, context)
{
  return (context === null)? (x+","+y) : (x+","+y+":"+context);
}

function PlanAction(p, context, type, cost, next)
{
  context = (context !== undefined)? context : null;
  type = (type !== undefined)? type : A.NONE;
  cost = (cost !== undefined)? cost : 0;
  next = (next !== undefined)? next : null;
  this.p = p;
  this.context = context;
  this.type = type;
  this.cost = cost;
  this.next = next;
  this.key = getKey(p.x, p.y, null);
}

PlanAction.prototype.toString = function ()
{
  return ('<PlanAction('+this.type+'): ('+this.p.x+','+this.p.y+') cost='+this.cost+'>');
};

function PlanActionRunner(plan, actor)
{
  this.plan = plan;
  this.actor = actor;
  var cur = plan.tilemap.coord2map(actor.bounds);
  this.action = plan.getAction(cur.x, cur.y);

  this.moveto = new Slot(this);
  this.jump = new Slot(this);
}

PlanActionRunner.prototype.toString = function ()
{
  return ('<PlanActionRunner: actor='+this.actor+', action='+this.action+'>');
};

PlanActionRunner.prototype.update = function (goal)
{
  if (this.action !== null && this.action.next !== null) {
    var plan = this.plan;
    var actor = this.actor;
    var tilemap = plan.tilemap;
    var valid = plan.isValid(goal);
    var cur = tilemap.coord2map(actor.bounds);
    var dst = this.action.next.p;

    // Get a micro-level (greedy) plan.
    switch (this.action.type) {
    case A.WALK:
    case A.CLIMB:
      var r = tilemap.map2coord(dst);
      this.moveto.signal(r.center());
      if (cur.equals(dst)) {
	this.action = (valid)? this.action.next : null;
      }
      break;
      
    case A.FALL:
      var map = tilemap.getRangeMap(T.isObstacle);
      var path = map.findSimplePath(cur.x, cur.y, dst.x, dst.y, actor.tilebounds);
      for (var i in path) {
	var r = tilemap.map2coord(path[i]);
	var v = new Vec2(r.x-actor.bounds.x, r.y-actor.bounds.y);
	if (actor.isMovable(v)) {
	  this.moveto.signal(r.center());
	  break;
	}
      }
      if (cur.equals(dst)) {
	this.action = (valid)? this.action.next : null;
      }
      break;
      
    case A.JUMP:
      if (actor.isLanded() && !actor.isHolding() &&
	  this.hasClearance(cur.x, dst.y)) {
	this.jump.signal();
	// once you leap, the action is considered finished.
	this.action = (valid)? this.action.next : null;
      } else {
	// not landed, holding something, or has no clearance.
	var r = tilemap.map2coord(cur);
	this.moveto.signal(r.center());
      }
      break;
    }
  }
  return (this.action !== null && this.action.next !== null);
};

PlanActionRunner.prototype.hasClearance = function (x, y)
{
  var r = this.tilemap.coord2getTileRect(x+actor.tilebounds.left, 
					 y+actor.tilebounds.top, 
					 actor.tilebounds.width+1, 
					 actor.tilebounds.height+1);
  var stoppable = this.tilemap.getRangeMap(T.isStoppable);
  return (!stoppable.hasTileByRect(actor.bounds.union(r)));
};
