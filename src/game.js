// game.js
//   requires: utils.js
//   requires: geom.js
//   requires: actor.js
//   requires: scene.js
//   requires: text.js
//   requires: tilemap.js
//   requires: app.js
'use strict';

// MovingActor
function MovingActor(bounds, hitbox, tileno)
{
  this._Actor(bounds, hitbox, tileno)
  this.jumpfunc = (function (t) { return (t < 4)? -5 : 0; });
  this.fallfunc = (function (vy) { return clamp(-8, vy+1, +8); });
  this.velocity = new Vec2(0, 0);
  this.landed = false;
  this._jumpt = -1;
}

define(MovingActor, Actor, 'Actor', {
  update: function () {
    var v = this.velocity.copy();
    if (0 <= this._jumpt) {
      v.y += this.jumpfunc(this._jumpt);
      this._jumpt++;
    }
    v.y = this.fallfunc(v.y);
    this.velocity = this.getMove(v);
    this.landed = (0 < v.y && this.velocity.y < v.y);
    this.movev(this.velocity);
  },

  getMoveFor: function (v, rect) {
    var hitbox = this.hitbox;
    var d0 = hitbox.contact(v, rect);
    hitbox = hitbox.move(d0.x, d0.y);
    v = v.sub(d0);
    var d1 = hitbox.contact(new Vec2(v.x, 0), rect);
    hitbox = hitbox.move(d1.x, d1.y);
    v = v.sub(d1);
    var d2 = hitbox.contact(new Vec2(0, v.y), rect);
    return new Vec2(d0.x+d1.x+d2.x,
		    d0.y+d1.y+d2.y);
  },

  getMove: function (v) {
    return v;
  },
  
  isLanded: function () {
    return this.landed;
  },

  setJumping: function (jumping) {
    if (jumping && this.landed) {
      this._jumpt = 0;
    } else {
      this._jumpt = -1;
    }
  },
});


// Player
function Player(bounds)
{
  this._MovingActor(bounds, bounds, 0);
  this.speed = 4;
}

define(Player, MovingActor, 'MovingActor', {
  getMove: function (v) {
    return this.getMoveFor(v, this.scene.ground);
  },

  jump: function (jumping) {
    if (jumping) {
      if (this.isLanded()) {
	this.setJumping(true);
      }
    } else {
      this.setJumping(false);
    }
  },

  usermove: function (vx, vy) {
    this.velocity.x = vx*this.speed;
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
    this.player = new Player(new Rectangle(0,0,32,32));
    this.addObject(this.player);
    
    // show a banner.
    var scene = this;
    var tb = new TextBox(this.screen, app.font);
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
