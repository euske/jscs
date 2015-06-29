// scene.js
// Scene object takes care of every in-game object and the scrollable map.

function Scene(game)
{
  this.game = game;
  this.music = null;
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
  // Fill with the background color.
  ctx.fillStyle = 'rgb(0,0,0)';
  ctx.fillRect(bx, by, this.game.screen.width, this.game.screen.height);
};

Scene.prototype.move = function (vx, vy)
{
};

Scene.prototype.action = function (action)
{
};

Scene.prototype.mousedown = function (x, y, button)
{
};

Scene.prototype.mouseup = function (x, y, button)
{
};

Scene.prototype.mousemove = function (x, y)
{
};


//  Level
// 
function Level(game)
{
  Scene.call(this, game);
}

Level.prototype = Object.create(Scene.prototype);
  
Level.prototype.init = function ()
{
  // [OVERRIDE]
  this.tasks = [];
  this.sprites = [];
  this.colliders = [];
  this.ticks = 0;
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
  Scene.prototype.render.call(this, ctx, bx, by);

  // Draw the sprites.
  for (var i = 0; i < this.sprites.length; i++) {
    var obj = this.sprites[i];
    if (obj.scene !== this) continue;
    var b = obj.bounds;
    if (b !== null) {
      obj.render(ctx, bx+b.x, by+b.y);
    } else {
      obj.render(ctx, bx, by);
    }
  }
};

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
  
Level.prototype.addObject = function (obj)
{
  if (obj.update !== undefined) {
    if (obj.scene === null) {
      obj.start(this);
    }
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

Level.prototype.updateObjects = function (objs)
{
  for (var i = 0; i < objs.length; i++) {
    objs[i].update();
  }
}

Level.prototype.cleanObjects = function (objs)
{
  function f(obj) { return !obj.alive; }
  removeArray(objs, f);
}


//  Title
//
function Title(game)
{
  Scene.call(this, game);
}

Title.prototype = Object.create(Scene.prototype);

Title.prototype.init = function (text)
{
  var frame = this.game.frame;
  var e = this.game.addElement(
    new Rectangle(frame.width/8, frame.height/4,
		  3*frame.width/4, frame.height/2));
  e.align = 'left';
  e.style.padding = '10px';
  e.style.color = 'black';
  e.style.background = 'white';
  e.style.border = 'solid black 2px';
  e.innerHTML = text;
};

Title.prototype.action = function (action)
{
  if (action) {
    this.changed.signal();
  }
};
