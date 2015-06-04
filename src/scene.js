// scene.js
// Scene object takes care of every in-game object and the scrollable map.

function Scene(game)
{
  this.game = game;
  this.changed = new Slot(this);
}

Scene.prototype.init = function ()
{
};

Scene.prototype.update = function ()
{
};

Scene.prototype.render = function (ctx, bx, by)
{
  ctx.fillStyle = 'rgb(0,0,0)';
  ctx.fillRect(bx, by, this.game.screen.width, this.game.screen.height);
};

Scene.prototype.move = function (vx, vy)
{
};

Scene.prototype.action = function (action)
{
};


//  Level
// 
function Level(game)
{
  Scene.call(this, game);
  
  this.tilesize = 32;
  this.window = new Rectangle(0, 0, game.screen.width, game.screen.height);
  this.world = new Rectangle(0, 0, game.screen.width, game.screen.height);

  this.tasks = [];
  this.sprites = [];
  this.colliders = [];
  this.ticks = 0;
}

Level.prototype = Object.create(Scene.prototype);
  
Level.prototype.addObject = function (obj)
{
  if (obj.update !== undefined) {
    this.tasks.push(obj);
  }
  if (obj.render !== undefined) {
    this.sprites.push(obj);
  }
  if (obj.hitbox !== undefined) {
    this.colliders.push(obj);
  }
};

Level.prototype.removeObject = function (obj)
{
  if (obj.update !== undefined) {
    removeArray(this.tasks, obj);
  }
  if (obj.render !== undefined) {
    removeArray(this.sprites, obj);
  }
  if (obj.hitbox !== undefined) {
    removeArray(this.colliders, obj);
  }
};

Level.prototype.setCenter = function (rect)
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

Level.prototype.updateObjects = function (objs)
{
  for (var i = 0; i < objs.length; i++) {
    var obj = objs[i];
    if (obj.scene === null) {
      obj.start(this);
    }
    obj.update();
  }
}

Level.prototype.cleanObjects = function (objs)
{
  function f(obj) { return !obj.alive; }
  removeArray(objs, f);
}

Level.prototype.collide = function (obj0)
{
  var a = [];
  if (obj0.alive && obj0.scene === this && obj0.hitbox !== null) {
    for (var i = 0; i < this.colliders.length; i++) {
      var obj1 = this.colliders[i];
      if (obj1.alive && obj1.scene === this && obj1.hitbox !== null &&
	  obj1 !== obj0 && obj1.hitbox.overlap(obj0.hitbox)) {
	a.push(obj1);
      }
    }
  }
  return a;
};

Level.prototype.update = function ()
{
  // [OVERRIDE]
  this.updateObjects(this.tasks);
  this.cleanObjects(this.tasks);
  this.cleanObjects(this.sprites);
  this.cleanObjects(this.colliders);
  this.ticks++;
};

Level.prototype.render = function (ctx, bx, by)
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
  var objs = [];
  for (var i = 0; i < this.sprites.length; i++) {
    var obj = this.sprites[i];
    if (obj.scene !== this) continue;
    if (obj.bounds === null) continue;
    var bounds = obj.bounds;
    if (bounds.overlap(window)) {
      var x = Math.floor((bounds.x+bounds.width/2)/tilesize);
      var y = Math.floor((bounds.y+bounds.height/2)/tilesize);
      var k = x+','+y;
      if (!objs.hasOwnProperty(k)) {
	objs[k] = [];
      }
      objs[k].push(obj);
    }
  }

  // Draw the tilemap.
  var ft = function (x,y) {
    var k = x+','+y;
    if (objs.hasOwnProperty(k)) {
      var r = objs[k];
      for (var i = 0; i < r.length; i++) {
	var a = r[i];
	var b = a.bounds;
	a.render(ctx, bx+b.x-window.x, by+b.y-window.y);
      }
    }
    var c = tilemap.get(x,y);
    return (c == T.NONE? -1 : c);
  };
  tilemap.render(ctx,
		 this.game.tiles, ft, 
		 bx+fx, by+fy,
		 x0, y0, x1-x0+1, y1-y0+1);

  // Draw floating objects.
  for (var i = 0; i < this.sprites.length; i++) {
    var obj = this.sprites[i];
    if (obj.scene != this) continue;
    if (obj.bounds === null) {
      obj.render(ctx, bx, by);
    }
  }
};

Level.prototype.init = function ()
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
  this.sprites = [];
  this.colliders = [];
  this.ticks = 0;

  this.collectibles = 0;
  var game = this.game;
  var scene = this;
  var tilemap = this.tilemap;
  var f = function (x,y) {
    if (T.isCollectible(tilemap.get(x,y))) {
      var rect = tilemap.map2coord(new Point(x,y));
      scene.addObject(new Actor(rect, S.COLLECTIBLE));
      scene.collectibles++;
      tilemap.set(x, y, T.NONE);
    }
  };
  this.tilemap.apply(null, f);

  var rect = new Rectangle(1, 10, 1, 1);
  this.player = new Player(this.tilemap.map2coord(rect));
  this.addObject(this.player);
  
  function player_jumped(e) {
    game.audios.jump.currentTime = 0;
    game.audios.jump.play();
  }
  function player_picked(e) {
    game.audios.pick.currentTime = 0;
    game.audios.pick.play();
    game.addScore(+1);
    
    // show a balloon.
    var frame = game.frame;
    var text = 'Got a thingy!';
    var e = game.addElement(new Rectangle(20, 20, frame.width-60, 60))
    e.align = 'left';
    e.style.padding = '10px';
    e.style.color = 'black';
    e.style.background = 'white';
    e.style.border = 'solid black 2px';
    var i = 0;
    function balloon(task) {
      if ((scene.ticks % 2) == 0) {
	if (i < text.length) {
	  i++;
	  e.innerHTML = text.substring(0, i);
	} else {
	  game.removeElement(e);
	  task.alive = false;
	}
      }
    }
    scene.addObject(new Task(balloon));

    // count the score.
    scene.collectibles--;
    if (scene.collectibles == 0) {
      // delay calling.
      scene.addObject(new Task(function (task) {
	if (task.ticks0+game.framerate < scene.ticks) {
	  scene.changed.signal('WON');
	}
      }));
    }
  }
  this.player.picked.subscribe(player_picked);
  this.player.jumped.subscribe(player_jumped);

  var banner = new Particle(null, game.framerate*2);
  banner.render = function (ctx, x, y) {
    if (blink(scene.ticks, game.framerate/2)) {
      game.renderString(game.images.font_w, 'GET ALL TEH DAMN THINGIES!', 1,
			x+scene.window.width/2, y+50, 'center');
    }
  };
  this.addObject(banner);
};

Level.prototype.move = function (vx, vy)
{
  // [GAME SPECIFIC CODE]
  this.player.move(vx, vy);
  var rect = this.player.bounds.inset(-this.window.width/2, -this.window.height/2);
  this.setCenter(rect);
};

Level.prototype.action = function (action)
{
  // [GAME SPECIFIC CODE]
  this.player.jump(action);
};
