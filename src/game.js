// game.js

// Player
function Player(bounds, hitbox, tileno)
{
  Actor.call(this, bounds, hitbox, tileno);
  this.gravity = 1;
  this.maxspeed = 4;
  this.jumpacc = -4;
  this.maxacctime = 4;
  this.velocity = new Vec2(0, 0);
  this._landed = false;
  this._jumpt = -1;
}

Player.prototype = Object.create(Actor.prototype);

Player.prototype.jump = function (jumping)
{
  if (jumping) {
    if (this._landed) {
      this._jumpt = 0;
      this.velocity.y = this.jumpacc;
    }
  } else {
    this._jumpt = -1;
  }
};

Player.prototype.update = function ()
{
  if (0 <= this._jumpt && this._jumpt < this.maxacctime) {
    this._jumpt++;
    this.velocity.y -= this.gravity;
  }
  this.velocity.y += this.gravity;
  this.velocity.y = clamp(-this.maxspeed, this.velocity.y, this.maxspeed);
  var v = this.hitbox.contact(this.velocity, this.scene.ground);
  this._landed = (0 < this.velocity.y && v.y === 0);
  this.velocity.y = v.y;
  this.move(this.velocity.x, this.velocity.y);
};


//  Game
// 
function Game(app)
{
  GameScene.call(this, app);
}

Game.prototype = Object.create(GameScene.prototype);
  
Game.prototype.init = function ()
{
  GameScene.prototype.init.call(this);

  var app = this.app;
  this.ground = new Rectangle(0, 200, app.screen.width, 32);
  this.player = new Player(new Rectangle(0,0,32,32), new Rectangle(0,0,32,32), 0);
  this.addObject(this.player);
  
  // show a banner.
  var scene = this;
  var textbox = new TextBox(new Rectangle(0, 0, app.screen.width, app.screen.height));
  textbox.putText(app.font, ['GAME!!1'], 'center', 'center');
  textbox.duration = app.framerate*2;
  textbox.update = function () {
    TextBox.prototype.update.call(textbox);
    textbox.visible = blink(scene.ticks, app.framerate/2);
  };
  this.addObject(textbox);

  var tt = new TextBoxTT(new Rectangle(10, 10, 200, 100));
  tt.addTask(app.font, 'THIS IS GAEM.\nYES IT IS.', app.audios.beep, 8);
  this.addObject(tt);
};

Game.prototype.render = function (ctx, bx, by)
{
  // Fill with the background color.
  ctx.fillStyle = 'rgb(0,0,0)';
  ctx.fillRect(bx, by, this.app.screen.width, this.app.screen.height);
  GameScene.prototype.render.call(this, ctx, bx, by);
};

Game.prototype.update = function ()
{
  GameScene.prototype.update.call(this);
  this.player.velocity.x = this.app.key_dir.x;
  this.player.jump(this.app.key_action);
};
