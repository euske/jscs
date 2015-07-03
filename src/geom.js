// geom.js
// Geometric routines.

// Vec2
function Vec2(x, y)
{
  this.x = x;
  this.y = y;
}
Vec2.prototype.toString = function ()
{
  return '('+this.x+', '+this.y+')';
};
Vec2.prototype.equals = function (p)
{
  return (this.x == p.x && this.y == p.y);
};
Vec2.prototype.copy = function ()
{
  return new Vec2(this.x, this.y);
};
Vec2.prototype.add = function (v)
{
  return new Vec2(this.x+v.x, this.y+v.y);
};
Vec2.prototype.sub = function (v)
{
  return new Vec2(this.x-v.x, this.y-v.y);
};
Vec2.prototype.move = function (dx, dy)
{
  return new Vec2(this.x+dx, this.y+dy);
};

// Vec3
function Vec3(x, y, z)
{
  this.x = x;
  this.y = y;
  this.z = z;
}
Vec3.prototype.toString = function ()
{
  return '('+this.x+', '+this.y+', '+this.z+')';
};
Vec3.prototype.equals = function (p)
{
  return (this.x == p.x && this.y == p.y && this.z == p.z);
};
Vec3.prototype.copy = function ()
{
  return new Vec3(this.x, this.y, this.z);
};
Vec3.prototype.add = function (v)
{
  return new Vec3(this.x+v.x, this.y+v.y, this.z+v.z);
};
Vec3.prototype.sub = function (v)
{
  return new Vec3(this.x-v.x, this.y-v.y, this.z-v.z);
};
Vec3.prototype.move = function (dx, dy, dz)
{
  return new Vec3(this.x+dx, this.y+dy, this.z+dz);
};

// Rectangle
function Rectangle(x, y, width, height)
{
  this.x = x;
  this.y = y;
  this.width = width;
  this.height = height;
}
Rectangle.prototype.toString = function () 
{
  return '('+this.x+', '+this.y+', '+this.width+', '+this.height+')';
};
Rectangle.prototype.equals = function (rect)
{
  return (this.x == rect.x && this.y == rect.y &&
	  this.width == rect.width && this.height == rect.height);
};
Rectangle.prototype.right = function ()
{
  return this.x+this.width;
};
Rectangle.prototype.bottom = function ()
{
  return this.y+this.height;
};
Rectangle.prototype.centerx = function ()
{
  return this.x+this.width/2;
};
Rectangle.prototype.centery = function ()
{
  return this.y+this.height/2;
};
Rectangle.prototype.center = function ()
{
  return new Vec2(this.x+this.width/2, this.y+this.height/2);
};
Rectangle.prototype.copy = function ()
{
  return new Rectangle(this.x, this.y, this.width, this.height);
};
Rectangle.prototype.move = function (dx, dy)
{
  return new Rectangle(this.x+dx, this.y+dy, this.width, this.height);  
};
Rectangle.prototype.inflate = function (dw, dh)
{
  var cx = this.x+this.width/2;
  var cy = this.y+this.height/2;
  dw += this.width;
  dh += this.height;
  return new Rectangle(cx-dw/2, cy-dh/2, dw, dh);
};
Rectangle.prototype.contains = function (x, y)
{
  return (this.x <= x && this.y <= y &&
	  x <= this.x+this.width && y <= this.y+this.height);
};
Rectangle.prototype.overlap = function (rect)
{
  return !(this.x+this.width <= rect.x ||
	   this.y+this.height <= rect.y ||
	   rect.x+rect.width <= this.x ||
	   rect.y+rect.height <= this.y);
};
Rectangle.prototype.union = function (rect)
{
  var x0 = Math.min(this.x, rect.x);
  var y0 = Math.min(this.y, rect.y);
  var x1 = Math.max(this.x+this.width, rect.x+rect.width);
  var y1 = Math.max(this.y+this.height, rect.y+rect.height);
  return new Rectangle(x0, y0, x1-x0, y1-y0);
};
Rectangle.prototype.intersection = function (rect)
{
  var x0 = Math.max(this.x, rect.x);
  var y0 = Math.max(this.y, rect.y);
  var x1 = Math.min(this.x+this.width, rect.x+rect.width);
  var y1 = Math.min(this.y+this.height, rect.y+rect.height);
  return new Rectangle(x0, y0, x1-x0, y1-y0);
};
// collide: 2D collision detection
Rectangle.prototype.collide = function (rect, v)
{
  var x0 = rect.x;
  var x1 = rect.x+rect.width;
  var y0 = rect.y;
  var y1 = rect.y+rect.height;
  var dx, dy;
  var x, y;
  
  do {
    if (0 < v.x) {
      x = this.x+this.width;
    } else if (v.x < 0) {
      x = this.x;
    } else {
      break;
    }
    if (x <= x0 && x0 < x+v.x) {
      dx = x0 - x;
    } else if (x1 <= x && x+v.x < x1) {
      dx = x1 - x;
    } else {
      break;
    }
    dy = v.y*dx / v.x;
    y = this.y+dy;
    if ((v.y <= 0 && y+this.height <= y0) ||
	(0 <= v.y && y1 <= y) ||
	(y+this.height < y0 || y1 < y)) {
      break;
    }
    v.x = dx;
    v.y = dy;
  } while (false);
  
  do {
    if (0 < v.y) {
      y = this.y+this.height;
    } else if (v.y < 0) {
      y = this.y;
    } else {
      break;
    }
    if (y <= y0 && y0 < y+v.y) {
      dy = y0 - y;
    } else if (y1 <= y && y+v.y < y1) {
      dy = y1 - y;
    } else {
      break;
    }
    dx = v.x*dy / v.y;
    x = this.x+dx;
    if ((v.x <= 0 && x+this.width <= x0) ||
	(0 <= v.x && x1 <= x) ||
	(x+this.width < x0 || x1 < x)) {
      break;
    }
    v.x = dx;
    v.y = dy;
  } while (false);

  return v;
};

