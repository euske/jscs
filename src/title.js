// title.js

function Title(game)
{
  this.game = game;
  this.changed = new Slot(this);
}

Title.prototype.init = function (text)
{
  var frame = this.game.frame;
  var e = this.game.addElement(
    new Rectangle(frame.width/8, frame.height/4,
		  3*frame.width/4, frame.height/2));
  e.align = "left";
  e.style.padding = "10px";
  e.style.color = "black";
  e.style.background = "white";
  e.style.border = "solid black 2px";
  e.innerHTML = text;
};

Title.prototype.idle = function ()
{
};

Title.prototype.render = function (ctx, bx, by)
{
  ctx.fillStyle = 'rgb(0,0,0)';
  ctx.fillRect(bx, by, this.game.screen.width, this.game.screen.height);
};

Title.prototype.move = function (vx, vy)
{
};

Title.prototype.action = function ()
{
  this.changed.signal();
};
