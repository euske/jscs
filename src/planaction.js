// planaction.js

A = {
  NONE: 'NONE',
  WALK: 'WALK',
  FALL: 'FALL',
  JUMP: 'JUMP',
  CLIMB: 'CLIMB',
  MOVETO: 'MOVETO',
};

function PlanAction(p, context, type, cost, next)
{
  this.p = p;
  this.context = context;
  this.type = type;
  this.cost = cost;
  this.next = next;
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
  if (this.action != null && this.action.next != null) {
    var plan = this.plan;
    var actor = this.actor;
    var tilemap = plan.tilemap;
    var valid = plan.isValid(goal);
    var cur = tilemap.coord2map(actor.bounds);
    var dst = this.action.next.p;
    var p, path;

    // Get a micro-level (greedy) plan.
    switch (this.action.type) {
    case PlanAction.WALK:
    case PlanAction.CLIMB:
      p = tilemap.getTilePoint(dst.x, dst.y);
      this.moveto.signal(p);
      if (cur.equals(dst)) {
	this.action = (valid)? this.action.next : null;
      }
      break;
      
    case PlanAction.FALL:
      var map = tilemap.getRangeMap(Tile.isObstacle);
      path = map.findSimplePath(cur.x, cur.y, dst.x, dst.y, actor.tilebounds);
      for (var i in path) {
	var p = tilemap.getTilePoint(path[i].x, path[i].y);
	if (actor.isMovable(p.x-actor.pos.x, p.y-actor.pos.y)) {
	  this.moveto.signal(p);
	  break;
	}
      }
      if (cur.equals(dst)) {
	this.action = (valid)? this.action.next : null;
      }
      break;
      
    case PlanAction.JUMP:
      if (actor.isLanded() && !actor.isHolding() &&
	  this.hasClearance(cur.x, dst.y)) {
	this.jump.signal();
	// once you leap, the action is considered finished.
	this.action = (valid)? this.action.next : null;
      } else {
	// not landed, holding something, or has no clearance.
	p = tilemap.getTilePoint(cur.x, cur.y);
	this.moveto.signal(p);
      }
      break;
    }
  }
  return (this.action != null && this.action.next != null);
};

PlanActionRunner.prototype.hasClearance = function (x, y)
{
  var r = this.tilemap.coord2getTileRect(x+actor.tilebounds.left, 
					 y+actor.tilebounds.top, 
					 actor.tilebounds.width+1, 
					 actor.tilebounds.height+1);
  var stoppable = this.tilemap.getRangeMap(Tile.isStoppable);
  return (!stoppable.hasTileByRect(actor.bounds.union(r)));
};
