// level.js

// [GAME SPECIFIC CODE]

//  Scene0
//
function Scene0(game)
{
  TextScene.call(this, game);
  this.text = '<b>Sample Game 1</b><p>Made with JSCS<p>Press Enter to start.';
}

Scene0.prototype = Object.create(TextScene.prototype);

Scene0.prototype.change = function ()
{
  this.changeScene(new Level1(this.game));
}


//  EndGame
//
function EndGame(game, score)
{
  TextScene.call(this, game);
  this.text = '<b>You Won!</b><p><b>Score:'+score+'</b><p>Press Enter to restart.';
  this.music = game.audios.ending;
}

EndGame.prototype = Object.create(TextScene.prototype);

EndGame.prototype.change = function ()
{
  this.changeScene(new Level1(this.game));
}


//  Level1
// 
function Level1(game)
{
  GameScene.call(this, game);
  
  this.tilesize = 32;
  this.window = new Rectangle(0, 0, game.screen.width, game.screen.height);
  this.world = new Rectangle(0, 0, game.screen.width, game.screen.height);
  this.music = game.audios.music;
}

Level1.prototype = Object.create(GameScene.prototype);
  
Level1.prototype.setCenter = function (rect)
{
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
};

Level1.prototype.render = function (ctx, bx, by)
{
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
  var ft = function (x,y) {
    var k = x+','+y;
    if (objs.hasOwnProperty(k)) {
      var r = objs[k];
      for (var i = 0; i < r.length; i++) {
	var a = r[i];
	a.render(ctx, bx-window.x, by-window.y);
      }
    }
    var c = tilemap.get(x,y);
    return (c == T.NONE? -1 : c);
  };
  tilemap.renderFromBottomLeft(
    ctx, this.game.tiles, ft, 
    bx+fx, by+fy, x0, y0, x1-x0+1, y1-y0+1);

  // Draw floating objects.
  for (var i = 0; i < this.sprites.length; i++) {
    var obj = this.sprites[i];
    if (obj.scene !== this) continue;
    if (obj.bounds === null) {
      obj.render(ctx, bx, by);
    }
    if (obj instanceof Enemy) {
      obj.renderPlan(ctx, bx, by);
    }
  }
};

Level1.prototype.init = function ()
{
  GameScene.prototype.init.call(this);
  
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
  var game = this.game;
  var scene = this;
  var tilemap = this.tilemap;
  var f = function (x,y) {
    if (T.isCollectible(tilemap.get(x,y))) {
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
    playSound(game.audios.jump);
  }
  function player_picked(e) {
    playSound(game.audios.pick);
    scene.score++;
    scene.updateScore();
    
    // show a balloon.
    var frame = game.frame;
    var text = 'Got a thingy!';
    var e = game.addElement(new Rectangle(20, 20, frame.width-60, 60))
    e.align = 'left';
    e.style.padding = '10px';
    e.style.color = 'black';
    e.style.background = 'white';
    e.style.border = 'solid black 2px';
    var i = 0;
    function balloon(task) {
      if ((scene.ticks % 2) == 0) {
	if (i < text.length) {
	  i++;
	  e.innerHTML = text.substring(0, i);
	} else {
	  game.removeElement(e);
	  task.alive = false;
	}
      }
    }
    scene.addObject(new Task(balloon));

    // count the score.
    scene.collectibles--;
    if (scene.collectibles == 0) {
      // delay calling.
      scene.addObject(new Task(function (task) {
	if (task.ticks0+game.framerate < scene.ticks) {
	  scene.change('WON', scene.score);
	}
      }));
    }
  }
  this.player.picked.subscribe(player_picked);
  this.player.jumped.subscribe(player_jumped);

  this.score_node = game.addElement(new Rectangle(10, 10, 160, 32));
  this.score_node.align = 'left';
  this.score_node.style.color = 'white';
  this.score_node.style['font-size'] = '150%';
  this.score_node.style['font-weight'] = 'bold';
  this.score = 0;
  this.updateScore();

  // show a banner.
  var banner = new Sprite(null);
  banner.update = function () {
    banner.alive = (scene.ticks < banner.ticks0+game.framerate*2);
  };
  banner.render = function (ctx, x, y) {
    if (blink(scene.ticks, game.framerate/2)) {
      game.renderString(game.images.font_w, 'GET ALL TEH DAMN THINGIES!', 1,
			x+scene.window.width/2, y+50, 'center');
    }
  };
  this.addObject(banner);
};

Level1.prototype.move = function (vx, vy)
{
  // [GAME SPECIFIC CODE]
  this.player.usermove(vx, vy);
  var rect = this.player.bounds.inflate(this.window.width/2, this.window.height/2);
  this.setCenter(rect);
};

Level1.prototype.action = function (action)
{
  // [GAME SPECIFIC CODE]
  this.player.jump(action);
};

Level1.prototype.updateScore = function ()
{
  // [GAME SPECIFIC CODE]
  this.score_node.innerHTML = ('Score: '+this.score);
};

Level1.prototype.change = function (state, score)
{
  this.changeScene(new EndGame(this.game, score));
}
