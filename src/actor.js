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
  this.ticks0 = scene.ticks;
};

Task.prototype.update = function ()
{
  this.body(this);
}


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
function Particle(bounds, duration)
{
  Task.call(this);
  this.bounds = bounds;
  this.duration = duration;
}

Particle.prototype = Object.create(Task.prototype);

Particle.prototype.update = function ()
{
  this.alive = (this.scene.ticks < this.ticks0+this.duration);
};

Particle.prototype.render = function (ctx, x, y)
{
};

function SpriteParticle(bounds, duration, sprite)
{
  Particle.call(this, bounds, duration);
  this.sprite = sprite;
}

SpriteParticle.prototype = Object.create(Particle.prototype);

SpriteParticle.prototype.update = function ()
{
  // [OVERRIDE]
  Particle.prototype.update.call(this);
  this.bounds.y -= 1;
};

SpriteParticle.prototype.render = function (ctx, x, y)
{
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
  Task.call(this);
  this.bounds = bounds;
  this.hitbox = bounds;
  this.sprite = sprite;
}

Actor.prototype = Object.create(Task.prototype);

Actor.prototype.toString = function ()
{
  return '<Actor: '+this.bounds+'>';
}

Actor.prototype.update = function ()
{
  // [OVERRIDE]
};

Actor.prototype.render = function (ctx, x, y)
{
  // [OVERRIDE]
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
