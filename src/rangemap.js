// rangemap.js

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
