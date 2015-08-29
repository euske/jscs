// scene.js
// Scene object takes care of every in-game object and the scrollable map.

function Scene(app)
{
  this.app = app;
  this.music = null;
}

Scene.prototype.init = function ()
{
  // [OVERRIDE]
};

Scene.prototype.change = function ()
{
  // [OVERRIDE]
};

Scene.prototype.update = function ()
{
  // [OVERRIDE]
};

Scene.prototype.render = function (ctx, bx, by)
{
  // [OVERRIDE]
  // Fill with the background color.
  ctx.fillStyle = 'rgb(0,0,0)';
  ctx.fillRect(bx, by, this.app.screen.width, this.app.screen.height);
};

Scene.prototype.move = function (vx, vy)
{
  // [OVERRIDE]
};

Scene.prototype.action = function (action)
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

TextScene.prototype.mousedown = function (x, y, button)
{
  this.change();
};

TextScene.prototype.action = function (action)
{
  if (action) {
    this.change();
  }
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
  this.tasks = [];
  this.sprites = [];
  this.colliders = [];
  this.ticks = 0;
};

GameScene.prototype.update = function ()
{
  // [OVERRIDE]
  this.updateObjects(this.tasks);
  this.cleanObjects(this.tasks);
  this.cleanObjects(this.sprites);
  this.cleanObjects(this.colliders);
  this.ticks++;
};

GameScene.prototype.render = function (ctx, bx, by)
{
  // [OVERRIDE]
  Scene.prototype.render.call(this, ctx, bx, by);

  // Draw the sprites.
  for (var i = 0; i < this.sprites.length; i++) {
    var obj = this.sprites[i];
    if (obj.scene !== this) continue;
    obj.render(ctx, bx, by);
  }
};

GameScene.prototype.collide = function (obj0)
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
    objs[i].update();
  }
};

GameScene.prototype.cleanObjects = function (objs)
{
  function f(obj) { return !obj.alive; }
  removeArray(objs, f);
};
