// tilemap.js
// TileMap is a generic class that handles a scrollable map.
//   requires: utils.js
//   requires: geom.js
'use strict';

//  TileMap
//
function TileMap(tilesize, map)
{
  this.tilesize = tilesize;
  this.map = map;
  this.width = map[0].length;
  this.height = map.length;
  this.rangemap = {};
}

define(TileMap, Object, '', {
  get: function (x, y) {
    if (0 <= x && 0 <= y && x < this.width && y < this.height) {
      return this.map[y][x];
    } else {
      return -1;
    }
  },

  set: function (x, y, v) {
    if (0 <= x && 0 <= y && x < this.width && y < this.height) {
      this.map[y][x] = v;
    }
    this.rangemap = {};
  },

  copy: function () {
    return new TileMap(this.tilesize, copyArray(this.map));
  },

  coord2map: function (rect) {
    var ts = this.tilesize;
    if (rect instanceof Rectangle) {
      var x0 = Math.floor(rect.x/ts);
      var y0 = Math.floor(rect.y/ts);
      var x1 = Math.ceil((rect.x+rect.width)/ts);
      var y1 = Math.ceil((rect.y+rect.height)/ts);
      return new Rectangle(x0, y0, x1-x0, y1-y0);
    } else {
      var x = int(rect.x/ts);
      var y = int(rect.y/ts);
      return new Rectangle(x, y, 1, 1);
    }
  },

  map2coord: function (rect) {
    var ts = this.tilesize;
    if (rect instanceof Rectangle) {
      return new Rectangle(rect.x*ts, rect.y*ts,
			   rect.width*ts, rect.height*ts);
    } else {
      return new Rectangle(rect.x*ts, rect.y*ts, ts, ts);
    }
  },

  apply: function (f, rect) {
    if (rect === undefined) {
      rect = new Rectangle(0, 0, this.width, this.height);
    }
    for (var dy = 0; dy < rect.height; dy++) {
      var y = rect.y+dy;
      for (var dx = 0; dx < rect.width; dx++) {
	var x = rect.x+dx;
	var c = this.get(x, y);
	if (f(x, y, c)) {
	  return new Vec2(x,y);
	}
      }
    }
    return null;
  },

  findTile: function (rect, f0) {
    function f(x, y, c) {
      return f0(c);
    }
    return this.apply(f, this.coord2map(rect));
  },

  reduce: function (f, v, rect) {
    if (rect === undefined) {
      rect = new Rectangle(0, 0, this.width, this.height);
    }
    for (var dy = 0; dy < rect.height; dy++) {
      var y = rect.y+dy;
      for (var dx = 0; dx < rect.width; dx++) {
	var x = rect.x+dx;
	var c = this.get(x, y);
	v = f(x, y, c, v);
      }
    }
    return v;
  },
  
  contactTile: function (rect, f0, v0) {
    var ts = this.tilesize;
    function f(x, y, c, v) {
      if (f0(c)) {
	var bounds = new Rectangle(x*ts, y*ts, ts, ts);
	v = rect.contact(v, bounds);
      }
      return v;
    }
    var r = rect.movev(v0).union(rect);
    return this.reduce(f, v0, this.coord2map(r));
  },
  
  scroll: function (rect, vx, vy) {
    if (rect === null) {
      rect = new Rectangle(0, 0, this.width, this.height);
    }
    var src = [];
    for (var dy = 0; dy < rect.height; dy++) {
      var a = [];
      for (var dx = 0; dx < rect.width; dx++) {
	a.push(this.map[rect.y+dy][rect.x+dx]);
      }
      src.push(a);
    }
    for (var dy = 0; dy < rect.height; dy++) {
      for (var dx = 0; dx < rect.width; dx++) {
	var x = (dx+vx + rect.width) % rect.width;
	var y = (dy+vy + rect.height) % rect.height;
	this.map[rect.y+dy][rect.x+dx] = src[y][x];
      }
    }
  },

  getRangeMap: function (f) {
    var map = this.rangemap[f];
    if (map === undefined) {
      map = new RangeMap(this, f);
      this.rangemap[f] = map;
    }
    return map;
  },

  renderFromBottomLeft: function (
    ctx, tiles, ft, 
    bx, by, x0, y0, w, h) {
    // Align the pos to the bottom left corner.
    var ts = this.tilesize;
    var tw = tiles.height;
    by = by+ts-tw;
    // Draw tiles from the bottom-left first.
    for (var dy = h-1; 0 <= dy; dy--) {
      var y = y0+dy;
      for (var dx = 0; dx < w; dx++) {
	var x = x0+dx;
	var c = this.get(x, y);
	c = ft(x, y, c);
	if (0 <= c) {
	  ctx.drawImage(tiles,
			tw*c, 0, tw, tw,
			bx+ts*dx, by+ts*dy, tw, tw);
	}
      }
    }
  },

  renderFromTopRight: function (
    ctx, tiles, ft, 
    bx, by, x0, y0, w, h) {
    // Align the pos to the bottom left corner.
    var ts = this.tilesize;
    var tw = tiles.height;
    by = by+ts-tw;
    // Draw tiles from the top-right first.
    for (var dy = 0; dy < h; dy++) {
      var y = y0+dy;
      for (var dx = w-1; 0 <= dx; dx--) {
	var x = x0+dx;
	var c = this.get(x, y);
	c = ft(x, y, c);
	if (0 <= c) {
	  ctx.drawImage(tiles,
			tw*c, 0, tw, tw,
			bx+ts*dx, by+ts*dy, tw, tw);
	}
      }
    }
  },

});


