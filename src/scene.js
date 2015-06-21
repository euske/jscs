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

Scene.prototype.mousedown = function (x, y, button)
{
};

Scene.prototype.mouseup = function (x, y, button)
{
};

Scene.prototype.mousemove = function (x, y)
{
};