// Box
function Box(origin, size)
{
  this.origin = origin;
  this.size = size;
}
Box.prototype.toString = function () 
{
  return '('+this.origin+', '+this.size+')';
};
Box.prototype.equals = function (box)
{
  return (this.origin.equals(box.origin) &&
	  this.size.equals(box.size));
};
Box.prototype.center = function ()
{
  return new Vec3(this.origin.x+this.size.x/2,
		  this.origin.y+this.size.y/2,
		  this.origin.z+this.size.z/2);
};
Box.prototype.copy = function ()
{
  return new Box(this.origin.copy(), this.size.copy());
};
Box.prototype.move = function (dx, dy, dz)
{
  return new Box(this.origin.move(dx, dy, dz), this.size);
};
Box.prototype.inflate = function (dx, dy, dz)
{
  var cx = this.origin.x+this.size.x/2;
  var cy = this.origin.y+this.size.y/2;
  var cz = this.origin.z+this.size.z/2;
  dx += this.size.x;
  dy += this.size.y;
  dz += this.size.z;
  return new Box(new Vec3(cx-dx/2, cy-dy/2, cz-dz/2),
		 new Vec3(dx, dy, dz));
};
Box.prototype.contains = function (p)
{
  return (this.origin.x <= p.x && this.origin.y <= p.y && this.origin.z <= p.z &&
	  p.x <= this.origin.x+this.size.x &&
	  p.y <= this.origin.y+this.size.y &&
	  p.z <= this.origin.z+this.size.z);
};
Box.prototype.overlap = function (box)
{
  return !(this.origin.x+this.size.x <= box.origin.x ||
	   this.origin.y+this.size.y <= box.origin.y ||
	   this.origin.z+this.size.z <= box.origin.z ||
	   box.origin.x+box.size.x <= this.origin.x ||
	   box.origin.y+box.size.y <= this.origin.y ||
	   box.origin.z+box.size.z <= this.origin.z);
};
Box.prototype.union = function (box)
{
  var x0 = Math.min(this.x, rect.x);
  var y0 = Math.min(this.y, rect.y);
  var x1 = Math.max(this.x+this.width, rect.x+rect.width);
  var y1 = Math.max(this.y+this.height, rect.y+rect.height);
  return new Rectangle(x0, y0, x1-x0, y1-y0);
};
Box.prototype.intersection = function (box)
{
  var x0 = Math.max(this.origin.x, box.origin.x);
  var y0 = Math.max(this.origin.y, box.origin.y);
  var z0 = Math.max(this.origin.z, box.origin.z);
  var x1 = Math.min(this.origin.x+this.size.x, box.origin.x+box.size.x);
  var y1 = Math.min(this.origin.y+this.size.y, box.origin.y+box.size.y);
  var z1 = Math.min(this.origin.z+this.size.z, box.origin.z+box.size.z);
  return new Box(new Vec3(x0, y0, z0),
		 new Vec3(x1-x0, y1-y0, z1-z0));
};

