// scene.js
// Scene object takes care of every in-game object and the scrollable map.

function Scene(game)
{
  this.tilesize = 32;
  this.game = game;
  this.window = new Rectangle(0, 0, game.screen.width, game.screen.height);
  this.world = new Rectangle(0, 0, game.screen.width, game.screen.height);

  this.changed = new Slot(this);
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
  var a = [];
  if (actor0.alive && actor0.scene == this && actor0.hitbox != null) {
    for (var i = 0; i < this.actors.length; i++) {
      var actor1 = this.actors[i];
      if (actor1.alive && actor1.scene == this && actor1.hitbox != null &&
	  actor1 !== actor0 && actor1.hitbox.overlap(actor0.hitbox)) {
	a.push(actor1);
      }
    }
  }
  return a;
};

Scene.prototype.moveObjects = function (objs)
{
  for (var i = 0; i < objs.length; i++) {
    var obj = objs[i];
    if (obj.scene == null) {
      obj.start(this);
    }
    obj.idle();
  }
}

Scene.prototype.cleanObjects = function (objs)
{
  var removed = [];
  for (var i = 0; i < objs.length; i++) {
    var obj = objs[i];
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
  this.cleanObjects(this.tasks);
  this.cleanObjects(this.actors);
  this.cleanObjects(this.particles);
  this.ticks++;
};

Scene.prototype.render = function (ctx, bx, by)
{
  // [OVERRIDE]

  // Fill with the background color.
  ctx.fillStyle = 'rgb(0,0,128)';
  ctx.fillRect(bx, by, this.window.width, this.window.height);

  var tilesize = this.tilesize;
  var window = this.window;
  var tilemap = this.tilemap;
  var x0 = Math.floor(window.x/tilesize);
  var y0 = Math.floor(window.y/tilesize);
  var x1 = Math.ceil((window.x+window.width)/tilesize);
  var y1 = Math.ceil((window.y+window.height)/tilesize);
  var fx = x0*tilesize-window.x;
  var fy = y0*tilesize-window.y;

  // Set the drawing order.
  var actors = [];
  for (var i = 0; i < this.actors.length; i++) {
    var actor = this.actors[i];
    var bounds = actor.bounds;
    if (actor.scene == this && bounds.overlap(window)) {
      var x = Math.floor((bounds.x+bounds.width/2)/tilesize);
      var y = Math.floor((bounds.y+bounds.height/2)/tilesize);
      actors[x+","+y] = actor;
    }
  }

  // Draw the tilemap.
  var ft = function (x,y) {
    var k = x+","+y;
    if (actors.hasOwnProperty(k)) {
      var a = actors[k];
      var b = a.bounds;
      a.render(ctx, bx+b.x-window.x, by+b.y-window.y);
    }
    var c = tilemap.get(x,y);
    return (c == Tile.NONE? -1 : c);
  };
  tilemap.render(ctx,
		 this.game.tiles, ft, 
		 bx+fx, by+fy,
		 x0, y0, x1-x0+1, y1-y0+1);

  // Draw the particles.
  for (var i = 0; i < this.particles.length; i++) {
    var particle = this.particles[i];
    if (particle.scene != this) continue;
    particle.render(ctx,
		    bx-window.x+particle.bounds.x,
		    by-window.y+particle.bounds.y);
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

  this.collectibles = 0;
  var scene = this;
  var tilemap = this.tilemap;
  var f = function (x,y) {
    if (Tile.isCollectible(tilemap.get(x,y))) {
      var rect = tilemap.map2coord(new Point(x,y));
      scene.addActor(new Actor(rect, Sprite.COLLECTIBLE));
      scene.collectibles++;
      tilemap.set(x, y, Tile.NONE);
    }
  };
  this.tilemap.apply(null, f);

  var rect = new Rectangle(1, 10, 1, 1);
  this.player = new Player(this.tilemap.map2coord(rect));
  this.addActor(this.player);
  
  var game = this.game;
  function player_jumped(e) {
    game.audios.jump.currentTime = 0;
    game.audios.jump.play();
  }
  function player_picked(e) {
    game.audios.pick.currentTime = 0;
    game.audios.pick.play();
    game.addScore(+1);
    scene.collectibles--;
    if (scene.collectibles == 0) {
      scene.changed.signal();
    }
  }
  this.player.picked.subscribe(player_picked);
  this.player.jumped.subscribe(player_jumped);
};

Scene.prototype.move = function(vx, vy)
{
  // [GAME SPECIFIC CODE]
  this.player.move(vx, vy);
  var rect = this.player.bounds.inset(-this.window.width/2, -this.window.height/2);
  this.setCenter(rect);
};

Scene.prototype.action = function()
{
  // [GAME SPECIFIC CODE]
  this.player.jump();
};
