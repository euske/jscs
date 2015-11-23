// geom.js
// Geometric routines.

// Vec2
function Vec2(x, y)
{
  this.x = (x !== undefined)? x : 0;
  this.y = (y !== undefined)? y : 0;
}
Point = Vec2;
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
Vec2.prototype.norm = function ()
{
  return Math.sqrt(this.x*this.x + this.y*this.y);
};
Vec2.prototype.add = function (v)
{
  return new Vec2(this.x+v.x, this.y+v.y);
};
Vec2.prototype.sub = function (v)
{
  return new Vec2(this.x-v.x, this.y-v.y);
};
Vec2.prototype.modify = function (v)
{
  return new Vec2(this.x*v, this.y*v);
};
Vec2.prototype.distance = function (v)
{
  return this.sub(v).norm();
};
Vec2.prototype.rotate90 = function (v)
{
  if (v < 0) {
    return new Vec2(this.y, -this.x);
  } else if (0 < v) {
    return new Vec2(-this.y, this.x);
  } else {
    return this.copy();
  }
};
Vec2.prototype.move = function (dx, dy)
{
  return new Vec2(this.x+dx, this.y+dy);
};
Vec2.prototype.anchor = function (dx, dy, vx, vy)
{
  var x, y;
  vx = (vx !== undefined)? vx : 0;
  vy = (vy !== undefined)? vy : 0;
  if (0 < vx) {
    x = this.x;
  } else if (vx < 0) {
    x = this.x-dx;
  } else {
    x = this.x-dx/2;
  }
  if (0 < vy) {
    y = this.y;
  } else if (vy < 0) {
    y = this.y-dy;
  } else {
    y = this.y-dy/2;
  }
  return new Vec2(x, y);
};

