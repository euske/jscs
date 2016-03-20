// game.js
// [GAME SPECIFIC CODE]

// Thingy
function Thingy(bounds)
{
  this._Actor(bounds, bounds.inflate(-2, -2), S.THINGY);
}

define(Thingy, Actor, 'Actor', {
  render: function (ctx, bx, by) {
    var w = this.bounds.width;
    var h = this.bounds.height;
    var src = this.getSpriteSrc(S.SHADOW, 0);
    drawImageScaled(ctx, Sprite.IMAGE,
		    src.x, src.y, src.width, src.height,
		    bx+this.bounds.x, by+this.bounds.y,
		    w*this.scale.x, h*this.scale.y);
    this._Actor_render(ctx, bx, by);
  },

});


// Player
function Player(tilemap, p)
{
  var bounds = tilemap.map2coord(new Rectangle(p.x, p.y, 1, 1));
  this._Actor(bounds, bounds.inflate(-2, -2), S.PLAYER);
  this.jumpfunc = (function (vz, t) { return (0 <= t && t <= 7)? 8 : vz-2; });
  this.maxspeed = new Vec3(16, 16, 16);
  this.speed = 8;
  this.depth = tilemap.tilesize;
  
  this.tilemap = tilemap;
  this.picked = new Slot(this);
  this.jumped = new Slot(this);

  this.z = 0;
  this.velocity = new Vec3();
  this._jumpt = Infinity;
  this._jumpend = 0;
}

define(Player, Actor, 'Actor', {
  toString: function () {
    return '<Player: '+this.bounds+'>';
  },

  isMovable: function (v0) {
    var v1 = this.getMove3(v0);
    return v1.equals(v0);
  },

  isLanded: function () {
    return (0 <= this.velocity.z && !this.isMovable(new Vec3(0,0,-1)));
  },

  collide: function (actor) {
    if (actor instanceof Thingy) {
      actor.die();
      this.picked.signal();
      var particle = new Actor(actor.bounds, null, S.YAY);
      particle.duration = 30;
      particle.movement = new Vec2(0, -1);
      this.layer.addObject(particle);
    }
  },

  render: function (ctx, bx, by, front) {
    var w = this.bounds.width;
    var h = this.bounds.height;
    var afloat = (this.tilemap.tilesize <= this.z);
    var shadow = true;
    var tilemap = this.tilemap;
    var r = tilemap.coord2map(this.hitbox);
    function isfloor(x,y,c) { return (c == T.FLOOR); }
    var x = bx+this.bounds.x;
    var y = by+this.bounds.y;
    if (front) {
      if (afloat) {
	if (tilemap.apply(isfloor, r) !== null) {
	  var src = this.getSpriteSrc(S.SHADOW, 0);
	  ctx.drawImage(Sprite.IMAGE,
			src.x, src.y, src.width, src.height,
			x, y-h/2, w, h);
	}
      }
    } else if (!afloat) {
      var d = this.z/4;
      var src = this.getSpriteSrc(S.SHADOW, 0);
      ctx.drawImage(Sprite.IMAGE,
		    src.x, src.y, src.width, src.height,
		    x+d, y+d, w-d*2, h-d*2);
    }
    if ((front && afloat) || (!front && !afloat)) {
      var src = this.getSpriteSrc(this.tileno, this.phase);
      ctx.drawImage(Sprite.IMAGE,
		    src.x, src.y, src.width, src.height,
		    x, y-this.z/2, w, h);
    }
  },

  move: function (v) {
    var vz = this.jumpfunc(this.velocity.z, this._jumpt);
    if (this._jumpt < this._jumpend) {
      this._jumpt++;
    } else {
      this._jumpt = Infinity;
    }
    var v3 = this.getMove3(new Vec3(v.x, v.y, vz));
    v3 = v3.clamp(this.maxspeed);
    this.velocity = v3;
    this.z += v3.z;
    this.hitbox = this.hitbox.add(new Vec2(v3.x, v3.y));
    this.bounds = this.bounds.add(new Vec2(v3.x, v3.y));
  },

  getHitbox3: function () {
    return new Box(
      new Vec3(this.hitbox.x, this.hitbox.y, this.z),
      new Vec3(this.hitbox.width, this.hitbox.height, this.depth)
    );
  },

  getContactFor3: function (v0, hitbox) {
    var tilemap = this.tilemap;
    var ts = tilemap.tilesize;
    var bs = new Vec3(ts, ts, ts);
    var ws = new Vec3(ts, ts, 999);
    function f(x, y, c, v) {
      if (T.isWall(c)) {
	var bounds = new Box(new Vec3(x*ts, y*ts, 0), ws);
	v = hitbox.contact(v, bounds);
      } else if (T.isObstacle(c)) {
	var bounds = new Box(new Vec3(x*ts, y*ts, 0), bs);
	v = hitbox.contact(v, bounds);
      }
      return v;
    }
    var r = hitbox.add(v0).union(hitbox);
    r = new Rectangle(r.origin.x, r.origin.y, r.size.x, r.size.y);
    v0 = tilemap.reduce(f, v0, tilemap.coord2map(r));
    v0 = hitbox.contactXYPlane(v0, 0, null);
    return v0;
  },

  getMove3: function (v, hitbox0) {
    var hitbox0 = (hitbox0 !== undefined)? hitbox0 : this.getHitbox3();
    var hitbox = hitbox0;
    var d0 = this.getContactFor3(v, hitbox);
    v = v.sub(d0);
    hitbox = hitbox.add(d0);
    if (v.x != 0) {
      var d1 = this.getContactFor3(new Vec3(v.x,0,0), hitbox);
      v = v.sub(d1);
      hitbox = hitbox.add(d1);
    }
    if (v.y != 0) {
      var d2 = this.getContactFor3(new Vec3(0,v.y,0), hitbox);
      v = v.sub(d2);
      hitbox = hitbox.add(d2);
    }
    if (v.z != 0) {
      var d3 = this.getContactFor3(new Vec3(0,0,v.z), hitbox);
      v = v.sub(d3);
      hitbox = hitbox.add(d3);
    }
    return hitbox.diff(hitbox0);
  },

  setMove: function (v) {
    this.movement = v.scale(this.speed);
  },

  setJump: function (jumpend) {
    if (0 < jumpend) {
      if (this.isLanded()) {
	this._jumpt = 0;
	this.jumped.signal();
      }
    }
    this._jumpend = jumpend;
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

  Sprite.IMAGE = app.images.sprites;
  Sprite.prototype.getSpriteSrc = (function (tileno, phase) {
    return new Rectangle(48*tileno, 48-32, 32, 32);
  });
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
      ctx, bx+dx, by+dy, this.tilemap, this.app.images.tiles, ft);

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
    this.player.setMove(this.app.key_dir);
    this.player.setJump(this.app.key_action? Infinity : 0);
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
