// actor.js

// Task
function Task(body)
{
  this.scene = null;
  this.alive = true;

  var task = this;
  this.idle = function () { body(task); };
}

Task.prototype.start = function (scene)
{
  this.scene = scene;
};

// Queue
function Queue(tasks)
{
  this.scene = null;
  this.alive = true;
  
  this.tasks = tasks;
}

Queue.prototype.start = Task.prototype.start;

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


// Actor
function Actor(bounds)
{
  this.scene = null;
  this.alive = true;
  
  this.bounds = bounds;
  this.hitbox = bounds;
}

Actor.prototype.start = Task.prototype.start;

Actor.prototype.repaint = function(ctx, x, y)
{
};

Actor.prototype.idle = function()
{
};

// Particle
function Particle(sprite, bounds, duration)
{
  this.scene = null;
  this.alive = true;
  
  this.sprite = sprite
  this.bounds = bounds;
  this.duration = duration;
}

Particle.prototype.start = function (scene)
{
  this.scene = scene;
  this.end = scene.ticks+this.duration;
}

Particle.prototype.repaint = function(ctx, x, y)
{
  if (this.scene == null) return;
  var ts = this.scene.tilesize;
  ctx.drawImage(this.scene.game.images.sprites,
		this.sprite*ts, 0, ts, ts,
		x, y, this.bounds.width, this.bounds.height);
};

Particle.prototype.idle = function()
{
  this.bounds.y -= 1;
  this.alive = (this.scene.ticks < this.end);
};


// Collectible
function Collectible(rect)
{
  this.scene = null;
  this.alive = true;
  
  this.bounds = rect;
  this.hitbox = rect.inset(16, 16);
}

Collectible.prototype.start = Actor.prototype.start;

Collectible.prototype.repaint = function(ctx, x, y)
{
  if (this.scene == null) return;
  var ts = this.scene.tilesize;
  ctx.drawImage(this.scene.game.images.sprites,
		Sprite.COLLECTIBLE*ts, 0, ts, ts,
		x, y, this.bounds.width, this.bounds.height);
};

Collectible.prototype.idle = Actor.prototype.idle;