// Vec3
function Vec3(x, y, z)
{
  this.x = (x !== undefined)? x : 0;
  this.y = (y !== undefined)? y : 0;
  this.z = (z !== undefined)? z : 0;
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
Vec3.prototype.norm = function ()
{
  return Math.sqrt(this.x*this.x + this.y*this.y + this.z*this.z);
};
Vec3.prototype.add = function (v)
{
  return new Vec3(this.x+v.x, this.y+v.y, this.z+v.z);
};
Vec3.prototype.sub = function (v)
{
  return new Vec3(this.x-v.x, this.y-v.y, this.z-v.z);
};
Vec3.prototype.modify = function (v)
{
  return new Vec3(this.x*v, this.y*v, this.z*v);
};
Vec3.prototype.distance = function (v)
{
  return this.sub(v).norm();
};
Vec3.prototype.move = function (dx, dy, dz)
{
  return new Vec3(this.x+dx, this.y+dy, this.z+dz);
};

// Rectangle
function MakeRect(p, w, h, vx, vy)
{
  p = p.anchor(w, h, vx, vy);
  return new Rectangle(p.x, p.y, w, h);
}
function Rectangle(x, y, width, height)
{
  this.x = x;
  this.y = y;
  this.width = (width !== undefined)? width : 0;
  this.height = (height !== undefined)? height : 0;
}
Rect = Rectangle;
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
Rectangle.prototype.topleft = function ()
{
  return new Vec2(this.x, this.y);
};
Rectangle.prototype.topright = function ()
{
  return new Vec2(this.x+this.width, this.y);
};
Rectangle.prototype.bottomleft = function ()
{
  return new Vec2(this.x, this.y+this.height);
};
Rectangle.prototype.bottomright = function ()
{
  return new Vec2(this.x+this.width, this.y+this.height);
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
Rectangle.prototype.moveTo = function (x, y)
{
  return new Rectangle(x-this.width/2, y-this.height/2, this.width, this.height);  
};
Rectangle.prototype.inflate = function (dw, dh)
{
  var cx = this.x+this.width/2;
  var cy = this.y+this.height/2;
  dw += this.width;
  dh += this.height;
  return new Rectangle(cx-dw/2, cy-dh/2, dw, dh);
};
Rectangle.prototype.contains = function (p)
{
  return (this.x <= p.x && this.y <= p.y &&
	  p.x <= this.x+this.width && p.y <= this.y+this.height);
};
Rectangle.prototype.containsRect = function (rect)
{
  return (this.x <= rect.x &&
	  this.y <= rect.y &&
	  rect.x+rect.width <= this.x+this.width &&
	  rect.y+rect.height <= this.y+this.height);
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
Rectangle.prototype.clamp = function (rect)
{
  var x = ((rect.width < this.width)? rect.centerx() :
	   clamp(rect.x, this.x, rect.x+rect.width-this.width));
  var y = ((rect.height < this.height)? rect.centery() :
	   clamp(rect.y, this.y, rect.y+rect.height-this.height));
  return new Rectangle(x, y, this.width, this.height);
};
Rectangle.prototype.rndpt = function ()
{
  return new Vec2(this.x+rnd(this.width),
		  this.y+rnd(this.height));
};

Rectangle.prototype.contactVLine = function (v, x, y0, y1)
{
  var dx, dy;
  var x0 = this.x;
  var x1 = this.x+this.width;
  if (x <= x0 && x0+v.x < x) {
    dx = x-x0;
  } else if (x1 <= x && x < x1+v.x) {
    dx = x-x1;
  } else {
    return v;
  }
  dy = v.y*dx / v.x;
  y = this.y+dy;
  if (y+this.height < y0 || y1 < y ||
      (y+this.height == y0 && v.y <= 0) ||
      (y1 == y && 0 <= v.y)) {
    return v;
  }
  return new Vec2(dx, dy);
};

Rectangle.prototype.contactHLine = function (v, y, x0, x1)
{
  var dx, dy;
  var y0 = this.y;
  var y1 = this.y+this.height;
  if (y <= y0 && y0+v.y < y) {
    dy = y-y0;
  } else if (y1 <= y && y < y1+v.y) {
    dy = y-y1;
  } else {
    return v;
  }
  dx = v.x*dy / v.y;
  x = this.x+dx;
  if (x+this.width < x0 || x1 < x ||
      (x+this.width == x0 && v.x <= 0) ||
      (x1 == x && 0 <= v.x)) {
    return v;
  }
  return new Vec2(dx, dy);
};

Rectangle.prototype.contact = function (v, rect)
{
  assert(!this.overlap(rect), 'rect overlapped');
  
  if (0 < v.x) {
    v = this.contactVLine(v, rect.x, rect.y, rect.y+rect.height);
  } else if (v.x < 0) {
    v = this.contactVLine(v, rect.x+rect.width, rect.y, rect.y+rect.height);
  }

  if (0 < v.y) {
    v = this.contactHLine(v, rect.y, rect.x, rect.x+rect.width);
  } else if (v.y < 0) {
    v = this.contactHLine(v, rect.y+rect.height, rect.x, rect.x+rect.width);
  }

  assert(!this.move(v.x,v.y).overlap(rect), 'rect overlapped 2');
  return v;
};

// Box
function Box(origin, size)
{
  this.origin = origin;
  this.size = (size !== undefined)? size : new Vec3();
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
Box.prototype.movev = function (v)
{
  return new Box(this.origin.add(v), this.size);
};
Box.prototype.moveTo = function (p)
{
  return new Box(new Vec3(p.x-this.size.x/2,
			  p.y-this.size.y/2,
			  p.z-this.size.z/2),
		 this.size);
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
  var x0 = Math.min(this.origin.x, box.origin.x);
  var y0 = Math.min(this.origin.y, box.origin.y);
  var z0 = Math.min(this.origin.z, box.origin.z);
  var x1 = Math.max(this.origin.x+this.size.x, box.origin.x+box.size.x);
  var y1 = Math.max(this.origin.y+this.size.y, box.origin.y+box.size.y);
  var z1 = Math.max(this.origin.z+this.size.z, box.origin.z+box.size.z);
  return new Box(new Vec3(x0, y0, z0),
		 new Vec3(x1-x0, y1-y0, z1-z0));
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
Box.prototype.clamp = function (box)
{
  var x = ((box.size.x < this.size.x)? (box.origin.x+box.size.x/2) :
	   clamp(box.origin.x, this.origin.x, box.origin.x+box.size.x-this.size.x));
  var y = ((box.size.y < this.size.y)? (box.origin.y+box.size.y/2) :
	   clamp(box.origin.y, this.origin.y, box.origin.y+box.size.y-this.size.y));
  var z = ((box.size.z < this.size.z)? (box.origin.z+box.size.z/2) :
	   clamp(box.origin.z, this.origin.z, box.origin.z+box.size.z-this.size.z));
  return new Box(new Vec3(x, y, z), this.size);
};
Box.prototype.rndpt = function ()
{
  return new Vec3(this.origin.x+rnd(this.size.x),
		  this.origin.y+rnd(this.size.y),
		  this.origin.z+rnd(this.size.z));
};

Box.prototype.contactYZPlane = function (v, x, rect)
{
  var dx, dy, dz;
  var x0 = this.origin.x;
  var x1 = this.origin.x+this.size.x;
  if (x <= x0 && x0+v.x < x) {
    dx = x-x0;
  } else if (x1 <= x && x < x1+v.x) {
    dx = x-x1;
  } else {
    return v;
  }
  dy = v.y*dx / v.x;
  dz = v.z*dx / v.x;
  if (rect !== null) {
    var y = this.origin.y+dy;
    var z = this.origin.z+dz;
    if (y+this.size.y < rect.x || rect.x+rect.width < y ||
	z+this.size.z < rect.y || rect.y+rect.height < z ||
	(y+this.size.y == rect.x && v.y <= 0) ||
	(rect.x+rect.width == y && 0 <= v.y) ||
	(z+this.size.z == rect.y && v.z <= 0) ||
	(rect.y+rect.height == z && 0 <= v.z)) {
      return v;
    }
  }
  return new Vec3(dx, dy, dz);
};

Box.prototype.contactZXPlane = function (v, y, rect)
{
  var dx, dy, dz;
  var y0 = this.origin.y;
  var y1 = this.origin.y+this.size.y;
  if (y <= y0 && y0+v.y < y) {
    dy = y-y0;
  } else if (y1 <= y && y < y1+v.y) {
    dy = y-y1;
  } else {
    return v;
  }
  dz = v.z*dy / v.y;
  dx = v.x*dy / v.y;
  if (rect !== null) {
    var z = this.origin.z+dz;
    var x = this.origin.x+dx;
    if (z+this.size.z < rect.x || rect.x+rect.width < z ||
	x+this.size.x < rect.y || rect.y+rect.height < x ||
	(z+this.size.z == rect.x && v.z <= 0) ||
	(rect.x+rect.width == z && 0 <= v.z) ||
	(x+this.size.x == rect.y && v.x <= 0) ||
	(rect.y+rect.height == x && 0 <= v.x)) {
      return v;
    }
  }
  return new Vec3(dx, dy, dz);  
};

Box.prototype.contactXYPlane = function (v, z, rect)
{
  var dx, dy, dz;
  var z0 = this.origin.z;
  var z1 = this.origin.z+this.size.z;
  if (z <= z0 && z0+v.z < z) {
    dz = z-z0;
  } else if (z1 <= z && z < z1+v.z) {
    dz = z-z1;
  } else {
    return v;
  }
  dx = v.x*dz / v.z;
  dy = v.y*dz / v.z;
  if (rect !== null) {
    var x = this.origin.x+dx;
    var y = this.origin.y+dy;
    if (x+this.size.x < rect.x || rect.x+rect.width < x ||
	y+this.size.y < rect.y || rect.y+rect.height < y ||
	(x+this.size.x == rect.x && v.x <= 0) ||
	(rect.x+rect.width == x && 0 <= v.x) ||
	(y+this.size.y == rect.y && v.y <= 0) ||
	(rect.y+rect.height == y && 0 <= v.y)) {
      return v;
    }
  }
  return new Vec3(dx, dy, dz);  
};

Box.prototype.contact = function (v, box)
{
  assert(!this.overlap(box), 'box overlapped');
  
  if (0 < v.x) {
    v = this.contactYZPlane(v, box.origin.x, 
			    new Rectangle(box.origin.y, box.origin.z,
					  box.size.y, box.size.z));
  } else if (v.x < 0) {
    v = this.contactYZPlane(v, box.origin.x+box.size.x, 
			    new Rectangle(box.origin.y, box.origin.z,
					  box.size.y, box.size.z));
  }

  if (0 < v.y) {
    v = this.contactZXPlane(v, box.origin.y, 
			    new Rectangle(box.origin.z, box.origin.x,
					  box.size.z, box.size.x));
  } else if (v.y < 0) {
    v = this.contactZXPlane(v, box.origin.y+box.size.y, 
			    new Rectangle(box.origin.z, box.origin.x,
					  box.size.z, box.size.x));
  }
  
  if (0 < v.z) {
    v = this.contactXYPlane(v, box.origin.z, 
			    new Rectangle(box.origin.x, box.origin.y,
					  box.size.x, box.size.y));
  } else if (v.z < 0) {
    v = this.contactXYPlane(v, box.origin.z+box.size.z, 
			    new Rectangle(box.origin.x, box.origin.y,
					  box.size.x, box.size.y));
  }
  
  assert(!this.movev(v).overlap(box), 'box overlapped 2');
  return v;
};
