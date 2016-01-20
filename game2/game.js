// game.js

// [GAME SPECIFIC CODE]


//  Title
//
function Title(app)
{
  this._TextScene(app);
  this.text = '<b>Sample Game 2</b><p>Made with JSCS<p>Press Enter to start.';
}

define(Title, TextScene, 'TextScene', {
  change: function () {
    this.changeScene(new Game(this.app));
  },

});


//  GameOver
//
function GameOver(app, score)
{
  this._TextScene(app);
  this.text = '<b>Game Over!</b><p><b>Score: '+score+'</b><p>Press Enter to restart.';
}

define(GameOver, TextScene, 'TextScene', {
  init: function () {
    this._TextScene_init();
    this.app.set_music(this.app.audios.explosion);
    this.app.lockKeys();
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
}

define(Game, GameScene, 'GameScene', {
  render: function (ctx, bx, by) {
    var ts = this.tilesize;
    var window = this.camera.window;
    var dx = -ts;
    var dy = (this.screen.height-window.height)/2;
    var tx = bx+dx-window.x;
    var ty = by+dy-window.y;

    // Set the drawing order.
    var objs = [];
    for (var i = 0; i < this.sprites.length; i++) {
      var obj = this.sprites[i];
      if (obj.scene === null) continue;
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
	  var b = a.bounds;
	  if (a instanceof FixedSprite) {
	    ;
	  } else if (a instanceof Player) {
	    a.render(ctx, tx, ty, false);
	  } else {
	    a.render(ctx, tx, ty);
	  }
	}
      }
      return (c == T.NONE? -1 : c);
    };
    // Fill with the background color.
    ctx.fillStyle = 'rgb(0,128,224)';
    ctx.fillRect(bx+dx, bx+dy, window.width, window.height);
    this.camera.renderTilesFromTopRight(
      ctx, bx+dx, by+dy, this.tilemap, this.app.tiles, ft);

    // Draw floating objects.
    for (var i = 0; i < this.sprites.length; i++) {
      var obj = this.sprites[i];
      if (!obj.visible) continue;
      if (obj.scene === null) continue;
      if (obj.bounds === null) {
	obj.render(ctx, bx, by);
      } else if (obj instanceof FixedSprite) {
	var bounds = obj.bounds;
	if (bounds.overlap(window)) {
	  obj.render(ctx, tx, ty);
	}
      } else if (obj instanceof Player) {
	var bounds = obj.bounds;
	if (bounds.overlap(window)) {
	  obj.render(ctx, tx, ty, true);
	}
      }
    }
  },

  scrollTiles: function (vx, vy) {
    // generate tiles for horizontal scrolling.
    // Leftmost objects are scrolled out and rotated from right.
    for (var x = 0; x < vx; x++) {
      for (var y = 1; y < this.tilemap.height-1; y++) {
	this.tilemap.set(x, y, T.NONE);
      }
      if (rnd(10) === 0) {
	var y = rnd(1, this.tilemap.height-1);
	this.tilemap.set(x, y, T.WALL);
      }
      if (rnd(3) === 0) {
	var y = rnd(1, this.tilemap.height-1);
	this.tilemap.set(x, y, T.FLOOR);
      }
      if (rnd(3) === 0) {
	var y = rnd(1, this.tilemap.height-1);
	var rect = new Rectangle(x+this.tilemap.width, y, 1, 1);
	rect = this.tilemap.map2coord(rect);
	this.addObject(new Thingy(rect));
	this.tilemap.set(x, y, T.NONE);
      }
    }
    this.tilemap.scroll(null, vx, vy);
  },

  moveAll: function (v) {
    var ts = this.tilesize;
    this.camera.move(v);
    this.player.move(v);
    
    var window = this.camera.window;
    var x0 = int(window.x/ts);
    var y0 = int(window.y/ts);
    if (x0 !== 0 || y0 !== 0) {
      // warp all the tiles and characters.
      this.scrollTiles(x0, y0);
      var vw = new Vec2(-x0*ts, -y0*ts);
      this.camera.move(vw);
      for (var i = 0; i < this.sprites.length; i++) {
	var obj = this.sprites[i];
	if (obj.scene === null) continue;
	if (obj.bounds === null) continue;
	obj.bounds.x += vw.x;
	obj.bounds.y += vw.y;
      }
      for (var i = 0; i < this.colliders.length; i++) {
	var obj = this.colliders[i];
	if (obj.scene === null) continue;
	if (obj.hitbox === null) continue;
	obj.hitbox.x += vw.x;
	obj.hitbox.y += vw.y;
      }
    }
  },

  tick: function () {
    this._GameScene_tick();
    this.player.jump(this.app.key_action);
    this.player.usermove(this.app.key_dir.x, this.app.key_dir.y);
    this.moveAll(this.speed);
    if (this.player.hitbox.right() < this.tilesize) {
      this.changeScene(new GameOver(this.app, this.score));
    }
  },

  init: function () {
    this._GameScene_init();
    
    // [GAME SPECIFIC CODE]
    var map = new Array(7);
    for (var y = 0; y < map.length; y++) {
      var row = new Array(12);
      for (var x = 0; x < row.length; x++) {
	row[x] = (y === 0 || y == map.length-1)? T.WALL : T.NONE;
      }
      map[y] = row;
    }
    this.tilemap = new TileMap(this.tilesize, map);

    var ts = this.tilesize;
    this.speed = new Vec2(2, 0);
    this.camera = new Camera(new Rectangle(0, 0, this.tilemap.width*ts, this.tilemap.height*ts));
    this.addObject(this.camera);
    
    var app = this.app;
    var scene = this;
    this.player = new Player(this.tilemap, new Vec2(2,3));
    this.addObject(this.player);
    
    function player_jumped(e) {
      playSound(app.audios.jump);
    }
    function player_picked(e) {
      playSound(app.audios.pick);
      scene.score++;
      scene.updateScore();
      scene.speed.x++;
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
    textbox.putText(['GET ALL TEH DAMN THINGIES!'], 'center', 'center');
    textbox.bounds = null;
    textbox.duration = app.framerate*2;
    textbox.update = function () {
      textbox.visible = blink(scene.ticks, app.framerate/2);
    };
    this.addObject(textbox);
  },

  updateScore: function () {
    // [GAME SPECIFIC CODE]
    this.score_node.innerHTML = ('Score: '+this.score);
  },

});
