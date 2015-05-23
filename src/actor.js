// actor.js

// Task: a single procedure that runs at each frame.
function Task(body)
{
  this.init();
  this.body = body;
}

Task.prototype.init = function ()
{
  this.scene = null;
  this.alive = true;
};

Task.prototype.start = function (scene)
{
  this.scene = scene;
};

Task.prototype.idle = function ()
{
  this.body(this);
}


// Queue: a list of Tasks that runs sequentially.
function Queue(tasks)
{
  this.init();
  this.tasks = tasks;
}

Queue.prototype.init = Task.prototype.init;

Queue.prototype.start = Task.prototype.start;

Queue.prototype.idle = function ()
{
  while (0 < this.tasks.length) {
    var task = this.tasks[0];
    if (task.scene == null) {
      task.start(this.scene);
    }
    task.idle();
    if (task.alive) return;
    this.tasks.shift();
  }
  this.alive = false;
};

Queue.prototype.add = function (task)
{
  this.tasks.push(task);
};

Queue.prototype.remove = function (task)
{
  removeArray(this.tasks, task);
};


// Particle: a moving object that doesn't interact.
function Particle(bounds, sprite, duration)
{
  this.init();
  this.bounds = bounds;
  this.sprite = sprite
  this.duration = duration;
}

Particle.prototype.init = function ()
{
  this.scene = null;
  this.alive = true;
};

Particle.prototype.start = function (scene)
{
  this.scene = scene;
  this.end = scene.ticks+this.duration;
}

Particle.prototype.idle = function()
{
  // [OVERRIDE]
  this.bounds.y -= 1;
  this.alive = (this.scene.ticks < this.end);
};

Particle.prototype.render = function (ctx, x, y)
{
  if (this.scene == null) return;
  var sprites = this.scene.game.sprites;
  var tw = sprites.height;
  var w = this.bounds.width;
  var h = this.bounds.height;
  ctx.drawImage(sprites,
		this.sprite*tw, tw-h, w, h,
		x, y, w, h);
};


// Actor: a character that can interact with other characters.
function Actor(bounds, sprite)
{
  this.init();
  this.bounds = bounds;
  this.hitbox = bounds;
  this.sprite = sprite;
}

Actor.prototype.toString = function ()
{
  return "<Actor: "+this.bounds+">";
}

Actor.prototype.init = function ()
{
  this.scene = null;
  this.alive = true;
};

Actor.prototype.start = Task.prototype.start;

Actor.prototype.idle = function()
{
  // [OVERRIDE]
};

Actor.prototype.render = function (ctx, x, y)
{
  // [OVERRIDE]
  if (this.scene == null) return;
  var sprites = this.scene.game.sprites;
  var tw = sprites.height;
  var w = this.bounds.width;
  var h = this.bounds.height;
  ctx.drawImage(sprites,
		this.sprite*tw, tw-h, w, h,
		x, y, w, h);
};

Actor.prototype.move = function (dx, dy)
{
  // [OVERRIDE]
  this.bounds = this.bounds.move(dx, dy);
  this.hitbox = this.hitbox.move(dx, dy);
};
