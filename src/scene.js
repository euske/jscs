// scene.js
// Scene object takes care of every in-game object and the scrollable map.

function Scene(game, tilesize, window)
{
  this.game = game;
  this.tilesize = tilesize;
  this.window = window;
  this.width = window.width;
  this.height = window.height;
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
  this.window.x = clamp(0, this.window.x, this.width-this.window.width);
  this.window.y = clamp(0, this.window.y, this.height-this.window.height);
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

Scene.prototype.moveObjects = function (objs)
{
  var removed = [];
  for (var i = 0; i < objs.length; i++) {
    var obj = objs[i];
    if (obj.scene == null) {
      obj.start(this);
    }
    obj.idle();
    if (!obj.alive) {
      removed.push(obj);
    }
  }
  removeArray(objs, removed);
}

Scene.prototype.idle = function ()
{
  // OVERRIDE
  this.moveObjects(this.tasks);
  this.moveObjects(this.actors);
  this.moveObjects(this.particles);
  this.ticks++;
};

Scene.prototype.repaint = function (ctx, bx, by)
{
  // OVERRIDE

  // Fill with the background color.
  ctx.fillStyle = 'rgb(0,0,128)';
  ctx.fillRect(bx, by, this.window.width, this.window.height);
  
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

Scene.prototype.init = function ()
{
  // OVERRIDE
  // GAME SPECIFIC CODE HERE
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
  
  this.tilemap = new TileMap(this.tilesize, map);
  this.width = this.tilemap.width * this.tilesize;
  this.height = this.tilemap.height * this.tilesize;
  this.tasks = [];
  this.actors = [];
  this.particles = [];
  this.ticks = 0;

  var scene = this;
  var tilemap = this.tilemap;
  var f = function (x,y) {
    if (Tile.isCollectible(tilemap.get(x,y))) {
      var rect = tilemap.map2coord(new Point(x,y));
      scene.addActor(new StaticActor(rect, Sprite.COLLECTIBLE));
      tilemap.set(x, y, Tile.NONE);
    }
  };
  this.tilemap.apply(null, f);
};
