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
  var v = this.hitbox.collide(this.velocity, this.scene.ground);
  this._landed = (0 < this.velocity.y && v.y === 0);
  this.velocity.y = v.y;
  this.move(this.velocity.x, this.velocity.y);
};


//  Game
// 
function Game(app)
{
  GameScene.call(this, app);

  this.world = new Rectangle(0, 0, app.screen.width, app.screen.height);
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

Game.prototype.render = function (ctx, bx, by)
{
  GameScene.prototype.render.call(this, ctx, bx, by);
};

Game.prototype.update = function ()
{
  GameScene.prototype.update.call(this);
};

Game.prototype.move = function (vx, vy)
{
  this.player.velocity.x = vx;
};

Game.prototype.action = function (action)
{
  this.player.jump(action);
};
