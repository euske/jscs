// actor.js

// Task: a single procedure that runs at each frame.
function Task()
{
  this.scene = null;
  this.duration = 0;
  this.died = new Slot(this);
}

Task.prototype.start = function (scene)
{
  this.scene = scene;
  this.ticks0 = scene.ticks;
};

Task.prototype.getTime = function ()
{
  return (this.scene.ticks - this.ticks0);
};

Task.prototype.die = function ()
{
  this.scene = null;
  this.died.signal();
};

Task.prototype.update = function ()
{
  // [OVERRIDE]
  if (0 < this.duration &&
      this.ticks0+this.duration < this.scene.ticks) {
    this.die();
  }
};


// Queue: a list of Tasks that runs sequentially.
function Queue(tasks)
{
  Task.call(this);
  this.tasks = tasks;
}

Queue.prototype = Object.create(Task.prototype);

Queue.prototype.update = function ()
{
  while (0 < this.tasks.length) {
    var task = this.tasks[0];
    if (task.scene === null) {
      task.start(this.scene);
    }
    task.update();
    if (task.scene !== null) return;
    this.tasks.shift();
  }
  this.die();
};

Queue.prototype.add = function (task)
{
  this.tasks.push(task);
};

Queue.prototype.remove = function (task)
{
  removeArray(this.tasks, task);
};


// Sprite: a moving object that doesn't interact.
function Sprite(bounds)
{
  Task.call(this);
  this.visible = true;
  this.zorder = 0;
  this.bounds = (bounds === null)? bounds : bounds.copy();
}

Sprite.prototype = Object.create(Task.prototype);

Sprite.prototype.toString = function ()
{
  return '<Sprite: '+this.bounds+'>';
};

Sprite.prototype.update = function ()
{
  // [OVERRIDE]
  Task.prototype.update.call(this);
};

Sprite.prototype.render = function (ctx, x, y)
{
  // [OVERRIDE]
};


// Actor: a character that can interact with other characters.
function Actor(bounds, hitbox, tileno)
{
  Sprite.call(this, bounds);
  this.hitbox = (hitbox === null)? null : hitbox.copy();
  this.tileno = tileno;
}

Actor.prototype = Object.create(Sprite.prototype);

Actor.prototype.collide = function (actor)
{
  // [OVERRIDE]
};

Actor.prototype.render = function (ctx, x, y)
{
  // [OVERRIDE]
  var w = this.bounds.width;
  var h = this.bounds.height;
  if (typeof(this.tileno) === 'string') {
    ctx.fillStyle = this.tileno;
    ctx.fillRect(x+this.bounds.x, y+this.bounds.y, w, h);
  } else {
    var sprites = this.scene.app.sprites;
    var tw = sprites.height;
    var th = sprites.height;
    ctx.drawImage(sprites,
		  this.tileno*tw, th-h, w, h,
		  x+this.bounds.x, y+this.bounds.y, w, h);
  }
};

Actor.prototype.move = function (dx, dy)
{
  // [OVERRIDE]
  this.bounds = this.bounds.move(dx, dy);
  if (this.hitbox !== null) {
    this.hitbox = this.hitbox.move(dx, dy);
  }
};
