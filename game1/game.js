// game.js

// [GAME SPECIFIC CODE]

// Particle
function Particle(bounds, tileno)
{
  this._Actor(bounds, null, tileno);
  this.velocity = new Vec2();  
}

define(Particle, Actor, 'Actor', {
  update: function () {
    this._Actor_update(this);
    this.bounds = this.bounds.movev(this.velocity);
  },

});

// Thingy
function Thingy(bounds)
{
  this._Actor(bounds, bounds.inflate(-2, -2), S.THINGY);
}

define(Thingy, Actor, 'Actor', {
});

// Player
function Player(tilemap, p)
{
  var bounds = tilemap.map2coord(new Rectangle(p.x, p.y, 1, 1));
  this._JumpingActor(bounds, bounds.inflate(-2, -2), S.PLAYER);
  this.tilemap = tilemap;
  this.picked = new Slot(this);
  this.jumped = new Slot(this);
}

define(Player, JumpingActor, 'JumpingActor', {
  toString: function () {
    return '<Player: '+this.bounds+'>';
  },

  setMove: function (v) {
    this.velocity.x = v.x*this.speed;
  },

  setJump: function (jumpend) {
    this._JumpingActor_setJump(jumpend);
    if (0 < jumpend && 0 < this._jumpend) {
      this.jumped.signal();
    }
  },

  getContactFor: function (range, hitbox, v) {
    return this.tilemap.contactTile(hitbox, T.isObstacle, v);
  },
  
  collide: function (actor) {
    if (actor instanceof Thingy) {
      actor.die();
      this.picked.signal();
      var particle = new Particle(actor.bounds, S.YAY);
      particle.duration = 30;
      particle.velocity = new Vec2(0, -1);
      this.layer.addObject(particle);
    }
  },

});

// Enemy
function Enemy(tilemap, bounds)
{
  this._PlanningActor(tilemap, bounds, bounds.inflate(-2, -2), S.ENEMY);
}

define(Enemy, PlanningActor, 'PlanningActor', {
  toString: function () {
    return '<Enemy: '+this.bounds+'>';
  },
  
  renderPlan: function (ctx, bx, by) {
    if (this.plan !== null) {
      this.plan.render(ctx, bx, by);
    }
  },

});


//  Title
//
function Title(app)
{
  this._TextScene(app);
  this.text = '<b>Sample Game 1</b><p>Made with JSCS<p>Press Enter to start.';
}

define(Title, TextScene, 'TextScene', {
  change: function () {
    this.changeScene(new Game(this.app));
  },

});


//  EndGame
//
function EndGame(app, score)
{
  this._TextScene(app);
  this.app.lockKeys();
  this.text = '<b>You Won!</b><p><b>Score: '+score+'</b><p>Press Enter to restart.';
}

define(EndGame, TextScene, 'TextScene', {
  init: function () {
    this._TextScene_init();
    this.app.set_music(this.app.audios.ending);
  },
  
  change: function () {
    this.changeScene(new Game(this.app));
  },

});


//  Game
// 
function Game(app)
{
  this._GameScene(app);
  
  this.tilesize = 32;
  this.world = this.screen.copy();
}

