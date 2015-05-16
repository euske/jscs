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
  // OVERRIDE
  this.bounds.y -= 1;
  this.alive = (this.scene.ticks < this.end);
};

Particle.prototype.repaint = function(ctx, x, y)
{
  if (this.scene == null) return;
  var ts = this.scene.tilesize;
  ctx.drawImage(this.scene.game.images.sprites,
		this.sprite*ts, 0, ts, ts,
		x, y, this.bounds.width, this.bounds.height);
};


// Actor: a character that can interact with other characters.
function Actor(bounds)
{
  this.scene = null;
  this.alive = true;
  
  this.bounds = bounds;
  this.hitbox = bounds;
}

Actor.prototype.start = Task.prototype.start;

Actor.prototype.idle = function()
{
  // OVERRIDE
};

Actor.prototype.repaint = function(ctx, x, y)
{
  // OVERRIDE
};


// StaticActor: an Actor that has a fixed sprite.
function StaticActor(bounds, sprite)
{
  this.scene = null;
  this.alive = true;
  
  this.bounds = bounds;
  this.hitbox = bounds.inset(16, 16);
  this.sprite = sprite
}

StaticActor.prototype.start = Actor.prototype.start;

StaticActor.prototype.idle = Actor.prototype.idle;

StaticActor.prototype.repaint = function(ctx, x, y)
{
  // OVERRIDE
  if (this.scene == null) return;
  var ts = this.scene.tilesize;
  ctx.drawImage(this.scene.game.images.sprites,
		this.sprite*ts, 0, ts, ts,
		x, y, this.bounds.width, this.bounds.height);
};
