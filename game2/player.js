// player.js

// [GAME SPECIFIC CODE]

// FixedSprite
function FixedSprite(bounds, duration, tileno)
{
  this._Sprite(bounds);
  this.duration = duration;
  this.tileno = tileno;
}

define(FixedSprite, Sprite, 'Sprite', {
  update: function () {
    this._Sprite_update();
    this.bounds.y -= 1;
  },

  render: function (ctx, x, y) {
    var sprites = this.scene.app.sprites;
    var tw = sprites.height;
    var w = this.bounds.width;
    var h = this.bounds.height;
    ctx.drawImage(sprites,
		  this.tileno*tw, tw-h, w, h,
		  x+this.bounds.x, y+this.bounds.y, w, h);
  },

});


// Thingy
function Thingy(bounds)
{
  var hitbox = bounds.inflate(-2, -2);
  this._Actor(bounds, hitbox, S.THINGY);
}

define(Thingy, Actor, 'Actor', {
  render: function (ctx, x, y) {
    var sprites = this.scene.app.sprites;
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
function Player(bounds)
{
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
      this.pick(actor);
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
    var sprites = this.scene.app.sprites;
    var tw = sprites.height;
    var w = this.bounds.width;
    var h = this.bounds.height;
    var afloat = (this.scene.tilesize <= this.z);
    var shadow = true;
    var tilemap = this.scene.tilemap;
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

  move: function (vx, vy) {
    var v = this.getMove(new Vec3(vx, vy, this._gz));
    this._Actor_move(v.x, v.y);
    return v;
  },

  usermove: function (vx, vy) {
    var v = this.move(vx*this.speed, vy*this.speed);
    if (v !== null) {
      this.z += v.z;
      this._gz = v.z;
    }
  },

  contactTile: function (p, v0) {
    var tilemap = this.scene.tilemap;
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
    var r = box.movev(v0).union(box);
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

  pick: function (a) {
    a.die();
    this.picked.signal();
    // show a particle.
    var particle = new FixedSprite(a.bounds, this.scene.app.framerate, S.YAY);
    this.scene.addObject(particle);
  },

});
