// rangemap.js

function RangeMap(tilemap, f)
{
  var data = new Array(tilemap.height+1);
  var row0 = new Int32Array(tilemap.width+1);
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

RangeMap.prototype.get = function (x0, y0, x1, y1)
{
  var t:int;
  if (x1 < x0) {
    t = x0; x0 = x1; x1 = t;
  }
  if (y1 < y0) {
    t = y0; y0 = y1; y1 = t;
  }
  x0 = clamp(-1, x0-1, this.width-1);
  y0 = clamp(-1, y0-1, this.height-1);
  x1 = clamp(0, x1, this.width);
  y1 = clamp(0, y1, this.height);
  return (this.data[y1][x1] - 
	  ((x0<0 || y0<0)? 0 : this.data[y0][x0]) -
	  ((y0<0)? 0 : this.data[y0][x1]) -
	  ((x0<0)? 0 : this.data[y1][x0]));
}

RangeMap.prototype.exists = function (rect)
{
  return (this.get(rect.x, rect.y,
		   rect.x+rect.width,
		   rect.y+rect.height) != 0);
}
