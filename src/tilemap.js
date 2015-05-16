// tilemap.js
// TileMap is a generic class that handles a scrollable map.

function TileMap(tilesize, map)
{
  this.tilesize = tilesize;
  this.map = map;
  this.width = map[0].length;
  this.height = map.length;
  this.rangemap = {};
}

TileMap.prototype.get = function (x, y)
{
  if (0 <= x && 0 <= y && x < this.width && y < this.height) {
    return this.map[y][x];
  } else {
    return -1;
  }
};

TileMap.prototype.set = function (x, y, v)
{
  if (0 <= x && 0 <= y && x < this.width && y < this.height) {
    this.map[y][x] = v;
  }
};

TileMap.prototype.coord2map = function (rect)
{
  var ts = this.tilesize;
  var x0 = Math.floor(rect.x/ts);
  var y0 = Math.floor(rect.y/ts);
  var x1, y1;
  if (rect instanceof Rectangle) {
    x1 = Math.ceil((rect.x+rect.width)/ts);
    y1 = Math.ceil((rect.y+rect.height)/ts);
  } else {
    x1 = x0+1;
    y1 = y0+1;
  }
  return new Rectangle(x0, y0, x1-x0, y1-y0);
};

TileMap.prototype.map2coord = function (rect)
{
  var ts = this.tilesize;
  if (rect instanceof Rectangle) {
    return new Rectangle(rect.x*ts, rect.y*ts,
			 rect.width*ts, rect.height*ts);
  } else {
    return new Rectangle(rect.x*ts, rect.y*ts, ts, ts);
  }
};

TileMap.prototype.apply = function (rect, f)
{
  if (rect == null) {
    rect = new Rectangle(0, 0, this.width, this.height);
  }
  for (var dy = 0; dy < rect.height; dy++) {
    for (var dx = 0; dx < rect.width; dx++) {
      if (f(rect.x+dx, rect.y+dy)) {
	return true;
      }
    }
  }
  return false;
};

TileMap.prototype.collide = function (rect, v, f)
{
  if (rect == null) return false;
  var ts = this.tilesize;
  var r = rect.move(v.x, v.y).union(rect);
  var x0 = Math.floor(r.x/ts);
  var y0 = Math.floor(r.y/ts);
  var x1 = Math.ceil((r.x+r.width)/ts);
  var y1 = Math.ceil((r.y+r.height)/ts);
  for (var y = y0; y < y1; y++) {
    for (var x = x0; x < x1; x++) {
      if (f(x, y)) {
	var bounds = new Rectangle(x*ts, y*ts, ts, ts);
	v = collideRect(bounds, rect, v);
      }
    }
  }
  return v;
};

TileMap.prototype.getRange = function (f)
{
  var map = this.rangemap[f];
  if (map === undefined) {
    map = new RangeMap(this, f);
    this.rangemap[f] = map;
  }
  return map;
}

TileMap.prototype.render = function (ctx, tiles, ft, depth, fd,
				     x0, y0, x, y, w, h)
{
  // Sort tiles in the depth order.
  for (var dy = 0; dy < h; dy++) {
    for (var dx = 0; dx < w; dx++) {
      var d = fd(x+dx, y+dy);
      if (0 <= d && d < depth.length) {
	var c = ft(x+dx, y+dy);
	if (0 <= c) {
	  depth[d].push({ c:c, dx:dx, dy:dy });
	}
      }
    }
  }
  
  // Align the pos to the bottom left corner.
  var ts = this.tilesize;
  var tw = tiles.height;
  y0 = y0+ts-tw;
  for (var d = 0; d < depth.length; d++) {
    var a = depth[d];
    for (var i = 0; i < a.length; i++) {
      var obj = a[i];
      if (typeof(obj) === 'function') {
	obj();
      } else {
	ctx.drawImage(tiles,
		      tw*obj.c, 0, tw, tw,
		      x0+ts*obj.dx, y0+ts*obj.dy, tw, tw);
      }
    }
  }
};
