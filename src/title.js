// title.js

function Title(game)
{
  Scene.call(this, game);
}

Title.prototype = Object.create(Scene.prototype);

Title.prototype.init = function (text)
{
  var frame = this.game.frame;
  var e = this.game.addElement(
    new Rectangle(frame.width/8, frame.height/4,
		  3*frame.width/4, frame.height/2));
  e.align = 'left';
  e.style.padding = '10px';
  e.style.color = 'black';
  e.style.background = 'white';
  e.style.border = 'solid black 2px';
  e.innerHTML = text;
};

Title.prototype.action = function (action)
{
  if (action) {
    this.changed.signal();
  }
};
