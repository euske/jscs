// game.js

// [GAME SPECIFIC CODE]


//  Title
//
function Title(app)
{
  TextScene.call(this, app);
  this.text = '<b>Sample Game 2</b><p>Made with JSCS<p>Press Enter to start.';
}

Title.prototype = Object.create(TextScene.prototype);

Title.prototype.change = function ()
{
  this.changeScene(new Level1(this.app));
};

Title.prototype.render = function (ctx, bx, by)
{
  ctx.fillStyle = 'rgb(0,0,0)';
  ctx.fillRect(bx, by, this.app.screen.width, this.app.screen.height);
};


//  GameOver
//
function GameOver(app, score)
{
  TextScene.call(this, app);
  this.text = '<b>Game Over!</b><p><b>Score: '+score+'</b><p>Press Enter to restart.';
  this.music = app.audios.explosion;
}

GameOver.prototype = Object.create(TextScene.prototype);

GameOver.prototype.change = function ()
{
  this.changeScene(new Level1(this.app));
};

GameOver.prototype.render = function (ctx, bx, by)
{
  ctx.fillStyle = 'rgb(0,0,0)';
  ctx.fillRect(bx, by, this.app.screen.width, this.app.screen.height);
};


//  Level1
// 
function Level1(app)
{
  Scene.call(this, app);
  
  this.tilesize = 32;
  //this.music = app.audios.music;
}

Level1.prototype = Object.create(GameScene.prototype);
  
Level1.prototype.render = function (ctx, bx, by)
{
  // [OVERRIDE]
  var tilesize = this.tilesize;
  var window = this.window;
  var tilemap = this.tilemap;
  var dx = -tilesize;
  var dy = (this.app.screen.height-this.window.height)/2;
  var tx = bx+dx-window.x;
  var ty = by+dy-window.y;

  // Fill with the background color.
  ctx.fillStyle = 'rgb(0,128,224)';
  ctx.fillRect(bx+dx, bx+dy, this.window.width, this.window.height);

  var x0 = Math.floor(window.x/tilesize);
  var y0 = Math.floor(window.y/tilesize);
  var x1 = Math.ceil((window.x+window.width)/tilesize);
  var y1 = Math.ceil((window.y+window.height)/tilesize);
  var fx = dx+x0*tilesize-window.x;
  var fy = dy+y0*tilesize-window.y;

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
  var ft = function (x,y) {
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
    var c = tilemap.get(x,y);
    return (c == T.NONE? -1 : c);
  };
  tilemap.renderFromTopRight(
    ctx, this.app.tiles, ft, 
    bx+fx, by+fy, x0, y0, x1-x0+1, y1-y0+1);

  // Draw floating objects.
  for (var i = 0; i < this.sprites.length; i++) {
    var obj = this.sprites[i];
    if (obj.scene !== this) continue;
    if (!obj.visible) continue;
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
};

Level1.prototype.scrollTile = function (vx, vy)
{
  // generate tiles for horizontal scrolling.
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
};

Level1.prototype.moveAll = function (vx, vy)
{
  var tilesize = this.tilesize;
  var window = this.window;
  window.x += vx;
  window.y += vy;
  this.player.move(vx, vy);
  
  var x0 = Math.floor(window.x/tilesize);
  var y0 = Math.floor(window.y/tilesize);
  if (x0 !== 0 || y0 !== 0) {
    // warp all the tiles and characters.
    this.scrollTile(x0, y0);
    var wx = -x0*tilesize;
    var wy = -y0*tilesize;
    window.x += wx;
    window.y += wy;
    for (var i = 0; i < this.sprites.length; i++) {
      var obj = this.sprites[i];
      if (obj.scene !== this) continue;
      if (obj.bounds === null) continue;
      obj.bounds.x += wx;
      obj.bounds.y += wy;
    }
    for (var i = 0; i < this.colliders.length; i++) {
      var obj = this.colliders[i];
      if (obj.scene !== this) continue;
      if (obj.hitbox === null) continue;
      obj.hitbox.x += wx;
      obj.hitbox.y += wy;
    }
  }
};

Level1.prototype.update = function ()
{
  GameScene.prototype.update.call(this);
  this.player.jump(this.app.key_action);
  this.player.usermove(this.app.key_dir.x, this.app.key_dir.y);
  this.moveAll(this.speed.x, this.speed.y);
  if (this.player.hitbox.right() < this.tilesize) {
    this.changeScene(new GameOver(this.app, this.score));
  }
};

Level1.prototype.init = function ()
{
  GameScene.prototype.init.call(this);
  
  // [OVERRIDE]
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

  this.speed = new Vec2(2, 0);
  this.window = new Rectangle(0, 0, this.tilemap.width*this.tilesize, this.tilemap.height*this.tilesize);
  
  var app = this.app;
  var scene = this;
  var rect = new Rectangle(2, 3, 1, 1);
  this.player = new Player(this.tilemap.map2coord(rect));
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
  var textbox = new TextBox(new Rectangle(0, 0, app.screen.width, app.screen.height));
  textbox.putText(app.font, ['GET ALL TEH DAMN THINGIES!'],
		  'center', 'center');
  textbox.bounds = null;
  textbox.duration = app.framerate*2;
  textbox.update = function () {
    TextBox.prototype.update.call(textbox);
    textbox.visible = blink(scene.ticks, app.framerate/2);
  };
  this.addObject(textbox);
};

Level1.prototype.updateScore = function ()
{
  // [GAME SPECIFIC CODE]
  this.score_node.innerHTML = ('Score: '+this.score);
};
