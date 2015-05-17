// actor.js

// Task: a single procedure that runs at each frame.
function Task(body)
{
  this.scene = null;
  this.alive = true;

  this.body = body;
}

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
  this.scene = null;
  this.alive = true;
  
  this.tasks = tasks;
}

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
    this.tasks.splice(0, 1);
  }
  this.alive = false;
};

Queue.prototype.add = function (task)
{
  this.tasks.push(task);
};

Queue.prototype.remove = function (task)
{
  var i = this.tasks.indexOf(task);
  if (0 <= i) {
    this.tasks.splice(i, 1);
  }
};


// Particle: a moving object that doesn't interact.
function Particle(bounds, sprite, duration)
{
  this.scene = null;
  this.alive = true;
  
  this.bounds = bounds;
  this.sprite = sprite
  this.duration = duration;
}

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

Particle.prototype.render = function(ctx, x, y)
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
  this.scene = null;
  this.alive = true;
  
  this.bounds = bounds;
  this.hitbox = bounds;
  this.sprite = sprite;
}

Actor.prototype.toString = function ()
{
  return "<Actor: "+this.bounds+">";
}

Actor.prototype.start = Task.prototype.start;

Actor.prototype.idle = function()
{
  // [OVERRIDE]
};

Actor.prototype.render = function(ctx, x, y)
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