define(Game, GameScene, 'GameScene', {
  render: function (ctx, bx, by) {
    // [OVERRIDE]

    var ts = this.tilesize;
    var window = this.camera.window;

    // Set the drawing order.
    var objs = [];
    for (var i = 0; i < this.sprites.length; i++) {
      var obj = this.sprites[i];
      if (obj.layer === null) continue;
      if (obj.bounds === null) continue;
      if (!obj.visible) continue;
      var bounds = obj.bounds;
      if (bounds.overlap(window)) {
	var x = int((bounds.x+bounds.width/2)/ts);
	var y = int((bounds.y+bounds.height/2)/ts);
	var k = x+','+y;
	if (!objs.hasOwnProperty(k)) {
	  objs[k] = [];
	}
	objs[k].push(obj);
      }
    }

    // Draw the tilemap.
    var ft = function (x,y,c) {
      var k = x+','+y;
      if (objs.hasOwnProperty(k)) {
	var r = objs[k];
	for (var i = 0; i < r.length; i++) {
	  var a = r[i];
	  a.render(ctx, bx-window.x, by-window.y);
	}
      }
      return (c == T.NONE? -1 : c);
    };
    ctx.fillStyle = 'rgb(0,0,128)';
    ctx.fillRect(bx, by, window.width, window.height);
    this.camera.renderTilesFromBottomLeft(
      ctx, bx, by, this.tilemap, this.app.tiles, ft);

    // Draw floating objects.
    for (var i = 0; i < this.sprites.length; i++) {
      var obj = this.sprites[i];
      if (obj.layer === null) continue;
      if (obj.bounds === null) {
      if (!obj.visible) continue;
	obj.render(ctx, bx, by);
      }
      if (obj instanceof Enemy) {
	obj.renderPlan(ctx, bx-window.x, by-window.y);
      }
    }
  },

  init: function () {
    this._GameScene_init();
    this.app.set_music(this.app.audios.music);
    
    // [OVERRIDE]
    // [GAME SPECIFIC CODE]
    var map = copyArray([
      [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
      [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
      [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
      [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
      [0,0,0,0, 0,0,0,0, 0,0,0,0, 2,2,0,0, 0,0,0,0],
      
      [0,0,0,0, 0,0,0,0, 0,0,0,0, 1,1,0,0, 0,0,0,0],
      [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
      [0,0,0,0, 0,0,0,0, 0,0,2,1, 0,0,0,0, 0,2,2,0],
      [0,0,0,0, 0,0,0,0, 0,1,1,1, 0,0,0,0, 0,0,0,0],
      [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
      
      [0,0,1,1, 1,1,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
      [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
      [0,0,0,0, 0,0,0,0, 1,1,0,0, 0,0,0,0, 1,1,0,0],
      [0,0,0,0, 1,0,0,0, 0,0,2,0, 0,2,0,0, 0,0,0,0],
      [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1],
    ]);
    this.tilemap = new TileMap(this.tilesize, map);
    this.world.width = this.tilemap.width * this.tilesize;
    this.world.height = this.tilemap.height * this.tilesize;
    this.camera = new Camera(
      new Rect(0, 0, 
	       Math.min(this.world.width, this.screen.width),
	       Math.min(this.world.height, this.screen.height)));
    this.addObject(this.camera);

    this.collectibles = 0;
    var app = this.app;
    var scene = this;
    var tilemap = this.tilemap;
    var f = function (x,y,c) {
      if (T.isCollectible(c)) {
	var rect = tilemap.map2coord(new Vec2(x,y));
	scene.addObject(new Thingy(rect));
	scene.collectibles++;
	tilemap.set(x, y, T.NONE);
      }
    };
    this.tilemap.apply(f);

    this.player = new Player(this.tilemap, new Vec2(1,10));
    this.addObject(this.player);

    var rect = new Rectangle(10, 10, 1, 1);
    var enemy = new Enemy(this.tilemap, this.tilemap.map2coord(rect));
    enemy.target = this.player;
    this.addObject(enemy);
    
    function player_jumped(e) {
      playSound(app.audios.jump);
    }
    function player_picked(e) {
      playSound(app.audios.pick);
      scene.score++;
      scene.updateScore();
      
      // show a balloon.
      var textbox = new TextBoxTT(new Rectangle(20, 20, this.screen.width-60, 60), app.font);
      textbox.addDisplay('GOT A THINGY!', 4);
      textbox.duration = app.framerate*2;
      scene.addObject(textbox);

      // count the score.
      scene.collectibles--;
      if (scene.collectibles === 0) {
	// delay calling.
	var task = new Task();
	task.duration = app.framerate;
	task.died.subscribe(function (_) {
	  scene.changeScene(new EndGame(app, scene.score));
	});
	scene.addObject(task);
      }
    }
    this.player.picked.subscribe(player_picked);
    this.player.jumped.subscribe(player_jumped);

    this.score_node = app.addElement(new Rectangle(10, 10, 160, 32));
    this.score_node.align = 'left';
    this.score_node.style.color = 'white';
    this.score_node.style['font-size'] = '150%';
    this.score_node.style['font-weight'] = 'bold';
    this.score = 0;
    this.updateScore();

    // show a banner.
    var textbox = new TextBox(this.screen, app.font);
    textbox.linespace = 4;
    textbox.putText(['GET ALL TEH','DAMN THINGIES!'], 'center', 'center');
    textbox.duration = app.framerate*2;
    textbox.update = function () {
      textbox.visible = blink(textbox.layer.ticks, app.framerate/2);
      TextBox.prototype.update.call(textbox);
    };
    this.addObject(textbox);
  },

  update: function () {
    this._GameScene_update();
    
    // [GAME SPECIFIC CODE]
    this.player.setMove(this.app.key_dir);
    this.player.setJump(this.app.key_action? Infinity : 0);
    var rect = this.player.bounds.inflate(this.camera.window.width/4,
					  this.camera.window.height/4);
    this.camera.setCenter(this.world, rect);
  },

  updateScore: function () {
    // [GAME SPECIFIC CODE]
    this.score_node.innerHTML = ('Score: '+this.score);
  },

});
