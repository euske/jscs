// game.js
//   requires: utils.js
//   requires: geom.js
//   requires: actor.js
//   requires: scene.js
//   requires: text.js
//   requires: tilemap.js
//   requires: app.js
'use strict';


// Player
function Player(scene, bounds)
{
  this._PhysicalActor(bounds, bounds, 0);
  this.speed = 8;
  this.scene = scene;
}

define(Player, PhysicalActor, 'PhysicalActor', {
  getContactFor: function (range, hitbox, v) {
    return hitbox.contact(v, this.scene.ground);
  },

  jump: function (jumping) {
    if (jumping) {
      if (this.isLanded()) {
	this.setJump(true);
      }
    } else {
      this.setJump(false);
    }
  },

  usermove: function (vx, vy) {
    this.movement.x = vx*this.speed;
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
    this.ground = new Rectangle(0, this.screen.height-32, this.screen.width, 32);
    this.player = new Player(this, new Rectangle(0,0,32,32));
    this.addObject(this.player);
    
    // show a banner.
    var scene = this;
    var tb = new TextBox(this.screen, app.font);
    tb.putText(['GAME!!1'], 'center', 'center');
    tb.duration = app.framerate*2;
    tb.update = function () {
      tb.visible = blink(tb.layer.ticks, app.framerate/2);
      TextBox.prototype.update.call(tb);
    };
    this.addObject(tb);

    this.textbox = new TextBoxTT(new Rectangle(10, 10, 200, 100), app.font);
    this.textbox.addDisplay('THIS IS GAEM.\nYES IT IS.', 4, app.audios.beep);
    this.textbox.blinking = 10;
    var menu = this.textbox.addMenu();
    menu.sound = app.audios.beep;
    menu.addItem(new Vec2(110,50), 'AAA');
    menu.addItem(new Vec2(120,60), 'BB');
    menu.addItem(new Vec2(130,70), 'CCCC');
    menu.selected.subscribe(function (obj, value) {
      console.log("selected:"+value);
      scene.textbox.visible = false;
    });
    this.addObject(this.textbox);
  },

  render: function (ctx, bx, by) {
    ctx.fillStyle = 'rgb(0,0,0)';
    ctx.fillRect(bx, by, this.screen.width, this.screen.height);
    ctx.fillStyle = 'rgb(128,128,128)';
    ctx.fillRect(bx+this.ground.x, by+this.ground.y,
		 this.ground.width, this.ground.height);
    this._GameScene_render(ctx, bx, by);
  },

  keydown: function (key) {
    this._GameScene_keydown(key);
    if (this.textbox.visible) {
      this.textbox.keydown(key);
    }
  },

  set_dir: function (vx, vy) {
    this._GameScene_set_dir(vx, vy);
    if (!this.textbox.visible) {
      this.player.usermove(vx, vy);
    }
  },

  set_action: function (action) {
    this._GameScene_set_action(action);
    if (!this.textbox.visible) {
      this.player.jump(action);
    }
  },

});
