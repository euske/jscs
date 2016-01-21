// game.js

// [GAME SPECIFIC CODE]

// Thingy
function Thingy(bounds)
{
  var hitbox = bounds.inflate(-2, -2);
  this._Actor(bounds, hitbox, S.THINGY);
}

define(Thingy, Actor, 'Actor', {
  render: function (ctx, x, y) {
    var sprites = this.layer.app.sprites;
    var tw = sprites.height;
    var w = this.bounds.width;
    var h = this.bounds.height;
    ctx.drawImage(sprites,
		  S.SHADOW*tw, tw-h, w, h,
		  x+this.bounds.x, y+this.bounds.y, w, h);
    this._Actor_render(ctx, x, y);
  },

});


// Player
function Player(scene, p)
{
  this.tilemap = scene.tilemap;
  var bounds = this.tilemap.map2coord(new Rectangle(p.x, p.y, 1, 1));
  var hitbox = bounds.inflate(-2, -2);
  this._Actor(bounds, hitbox, S.PLAYER);
  this.speed = 8;
  this.gravity = -2;
  this.maxspeed = -16;
  this.jumpfunc = (function (t) { return (t < 8)? 10 : 8-2*(t-8); });
  
  this.picked = new Slot(this);
  this.jumped = new Slot(this);

  this.z = 0;
  this._gz = 0;
  this._jumpt = -1;
}

define(Player, Actor, 'Actor', {
  toString: function () {
    return '<Player: '+this.bounds+'>';
  },

  collide: function (actor) {
    if (actor instanceof Actor && actor.tileno == S.THINGY) {
      actor.die();
      this.picked.signal();
      var particle = new Actor(actor.bounds, null, S.YAY);
      particle.duration = 30;
      particle.movement = new Vec2(0, -1);
      this.layer.addObject(particle);
    }
  },

  update: function () {
    if (0 <= this._jumpt) {
      this._gz = this.jumpfunc(this._jumpt);
      this._jumpt++;
    }
    this._gz = Math.max(this._gz + this.gravity, this.maxspeed);
  },

  render: function (ctx, x, y, front) {
    var sprites = this.layer.app.sprites;
    var tw = sprites.height;
    var w = this.bounds.width;
    var h = this.bounds.height;
    var afloat = (this.tilemap.tilesize <= this.z);
    var shadow = true;
    var tilemap = this.tilemap;
    var r = tilemap.coord2map(this.hitbox);
    function isfloor(x,y,c) { return (c == T.FLOOR); }
    x += this.bounds.x;
    y += this.bounds.y;
    if (front) {
      if (afloat) {
	if (tilemap.apply(isfloor, r) !== null) {
	  ctx.drawImage(sprites,
			S.SHADOW*tw, tw-h, w, h,
			x, y-h/2, w, h);
	}
      }
    } else if (!afloat) {
      var d = this.z/4;
      ctx.drawImage(sprites,
		    S.SHADOW*tw, tw-h, w, h,
		    x+d, y+d, w-d*2, h-d*2);
    }
    if ((front && afloat) || (!front && !afloat)) {
      ctx.drawImage(sprites,
		    this.tileno*tw, tw-h, w, h,
		    x, y-this.z/2, w, h);
    }
  },

  move: function (v) {
    var v = this.getMove(new Vec3(v.x, v.y, this._gz));
    this.bounds = this.bounds.add(v);
    this.hitbox = this.hitbox.add(v);
    return v;
  },

  usermove: function (vx, vy) {
    var v = this.move(new Vec2(vx*this.speed, vy*this.speed));
    if (v !== null) {
      this.z += v.z;
      this._gz = v.z;
    }
  },

  contactTile: function (p, v0) {
    var tilemap = this.tilemap;
    var ts = tilemap.tilesize;
    var bs = new Vec3(ts, ts, ts);
    var ws = new Vec3(ts, ts, 999);
    var box = new Box(p, new Vec3(this.hitbox.width, this.hitbox.height, ts));
    function f(x, y, c, v) {
      if (T.isWall(c)) {
	var bounds = new Box(new Vec3(x*ts, y*ts, 0), ws);
	v = box.contact(v, bounds);
      } else if (T.isObstacle(c)) {
	var bounds = new Box(new Vec3(x*ts, y*ts, 0), bs);
	v = box.contact(v, bounds);
      }
      return v;
    }
    var r = box.add(v0).union(box);
    r = new Rectangle(r.origin.x, r.origin.y, r.size.x, r.size.y);
    v0 = tilemap.reduce(f, v0, tilemap.coord2map(r));
    v0 = box.contactXYPlane(v0, 0, null);
    return v0;
  },

  getMove: function (v) {
    var p = new Vec3(this.hitbox.x, this.hitbox.y, this.z);
    var d0 = this.contactTile(p, v);
    p = p.add(d0);
    v = v.sub(d0);
    var d1 = this.contactTile(p, new Vec3(v.x,0,0));
    p = p.add(d1);
    v = v.sub(d1);
    var d2 = this.contactTile(p, new Vec3(0,v.y,0));
    p = p.add(d2);
    v = v.sub(d2);
    var d3 = this.contactTile(p, new Vec3(0,0,v.z));
    return new Vec3(d0.x+d1.x+d2.x+d3.x,
		    d0.y+d1.y+d2.y+d3.y, 
		    d0.z+d1.z+d2.z+d3.z);
  },

  jump: function (jumping) {
    if (jumping) {
      var p = new Vec3(this.hitbox.x, this.hitbox.y, this.z);
      var v = new Vec3(0, 0, this._gz);
      var d = this.contactTile(p, v);
      if (this._gz < 0 && d.z === 0) {
	this._jumpt = 0;
	this.jumped.signal();
      }
    } else {
      this._jumpt = -1;
    }
  },

});


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
	  var b = a.bounds;
	  if (a instanceof Player) {
	    a.render(ctx, tx, ty, false);
	  } else if (a instanceof Thingy) {
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
      if (obj.layer === null) continue;
      if (obj.bounds === null) {
	obj.render(ctx, bx, by);
      } else if (obj.hitbox === null) {
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
	this.tilemap.set(x, y, T.BLOCK);
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
      this.layer.scroll(vw);
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
    this.player = new Player(this, new Vec2(2,3));
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