//  RangeMap
//
function RangeMap(tilemap, f)
{
  var data = new Array(tilemap.height+1);
  var row0 = new Int32Array(tilemap.width+1);
  for (var x = 0; x < tilemap.width; x++) {
    row0[x+1] = 0;
  }
  data[0] = row0;
  for (var y = 0; y < tilemap.height; y++) {
    var row1 = new Int32Array(tilemap.width+1);
    var n = 0;
    for (var x = 0; x < tilemap.width; x++) {
      if (f(tilemap.get(x, y))) {
	n++;
      }
      row1[x+1] = row0[x+1] + n;
    }
    data[y+1] = row1;
    row0 = row1;
  }
  this.width = tilemap.width;
  this.height = tilemap.height;
  this.data = data;
}

define(RangeMap, Object, '', {
  get: function (x0, y0, x1, y1) {
    var t;
    if (x1 < x0) {
      t = x0; x0 = x1; x1 = t;
      // assert(x0 <= x1);
    }
    if (y1 < y0) {
      t = y0; y0 = y1; y1 = t;
      // assert(y0 <= y1);
    }
    x0 = clamp(0, x0, this.width);
    y0 = clamp(0, y0, this.height);
    x1 = clamp(0, x1, this.width);
    y1 = clamp(0, y1, this.height);
    return (this.data[y1][x1] - this.data[y1][x0] -
	    this.data[y0][x1] + this.data[y0][x0]);
  },

  exists: function (rect) {
    return (this.get(rect.x, rect.y,
		     rect.x+rect.width,
		     rect.y+rect.height) !== 0);
  },

  // findSimplePath(x0, y0, x1, x1, cb): 
  //   returns a list of points that a character can proceed without being blocked.
  //   returns null if no such path exists. This function takes O(w*h).
  //   Note: this returns only a straightforward path without any detour.
  findSimplePath: function (x0, y0, x1, y1, cb) {
    var a = [];
    var w = Math.abs(x1-x0);
    var h = Math.abs(y1-y0);
    var INF = (w+h+1)*2;
    var vx = (x0 <= x1)? +1 : -1;
    var vy = (y0 <= y1)? +1 : -1;
    var cbx0 = cb.x, cbx1 = cb.right();
    var cby0 = cb.y, cby1 = cb.bottom();
    
    for (var dy = 0; dy <= h; dy++) {
      a.push([]);
      // y: y0...y1
      var y = y0+dy*vy;
      for (var dx = 0; dx <= w; dx++) {
	// x: x0...x1
	var x = x0+dx*vx;
	// for each point, compare the cost of (x-1,y) and (x,y-1).
	var p = new Vec2(x, y);
	var d;
	var e = null;	// the closest neighbor (if exists).
	if (dx === 0 && dy === 0) {
	  d = 0;
	} else {
	  d = INF;
	  if (!this.get(x+cbx0, y+cby0, x+cbx1, y+cby1)) {
	    if (0 < dx && a[dy][dx-1].d < d) {
	      e = a[dy][dx-1];
	      d = e.d;
	    }
	    if (0 < dy && a[dy-1][dx].d < d) {
	      e = a[dy-1][dx];
	      d = e.d;
	    }
	  }
	  d++;
	}
	// populate a[dy][dx].
	a[dy].push({p:p, d:d, next:e});
      }
    }
    // trace them in a reverse order: from goal to start.
    var r = [];
    var e = a[h][w];
    while (e !== null) {
      r.push(e.p);
      e = e.next;
    }
    return r;
  },

});
