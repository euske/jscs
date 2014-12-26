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
  this.actors = [];
}

Scene.prototype.addActor = function (actor)
{
  this.actors.push(actor);
  this.actors.sort(function (a,b) { return (b.layer-a.layer); });
}

Scene.prototype.removeActor = function (actor)
{
  var i = this.actors.indexOf(actor);
  if (0 <= i) {
    this.actors.splice(i, 1);
  }
}

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
}

Scene.prototype.idle = function (ticks)
{
  var removed = []
  for (var i = 0; i < this.actors.length; i++) {
    var actor = this.actors[i];
    actor.idle(ticks);
    if (!actor.alive) {
      removed.push(actor);
    }
  }
  removeArray(this.actors, removed);
}

Scene.prototype.repaint = function (ctx, bx, by)
{
  var x0 = Math.floor(this.window.x/this.tilesize);
  var y0 = Math.floor(this.window.y/this.tilesize);
  var x1 = Math.ceil((this.window.x+this.window.width)/this.tilesize);
  var y1 = Math.ceil((this.window.y+this.window.height)/this.tilesize);
  var fx = x0*this.tilesize-this.window.x;
  var fy = y0*this.tilesize-this.window.y;
  var nrows = y1-y0+1;
  
  var actors = new Array(nrows);
  for (var dy = 0; dy < nrows; dy++) {
    actors[dy] = []
  }
  for (var i = 0; i < this.actors.length; i++) {
    var actor = this.actors[i];
    var dy = Math.floor((actor.bounds.y+actor.bounds.height)/this.tilesize) - y0;
    if (0 <= dy && dy < nrows) {
      actors[dy].push(actor);
    }
  }

  var tilemap = this.tilemap;
  var f = function (x,y) { return tilemap.get(x,y); };
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
}

Scene.prototype.collide = function (actor0)
{
  var a = []
  for (var i = 0; i < this.actors.length; i++) {
    var actor1 = this.actors[i];
    if (actor1 !== actor0 && actor1.hitbox.overlap(actor0.hitbox)) {
      a.push(actor1);
    }
  }
  return a;
}

Scene.prototype.init = function ()
{
  var scene = this;
  var tilemap = this.tilemap;
  var f = function (x,y) {
    if (Tile.isCollectible(tilemap.get(x,y))) {
      var rect = tilemap.map2coord(new Point(x,y));
      scene.addActor(new Collectible(scene, rect));
      tilemap.set(x, y, Tile.NONE);
    }
  };
  tilemap.apply(null, f);
};
