// scene.js
// Scene object takes care of every in-game object and the scrollable map.

function Scene(game, tilesize)
{
  this.game = game;
  this.tilesize = tilesize;
  this.window = new Rectangle(0, 0, game.screen.width, game.screen.height);
  this.world = new Rectangle(0, 0, game.screen.width, game.screen.height);
}

Scene.prototype.addTask = function (task)
{
  this.tasks.push(task);
};

Scene.prototype.removeTask = function (task)
{
  removeArray(this.tasks, task);
};

Scene.prototype.addActor = function (actor)
{
  this.actors.push(actor);
  this.actors.sort(function (a,b) { return (b.layer-a.layer); });
};

Scene.prototype.removeActor = function (actor)
{
  removeArray(this.actors, actor);
};

Scene.prototype.addParticle = function (particle)
{
  this.particles.push(particle);
};

Scene.prototype.removeParticle = function (particle)
{
  removeArray(this.particles, particle);
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
  this.window.x = clamp(0, this.window.x, this.world.width-this.window.width);
  this.window.y = clamp(0, this.window.y, this.world.height-this.window.height);
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
  // [OVERRIDE]
  this.moveObjects(this.tasks);
  this.moveObjects(this.actors);
  this.moveObjects(this.particles);
  this.ticks++;
};

Scene.prototype.render = function (ctx, bx, by)
{
  // [OVERRIDE]

  // Fill with the background color.
  ctx.fillStyle = 'rgb(0,0,128)';
  ctx.fillRect(bx, by, this.window.width, this.window.height);

  var x0 = Math.floor(this.window.x/this.tilesize);
  var y0 = Math.floor(this.window.y/this.tilesize);
  var x1 = Math.ceil((this.window.x+this.window.width)/this.tilesize);
  var y1 = Math.ceil((this.window.y+this.window.height)/this.tilesize);
  var fx = x0*this.tilesize-this.window.x;
  var fy = y0*this.tilesize-this.window.y;

  // Define the depth function.
  //     (x0,y0) -- (x1,y0) fd+
  //        |          |
  // fd- (x0,y1) -- (x1,y1)
  var fd = function (x,y) { return (x-x0)+(y1-y); }

  // Set the drawing order.
  var n = fd(x1,y0)+1;
  var depth = new Array(n);
  for (var i = 0; i < n; i++) {
    depth[i] = new Array();
  }
  function add(d, actor, x, y) {
    depth[d].push(function () { actor.render(ctx, x, y); });
  }
  for (var i = 0; i < this.actors.length; i++) {
    var actor = this.actors[i];
    if (actor.scene != this) continue;
    var b = actor.bounds;
    if (this.window.overlap(b)) {
      var dx = Math.floor((b.x+b.width/2)/this.tilesize);
      var dy = Math.floor((b.y+b.height/2)/this.tilesize);
      var d = fd(dx, dy);
      if (0 <= d && d < n) {
	add(d, actor, bx+b.x-this.window.x, by+b.y-this.window.y);
      }
    }
  }

  // Draw the tilemap.
  var tilemap = this.tilemap;
  var ft = function (x,y) {
    var c = tilemap.get(x,y);
    return (c == Tile.NONE? -1 : c);
  };
  tilemap.render(ctx,
		 this.game.tiles, ft,
		 depth, fd, 
		 bx+fx, by+fy,
		 x0, y0, x1-x0+1, y1-y0+1);

  // Draw the particles.
  for (var i = 0; i < this.particles.length; i++) {
    var particle = this.particles[i];
    if (particle.scene != this) continue;
    particle.render(ctx,
		    bx-this.window.x+particle.bounds.x,
		    by-this.window.y+particle.bounds.y);
  }

};

Scene.prototype.init = function ()
{
  // [OVERRIDE]
  // [GAME SPECIFIC CODE]
  var map = copyArray([
    [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
    [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
    [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
    [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
    [0,0,0,0, 0,0,0,0, 0,0,0,0, 2,2,0,0, 0,0,0,0],
    
    [0,0,0,0, 0,0,0,0, 0,0,0,0, 1,1,0,0, 0,0,0,0],
    [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
    [0,0,0,0, 0,0,0,0, 0,0,2,1, 0,0,0,0, 0,2,2,0],
    [0,0,0,0, 0,0,0,0, 1,1,1,1, 0,0,0,0, 0,0,0,0],
    [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
    
    [0,0,1,1, 1,1,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
    [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
    [0,0,0,0, 0,0,0,0, 1,1,0,0, 0,0,0,0, 1,1,0,0],
    [0,0,0,0, 1,0,0,0, 0,0,2,0, 0,2,0,0, 0,0,0,0],
    [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1],
  ]);
  
  this.tilemap = new TileMap(this.tilesize, map);
  this.world.width = this.tilemap.width * this.tilesize;
  this.world.height = this.tilemap.height * this.tilesize;
  this.window.width = Math.min(this.world.width, this.window.width);
  this.window.height = Math.min(this.world.height, this.window.height);
  this.tasks = [];
  this.actors = [];
  this.particles = [];
  this.ticks = 0;

  var scene = this;
  var tilemap = this.tilemap;
  var f = function (x,y) {
    if (Tile.isCollectible(tilemap.get(x,y))) {
      var rect = tilemap.map2coord(new Point(x,y));
      scene.addActor(new Actor(rect, Sprite.COLLECTIBLE));
      tilemap.set(x, y, Tile.NONE);
    }
  };
  this.tilemap.apply(null, f);
};
