// game.js

//  Game
// 
function Game(app)
{
  GameScene.call(this, app);

  this.world = new Rectangle(0, 0, app.screen.width, app.screen.height);
}

Game.prototype = Object.create(GameScene.prototype);
  
Game.prototype.render = function (ctx, bx, by)
{
  // [GAME SPECIFIC CODE]
  GameScene.prototype.render.call(this, ctx, bx, by);
};

Game.prototype.update = function ()
{
  // [GAME SPECIFIC CODE]
  GameScene.prototype.update.call(this);
};

Game.prototype.init = function ()
{
  // [GAME SPECIFIC CODE]
  GameScene.prototype.init.call(this);
  
  // show a banner.
  var app = this.app;
  var scene = this;
  var banner = new Sprite(null);
  banner.update = function () {
    banner.alive = (scene.ticks < banner.ticks0+app.framerate*2);
  };
  banner.render = function (ctx, x, y) {
    if (blink(scene.ticks, app.framerate/2)) {
      app.renderString(app.images.font_w, 'GAME!!!', 1,
		       x+app.screen.width/2, y+50, 'center');
    }
  };
  this.addObject(banner);
};

Game.prototype.move = function (vx, vy)
{
  // [GAME SPECIFIC CODE]
};

Game.prototype.action = function (action)
{
  // [GAME SPECIFIC CODE]
};

Game.prototype.updateScore = function ()
{
  // [GAME SPECIFIC CODE]
};

Game.prototype.change = function (state, score)
{
  // [GAME SPECIFIC CODE]
};
