// game.js

// Player
function Player(bounds)
{
  this._Actor(bounds, bounds, 0);
  this.speed = 4;
  this.gravity = 1;
  this.maxspeed = 4;
  this.jumpacc = -4;
  this.maxacctime = 4;
  this.velocity = new Vec2(0, 0);
  this._landed = false;
  this._jumpt = -1;
}

define(Player, Actor, 'Actor', {
  jump: function (jumping) {
    if (jumping) {
      if (this._landed) {
	this._jumpt = 0;
	this.velocity.y = this.jumpacc;
      }
    } else {
      this._jumpt = -1;
    }
  },

  usermove: function (v) {
    this.velocity.x = v.x*this.speed;
  },

  update: function () {
    this._Actor_update();
    if (0 <= this._jumpt && this._jumpt < this.maxacctime) {
      this._jumpt++;
      this.velocity.y -= this.gravity;
    }
    this.velocity.y += this.gravity;
    this.velocity.y = clamp(-this.maxspeed, this.velocity.y, this.maxspeed);
    var v = this.hitbox.contact(this.velocity, this.scene.ground);
    this._landed = (0 < this.velocity.y && v.y === 0);
    this.velocity = v;
    this.move(this.velocity.x, this.velocity.y);
  },
});



//  Game
// 
function Game(app)
{
  this._GameScene(app);
}

define(Game, GameScene, 'GameScene', {
  init: function () {
    this._GameScene_init();

    var app = this.app;
    this.ground = new Rectangle(0, 200, app.screen.width, 32);
    this.player = new Player(new Rectangle(0,0,32,32));
    this.addObject(this.player);
    
    // show a banner.
    var scene = this;
    var tb = new TextBox(this.frame, app.font);
    tb.putText(['GAME!!1'], 'center', 'center');
    tb.duration = app.framerate*2;
    tb.update = function () {
      TextBox.prototype.update.call(tb);
      tb.visible = blink(scene.ticks, app.framerate/2);
    };
    this.addObject(tb);

    this.textbox = new TextBoxTT(new Rectangle(10, 10, 200, 100), app.font);
    this.textbox.addDisplay('THIS IS GAEM.\nYES IT IS.', 4, app.audios.beep);
    this.textbox.blinking = 10;
    var menu = this.textbox.addMenu();
    menu.sound = app.audios.beep;
    menu.addItem(new Vec2(10,50), 'AAA');
    menu.addItem(new Vec2(20,60), 'BB');
    menu.addItem(new Vec2(30,70), 'CCCC');
    menu.selected.subscribe(function (obj, value) {
      console.log("selected:"+value);
      scene.textbox.visible = false;
    });
    this.addObject(this.textbox);
  },

  render: function (ctx, bx, by) {
    // Fill with the background color.
    ctx.fillStyle = 'rgb(0,0,0)';
    ctx.fillRect(bx, by, this.app.screen.width, this.app.screen.height);
    
    this._GameScene_render(ctx, bx, by);
  },

  keydown: function (key) {
    this._GameScene_keydown(key);
    if (this.textbox.visible) {
      this.textbox.keydown(key);
    }
  },

  update: function () {
    this._GameScene_update(this);
    if (!this.textbox.visible) {
      this.player.usermove(this.app.key_dir);
    }
  },

  set_action: function (action) {
    this._GameScene_set_action(action);
    if (!this.textbox.visible) {
      this.player.jump(action);
    }
  },

});
