// game.js

// [GAME SPECIFIC CODE]

//  Title
//
function Title(app)
{
  this._TextScene(app);
  this.text = '<b>Sample Game 1</b><p>Made with JSCS<p>Press Enter to start.';
}

define(Title, TextScene, 'TextScene', {
  change: function () {
    this.changeScene(new Level1(this.app));
  },
  
  render: function (ctx, bx, by) {
    ctx.fillStyle = 'rgb(0,0,0)';
    ctx.fillRect(bx, by, this.app.screen.width, this.app.screen.height);
  },

});


//  EndGame
//
function EndGame(app, score)
{
  this._TextScene(app);
  this.text = '<b>You Won!</b><p><b>Score: '+score+'</b><p>Press Enter to restart.';
  this.music = app.audios.ending;
}

define(EndGame, TextScene, 'TextScene', {
  change: function () {
    this.changeScene(new Level1(this.app));
  },

});


//  Level1
// 
function Level1(app)
{
  this._GameScene(app);
  
  this.tilesize = 32;
  this.window = this.frame.copy();
  this.world = this.frame.copy();
  this.music = app.audios.music;
}

define(Level1, GameScene, 'GameScene', {
  setCenter: function (rect) {
    if (this.window.width < rect.width) {
      this.window.x = (rect.width-this.window.width)/2;
    } else if (rect.x < this.window.x) {
      this.window.x = rect.x;
    } else if (this.window.x+this.window.width < rect.x+rect.width) {
      this.window.x = rect.x+rect.width - this.window.width;
    }
    if (this.window.height < rect.height) {
      this.window.y = (rect.height-this.window.height)/2;
    } else if (rect.y < this.window.y) {
      this.window.y = rect.y;
    } else if (this.window.y+this.window.height < rect.y+rect.height) {
      this.window.y = rect.y+rect.height - this.window.height;
    }
    this.window.x = clamp(0, this.window.x, this.world.width-this.window.width);
    this.window.y = clamp(0, this.window.y, this.world.height-this.window.height);
  },

  render: function (ctx, bx, by) {
    // [OVERRIDE]

    // Fill with the background color.
    ctx.fillStyle = 'rgb(0,0,128)';
    ctx.fillRect(bx, by, this.window.width, this.window.height);

    var tilesize = this.tilesize;
    var window = this.window;
    var tilemap = this.tilemap;
    var x0 = Math.floor(window.x/tilesize);
    var y0 = Math.floor(window.y/tilesize);
    var x1 = Math.ceil((window.x+window.width)/tilesize);
    var y1 = Math.ceil((window.y+window.height)/tilesize);
    var fx = x0*tilesize-window.x;
    var fy = y0*tilesize-window.y;

    // Set the drawing order.
    var objs = [];
    for (var i = 0; i < this.sprites.length; i++) {
      var obj = this.sprites[i];
      if (obj.scene !== this) continue;
      if (!obj.visible) continue;
      if (obj.bounds === null) continue;
      var bounds = obj.bounds;
      if (bounds.overlap(window)) {
	var x = Math.floor((bounds.x+bounds.width/2)/tilesize);
	var y = Math.floor((bounds.y+bounds.height/2)/tilesize);
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
    tilemap.renderFromBottomLeft(
      ctx, this.app.tiles, ft, 
      bx+fx, by+fy, x0, y0, x1-x0+1, y1-y0+1);

    // Draw floating objects.
    for (var i = 0; i < this.sprites.length; i++) {
      var obj = this.sprites[i];
      if (obj.scene !== this) continue;
      if (!obj.visible) continue;
      if (obj.bounds === null) {
	obj.render(ctx, bx, by);
      }
      if (obj instanceof Enemy) {
	obj.renderPlan(ctx, bx-window.x, by-window.y);
      }
    }
  },

  init: function () {
    this._GameScene_init();
    
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
      [0,0,0,0, 0,0,0,0, 1,1,1,1, 0,0,0,0, 0,0,0,0],
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
    this.window.width = Math.min(this.world.width, this.window.width);
    this.window.height = Math.min(this.world.height, this.window.height);

    this.collectibles = 0;
    var app = this.app;
    var scene = this;
    var tilemap = this.tilemap;
    var f = function (x,y,c) {
      if (T.isCollectible(c)) {
	var rect = tilemap.map2coord(new Vec2(x,y));
	scene.addObject(new Actor(rect, rect, S.THINGY));
	scene.collectibles++;
	tilemap.set(x, y, T.NONE);
      }
    };
    this.tilemap.apply(null, f);

    var rect = new Rectangle(1, 10, 1, 1);
    this.player = new Player(this.tilemap.map2coord(rect));
    this.addObject(this.player);

    var rect = new Rectangle(10, 10, 1, 1);
    var enemy = new Enemy(this.tilemap.map2coord(rect));
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
      var textbox = new TextBoxTT(new Rectangle(20, 20, app.screen.width-60, 60));
      textbox.addDisplay(app.font, 'GOT A THINGY!', 4);
      textbox.duration = app.framerate*2;
      scene.addObject(textbox);

      // count the score.
      scene.collectibles--;
      if (scene.collectibles === 0) {
	// delay calling.
	scene.addObject(new Task(function (task) {
	  if (task.ticks0+app.framerate < scene.ticks) {
	    scene.changeScene(new EndGame(app, scene.score));
	  }
	}));
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
    var textbox = new TextBox(this.frame);
    textbox.linespace = 4;
    textbox.putText(app.font, ['GET ALL TEH','DAMN THINGIES!'],
		    'center', 'center');
    textbox.duration = app.framerate*2;
    textbox.update = function () {
      TextBox.prototype.update.call(textbox);
      textbox.visible = blink(scene.ticks, app.framerate/2);
    };
    this.addObject(textbox);
  },

  update: function () {
    this._GameScene_update();
    
    // [GAME SPECIFIC CODE]
    this.player.usermove(this.app.key_dir.x, this.app.key_dir.y);
    this.player.jump(this.app.key_action);
    var rect = this.player.bounds.inflate(this.window.width/2, this.window.height/2);
    this.setCenter(rect);
  },

  updateScore: function () {
    // [GAME SPECIFIC CODE]
    this.score_node.innerHTML = ('Score: '+this.score);
  },

});
