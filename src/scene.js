// scene.js
// Scene object takes care of every in-game object and the scrollable map.

function Scene(app)
{
  this.app = app;
  this.music = null;
  this.frame = new Rectangle(0, 0, app.screen.width, app.screen.height);
}

Scene.prototype.init = function ()
{
  // [OVERRIDE]
  this.ticks = 0;
};

Scene.prototype.update = function ()
{
  // [OVERRIDE]
  this.ticks++;
};

Scene.prototype.render = function (ctx, bx, by)
{
  // [OVERRIDE]
};

Scene.prototype.set_dir = function (vx, vy)
{
  // [OVERRIDE]
};

Scene.prototype.set_action = function (action)
{
  // [OVERRIDE]
};

Scene.prototype.keydown = function (key)
{
  // [OVERRIDE]
};

Scene.prototype.keyup = function (key)
{
  // [OVERRIDE]
};

Scene.prototype.mousedown = function (x, y, button)
{
  // [OVERRIDE]
};

Scene.prototype.mouseup = function (x, y, button)
{
  // [OVERRIDE]
};

Scene.prototype.mousemove = function (x, y)
{
  // [OVERRIDE]
};

Scene.prototype.changeScene = function (scene)
{
  var app = this.app;
  app.post(function () { app.init(scene); });
};


//  TextScene
//
function TextScene(app, text)
{
  Scene.call(this, app);
  this.text = text;
}

TextScene.prototype = Object.create(Scene.prototype);

TextScene.prototype.init = function ()
{
  Scene.prototype.init.call(this);
  var scene = this;
  var frame = this.app.frame;
  var e = this.app.addElement(
    new Rectangle(frame.width/8, frame.height/4,
		  3*frame.width/4, frame.height/2));
  e.align = 'left';
  e.style.padding = '10px';
  e.style.color = 'black';
  e.style.background = 'white';
  e.style.border = 'solid black 2px';
  e.innerHTML = this.text;
  e.onmousedown = (function (e) { scene.change(); });
};

TextScene.prototype.change = function ()
{
  // [OVERRIDE]
};

TextScene.prototype.mousedown = function (x, y, button)
{
  this.change();
};

TextScene.prototype.keydown = function (key)
{
  this.change();
};


//  GameScene
// 
function GameScene(app)
{
  Scene.call(this, app);
}

GameScene.prototype = Object.create(Scene.prototype);
  
GameScene.prototype.init = function ()
{
  // [OVERRIDE]
  Scene.prototype.init.call(this);
  this.tasks = [];
  this.sprites = [];
  this.colliders = [];
};

GameScene.prototype.update = function ()
{
  // [OVERRIDE]
  Scene.prototype.update.call(this);
  this.updateObjects(this.tasks);
  this.collideObjects(this.colliders);
  this.cleanObjects(this.tasks);
  this.cleanObjects(this.sprites);
  this.cleanObjects(this.colliders);
};

GameScene.prototype.render = function (ctx, bx, by)
{
  // [OVERRIDE]
  Scene.prototype.render.call(this, ctx, bx, by);

  // Draw the sprites.
  for (var i = 0; i < this.sprites.length; i++) {
    var obj = this.sprites[i];
    if (obj.scene !== this) continue;
    if (obj.visible) {
      obj.render(ctx, bx, by);
    }
  }
};

GameScene.prototype.addObject = function (obj)
{
  if (obj.update !== undefined) {
    if (obj.scene === null) {
      obj.start(this);
    }
    this.tasks.push(obj);
  }
  if (obj.render !== undefined) {
    this.sprites.push(obj);
    this.sprites.sort(function (a,b) { return a.zorder-b.zorder; });
  }
  if (obj.hitbox !== undefined) {
    this.colliders.push(obj);
  }
};

GameScene.prototype.removeObject = function (obj)
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

GameScene.prototype.updateObjects = function (objs)
{
  for (var i = 0; i < objs.length; i++) {
    var obj = objs[i];
    if (obj.scene !== this) continue;
    obj.update();
  }
};

GameScene.prototype.collideObjects = function (objs)
{
  for (var i = 0; i < objs.length; i++) {
    var obj0 = objs[i];
    if (obj0.scene === this && obj0.hitbox !== null) {
      for (var j = i+1; j < objs.length; j++) {
	var obj1 = objs[j];
	if (obj1.scene === this && obj1.hitbox !== null &&
	    obj1 !== obj0 && obj1.hitbox.overlap(obj0.hitbox)) {
	  obj0.collide(obj1);
	  obj1.collide(obj0);
	}
      }
    }
  }
};
  
GameScene.prototype.cleanObjects = function (objs)
{
  function f(obj) { return obj.scene === null; }
  removeArray(objs, f);
};

GameScene.prototype.findObjects = function (rect, f)
{
  var a = [];
  for (var i = 0; i < this.colliders.length; i++) {
    var obj1 = this.colliders[i];
    if (obj1.scene === this && obj1.hitbox !== null &&
	f(obj1) && obj1.hitbox.overlap(rect)) {
      a.push(obj1);
    }
  }
  return a;
}
