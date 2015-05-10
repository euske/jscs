// scene.js
// Scene object takes care of every in-game object and the scrollable map.

function Scene(game, tilesize, window)
{
  var map = copyArray([
    [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
    [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
    [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
    [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
    [0,0,0,0, 0,0,0,0, 0,0,0,0, 2,2,0,0, 0,0,0,0],
    
    [0,0,0,0, 0,0,0,0, 0,0,0,0, 1,1,0,0, 0,0,0,0],
    [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
    [0,0,0,0, 0,0,0,0, 0,0,2,0, 0,0,0,0, 0,2,2,0],
    [0,0,0,0, 0,0,0,0, 1,1,1,1, 0,0,0,0, 0,0,0,0],
    [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
    
    [0,0,1,1, 1,1,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
    [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
    [0,0,0,0, 0,0,0,0, 1,1,0,0, 0,0,0,0, 1,1,0,0],
    [0,0,0,0, 0,0,0,0, 0,0,2,0, 0,2,0,0, 0,0,0,0],
    [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1],
  ]);
  
  this.game = game;
  this.tilesize = tilesize;
  this.window = window;
  this.tilemap = new TileMap(tilesize, map);
  this.mapWidth = this.tilemap.width * tilesize;
  this.mapHeight = this.tilemap.height * tilesize;
  this.tasks = [];
  this.actors = [];
  this.particles = [];
  this.ticks = 0;
}

Scene.prototype.addTask = function (task)
{
  this.tasks.push(task);
};

Scene.prototype.removeTask = function (task)
{
  var i = this.tasks.indexOf(task);
  if (0 <= i) {
    this.tasks.splice(i, 1);
  }
};

Scene.prototype.addActor = function (actor)
{
  this.actors.push(actor);
  this.actors.sort(function (a,b) { return (b.layer-a.layer); });
};

Scene.prototype.removeActor = function (actor)
{
  var i = this.actors.indexOf(actor);
  if (0 <= i) {
    this.actors.splice(i, 1);
  }
};

Scene.prototype.addParticle = function (particle)
{
  this.particles.push(particle);
};

Scene.prototype.removeParticle = function (particle)
{
  var i = this.particles.indexOf(particle);
  if (0 <= i) {
    this.particles.splice(i, 1);
  }
};

Scene.prototype.setCenter = function (rect)
{
  if (this.window.width < rect.width) {
    this.window.x = (rect.width-this.window.width)/2;
  } else if (rect.x < this.window.x) {
    this.window.x = rect.x;
  } else if (this.window.x+this.window.width < rect.x+rect.width) {
    this.window.x = rect.x+rect.width - this.window.width;
  }
  if (this.window.height < rect.height) {
    this.window.y = (rect.height-this.window.height)/2;
  } else if (rect.y < this.window.y) {
    this.window.y = rect.y;
  } else if (this.window.y+this.window.height < rect.y+rect.height) {
    this.window.y = rect.y+rect.height - this.window.height;
  }
  this.window.x = clamp(0, this.window.x, this.mapWidth-this.window.width);
  this.window.y = clamp(0, this.window.y, this.mapHeight-this.window.height);
};

Scene.prototype.idle = function ()
{
  var removed;

  removed = [];
  for (var i = 0; i < this.tasks.length; i++) {
    var task = this.tasks[i];
    if (task.scene == null) {
      task.start(this);
    }
    task.idle();
    if (!task.alive) {
      removed.push(task);
    }
  }
  removeArray(this.tasks, removed);
  
  removed = [];
  for (var i = 0; i < this.actors.length; i++) {
    var actor = this.actors[i];
    if (actor.scene == null) {
      actor.start(this);
    }
    actor.idle();
    if (!actor.alive) {
      removed.push(actor);
    }
  }
  removeArray(this.actors, removed);
  
  removed = [];
  for (var i = 0; i < this.particles.length; i++) {
    var particle = this.particles[i];
    if (particle.scene == null) {
      particle.start(this);
    }
    particle.idle();
    if (!particle.alive) {
      removed.push(particle);
    }
  }
  removeArray(this.particles, removed);

  this.ticks++;
};

Scene.prototype.repaint = function (ctx, bx, by)
{
  ctx.fillStyle = 'rgb(0,0,128)';
  ctx.fillRect(0, 0, this.window.width, this.window.height);
  
  var x0 = Math.floor(this.window.x/this.tilesize);
  var y0 = Math.floor(this.window.y/this.tilesize);
  var x1 = Math.ceil((this.window.x+this.window.width)/this.tilesize);
  var y1 = Math.ceil((this.window.y+this.window.height)/this.tilesize);
  var fx = x0*this.tilesize-this.window.x;
  var fy = y0*this.tilesize-this.window.y;
  var nrows = y1-y0;
  
  var actors = new Array(nrows);
  for (var dy = 0; dy < nrows; dy++) {
    actors[dy] = []
  }
  for (var i = 0; i < this.actors.length; i++) {
    var actor = this.actors[i];
    if (actor.scene != this) continue;
    var b = actor.bounds;
    if (this.window.x < b.x+b.width &&
	b.x < this.window.x+this.window.width) {
      var dy = Math.floor((b.y+b.height/2-this.window.y)/this.tilesize);
      if (0 <= dy && dy < nrows) {
	actors[dy].push(actor);
      }
    }
  }

  var tilemap = this.tilemap;
  var f = function (x,y) {
    var c = tilemap.get(x,y);
    return (c == Tile.NONE? -1 : c);
  };
  for (var dy = 0; dy < nrows; dy++) {
    tilemap.render(ctx,
		   this.game.images.tiles, f,
		   bx+fx, by+fy+dy*this.tilesize,
		   x0, y0+dy, x1-x0+1, 1);
    var row = actors[dy];
    for (var i = 0; i < row.length; i++) {
      var actor = row[i];
      actor.repaint(ctx,
		    bx-this.window.x+actor.bounds.x,
		    by-this.window.y+actor.bounds.y);
    }
  }

  for (var i = 0; i < this.particles.length; i++) {
    var particle = this.particles[i];
    if (particle.scene != this) continue;
    particle.repaint(ctx,
		     bx-this.window.x+particle.bounds.x,
		     by-this.window.y+particle.bounds.y);
  }

};

Scene.prototype.collide = function (actor0)
{
  var a = []
  if (actor0.scene == this && actor0.hitbox != null) {
    for (var i = 0; i < this.actors.length; i++) {
      var actor1 = this.actors[i];
      if (actor1.scene == this && actor1.hitbox != null &&
	  actor1 !== actor0 && actor1.hitbox.overlap(actor0.hitbox)) {
	a.push(actor1);
      }
    }
  }
  return a;
};

Scene.prototype.init = function ()
{
  var scene = this;
  var tilemap = this.tilemap;
  var f = function (x,y) {
    if (Tile.isCollectible(tilemap.get(x,y))) {
      var rect = tilemap.map2coord(new Point(x,y));
      scene.addActor(new Collectible(rect));
      tilemap.set(x, y, Tile.NONE);
    }
  };
  tilemap.apply(null, f);
};
