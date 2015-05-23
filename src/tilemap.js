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
      var x = rect.x+dx, y = rect.y+dy;
      if (f(x, y)) {
	return new Point(x,y);
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
	// assert(!rect.move(v.x, v.y).overlap(bounds));
      }
    }
  }
  return v;
};

TileMap.prototype.getMove = function (rect, v, f)
{
  var vx = v.x;
  var vy = v.y;
  var d1 = this.collide(rect, new Point(vx, vy), f);
  rect = rect.move(d1.x, d1.y);
  vx -= d1.x;
  vy -= d1.y;
  var d2 = this.collide(rect, new Point(vx, 0), f);
  rect = rect.move(d2.x, d2.y);
  vx -= d2.x;
  vy -= d2.y;
  var d3 = this.collide(rect, new Point(0, vy), f);
  return new Point(d1.x+d2.x+d3.x, d1.y+d2.y+d3.y);
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

TileMap.prototype.render = function (ctx, tiles, ft, 
				     bx, by, x0, y0, w, h)
{
  // Align the pos to the bottom left corner.
  var ts = this.tilesize;
  var tw = tiles.height;
  by = by+ts-tw;
  // Draw tiles from the bottom-left first.
  for (var dy = h-1; 0 <= dy; dy--) {
    for (var dx = 0; dx < w; dx++) {
      var c = ft(x0+dx, y0+dy);
      if (0 <= c) {
	ctx.drawImage(tiles,
		      tw*c, 0, tw, tw,
		      bx+ts*dx, by+ts*dy, tw, tw);
      }
    }
  }
};