Box.prototype.collideYZPlane = function (x, v, rect)
{
  var dx, dy, dz;
  if (0 < v.x && this.origin.x+this.size.x <= x) {
    dx = x-this.origin.x+this.size.x;
  } else if (v.x < 0 && x <= this.origin.x) {
    dx = x-this.origin.x;
  } else {
    return v;
  }
  dy = v.y*dx / v.x;
  dz = v.z*dx / v.x;
  if (rect != null) {
    var y = this.origin.y+dy;
    var z = this.origin.z+dz;
    if ((v.y <= 0 && y+this.size.y <= rect.x) ||
	(0 <= v.y && rect.x+rect.width <= y) ||
	(v.z <= 0 && z+this.size.z <= rect.y) ||
	(0 <= v.z && rect.y+rect.height <= z) ||
	!rect.overlap(new Rectangle(y, z, this.size.y, this.size.z))) {
      return v;
    }
  }
  return new Vec3(dx, dy, dz);  
}

Box.prototype.collideZXPlane = function (y, v, rect)
{
  var dx, dy, dz;
  if (0 < v.y && this.origin.y+this.size.y <= y) {
    dy = y-this.origin.y+this.size.y;
  } else if (v.y < 0 && y <= this.origin.y) {
    dy = y-this.origin.y;
  } else {
    return v;
  }
  dz = v.z*dy / v.y;
  dx = v.x*dy / v.y;
  if (rect != null) {
    var z = this.origin.z+dz;
    var x = this.origin.x+dx;
    if ((v.z <= 0 && z+this.size.z <= rect.x) ||
	(0 <= v.z && rect.x+rect.width <= z) ||
	(v.x <= 0 && x+this.size.x <= rect.y) ||
	(0 <= v.x && rect.y+rect.height <= x) ||
	!rect.overlap(new Rectangle(z, x, this.size.z, this.size.x))) {
      return v;
    }
  }
  return new Vec3(dx, dy, dz);  
}

Box.prototype.collideXYPlane = function (z, v, rect)
{
  var dx, dy, dz;
  if (0 < v.z && this.origin.z+this.size.z <= z) {
    dz = z-this.origin.z+this.size.z;
  } else if (v.z < 0 && z <= this.origin.z) {
    dz = z-this.origin.z;
  } else {
    return v;
  }
  dx = v.x*dz / v.z;
  dy = v.y*dz / v.z;
  if (rect != null) {
    var x = this.origin.x+dx;
    var y = this.origin.y+dy;
    if ((v.x <= 0 && x+this.size.x <= rect.x) ||
	(0 <= v.x && rect.x+rect.width <= x) ||
	(v.y <= 0 && y+this.size.y <= rect.y) ||
	(0 <= v.y && rect.y+rect.height <= y) ||
	!rect.overlap(new Rectangle(x, y, this.size.x, this.size.y))) {
      return v;
    }
  }
  return new Vec3(dx, dy, dz);  
}

Box.prototype.collide = function (box, v)
{
  if (0 < v.x) {
    v = this.collideYZPlane(box.origin.x, v,
			    new Rectangle(box.origin.y, box.origin.z,
					  box.size.y, box.size.z));
  } else if (v.x < 0) {
    v = this.collideYZPlane(box.origin.x+box.size.x, v,
			    new Rectangle(box.origin.y, box.origin.z,
					  box.size.y, box.size.z));
  }

  if (0 < v.y) {
    v = this.collideZXPlane(box.origin.y, v,
			    new Rectangle(box.origin.z, box.origin.x,
					  box.size.z, box.size.x));
  } else if (v.y < 0) {
    v = this.collideZXPlane(box.origin.y+box.size.y, v,
			    new Rectangle(box.origin.z, box.origin.x,
					  box.size.z, box.size.x));
  }
  
  if (0 < v.z) {
    v = this.collideZXPlane(box.origin.z, v,
			    new Rectangle(box.origin.x, box.origin.y,
					  box.size.x, box.size.y));
  } else if (v.z < 0) {
    v = this.collideZXPlane(box.origin.z+box.size.z, v,
			    new Rectangle(box.origin.x, box.origin.y,
					  box.size.x, box.size.y));
  }
  
  return v;
};
