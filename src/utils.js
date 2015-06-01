// utils.js
// Misc. routines.

// log(x): display a thing in the console (Firefox only, maybe)
function log(x)
{
  if (typeof(window.console) !== 'undefined') {
    window.console.log(x);
  }
}

// clamp(v0, v, v1): limit the value within v0-v1.
function clamp(v0, v, v1)
{
  return Math.min(Math.max(v, v0), v1);
}

// blink(t, d): returns true if t is within the on interval.
function blink(t, d)
{
  return ((t % d) < d/2);
}

// rnd(n): returns a random number.
function rnd(a, b)
{
  b = (typeof(b) !== 'undefined')? b : 0;
  if (b < a) {
    var c = a;
    a = b;
    b = c;
  }
  return Math.floor(Math.random()*(b-a))+a;
}

// format: pretty print a number.
function format(v, n, c)
{
  n = (typeof(n) !== 'undefined')? n : 3;
  c = (typeof(c) !== 'undefined')? c : ' ';
  var s = '';
  while (s.length < n) {
    s = (v % 10)+s;
    v /= 10;
    if (v <= 0) break;
  }
  while (s.length < n) {
    s = c+s;
  }
  return s;
}

// copyArray(a): deep copy of an Array.
function copyArray(a)
{
  if (a instanceof Array) {
    var b = new Array(a.length);
    for (var i = 0; i < a.length; i++) {
      b[i] = copyArray(a[i]);
    }
    return b;
  } else {
    return a;
  }
}

// removeArray(a, f): remove objects from a.
function removeArray(a, f)
{
  if (typeof(f) === 'function') {
    for (var i = a.length-1; 0 <= i; i--) {
      if (f(a[i])) {
	a.splice(i, 1);
      }
    }
  } else {
    var i = a.indexOf(f);
    if (0 <= i) {
      a.splice(i, 1);
    }
  }
  return a;
}

// Slot: an event system
function Slot(object)
{
  this.object = object
  this.receivers = [];
}
Slot.prototype.subscribe = function (recv)
{
  this.receivers.push(recv);
};
Slot.prototype.unsubscribe = function (recv)
{
  removeArray(this.receivers, recv);
};
Slot.prototype.signal = function (arg)
{
  for (var i = 0; i < this.receivers.length; i++) {
    this.receivers[i](this.object, arg);
  }
};

// Point
function Point(x, y)
{
  this.x = x;
  this.y = y;
}
Point.prototype.toString = function ()
{
  return '('+this.x+', '+this.y+')';
};
Point.prototype.equals = function (p)
{
  return (this.x == p.x && this.y == p.y);
};
Point.prototype.copy = function ()
{
  return new Point(this.x, this.y);
};
Point.prototype.move = function (dx, dy)
{
  return new Point(this.x+dx, this.y+dy);
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
Rectangle.prototype.copy = function ()
{
  return new Rectangle(this.x, this.y, this.width, this.height);
};
Rectangle.prototype.move = function (dx, dy)
{
  return new Rectangle(this.x+dx, this.y+dy, this.width, this.height);  
};
Rectangle.prototype.inset = function (dw, dh)
{
  var cx = this.x+this.width/2;
  var cy = this.y+this.height/2;
  var w = this.width - dw;
  var h = this.height - dh;
  return new Rectangle(cx-w/2, cy-h/2, w, h);
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
Rectangle.prototype.clamp = function (rect)
{
  var x0 = Math.max(this.x, rect.x);
  var y0 = Math.max(this.y, rect.y);
  var x1 = Math.min(this.x+this.width, rect.x+rect.width);
  var y1 = Math.min(this.y+this.height, rect.y+rect.height);
  return new Rectangle(x0, y0, x1-x0, y1-y0);
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

// collideRect: 2D collision detection
function collideHLine(x0, x1, y, rect, v)
{
  var left = rect.x;
  var right = rect.x+rect.width;
  var top = rect.y;
  var bottom = rect.y+rect.height;
  var dy;
  if (y <= top && top < y+v.y) {
    dy = top - y;
  } else if (bottom <= y && y+v.y < bottom) {
    dy = bottom - y;
  } else {
    return v;
  }
  // assert(v.y != 0);
  var dx = v.x*dy / v.y;
  if ((v.x <= 0 && x1+dx <= left) ||
      (0 <= v.x && right <= x0+dx) ||
      (x1+dx < left || right < x0+dx)) {
    return v;
  }
  return new Point(dx, dy);
}

function collideVLine(y0, y1, x, rect, v)
{
  var left = rect.x;
  var right = rect.x+rect.width;
  var top = rect.y;
  var bottom = rect.y+rect.height;
  var dx;
  if (x <= left && left < x+v.x) {
    dx = left - x;
  } else if (right <= x && x+v.x < right) {
    dx = right - x;
  } else {
    return v;
  }
  // assert(v.x != 0);
  var dy = v.y*dx / v.x;
  if ((v.y <= 0 && y1+dy <= top) ||
      (0 <= v.y && bottom <= y0+dy) ||
      (y1+dy < top || bottom < y0+dy)) {
    return v;
  }
  return new Point(dx, dy);
}

function collideRect(r0, r1, v)
{
  if (0 < v.x) {
    v = collideVLine(r1.y, r1.y+r1.height, r1.x+r1.width, r0, v);
  } else if (v.x < 0) {
    v = collideVLine(r1.y, r1.y+r1.height, r1.x, r0, v);
  }
  if (0 < v.y) {
    v = collideHLine(r1.x, r1.x+r1.width, r1.y+r1.height, r0, v);
  } else if (v.y < 0) {
    v = collideHLine(r1.x, r1.x+r1.width, r1.y, r0, v);
  }
  return v;
}

// removeChildren(n, name): remove all child nodes with the given name.
function removeChildren(n, name)
{
  name = name.toLowerCase();
  // Iterate backwards to simplify array removal. (thanks to @the31)
  for (var i = n.childNodes.length-1; 0 <= i; i--) {
    var c = n.childNodes[i];
    if (c.nodeName.toLowerCase() === name) {
      n.removeChild(c);
    }
  }
}

// createCanvas(width, height): create a canvas with the given size.
function createCanvas(width, height)
{
  var canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

// getEdgeyContext(canvas): returns a pixellated canvas 2D context.
function getEdgeyContext(canvas)
{
  var ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.webkitImageSmoothingEnabled = false;
  ctx.mozImageSmoothingEnabled = false;
  ctx.msImageSmoothingEnabled = false;
  return ctx;
}

// image2array(img): converts an image to 2D array.
function image2array(img)
{
  var header = 1;
  var width = img.width;
  var height = img.height;
  var canvas = createCanvas(width, height);
  var ctx = getEdgeyContext(canvas);
  ctx.drawImage(img, 0, 0);
  var data = ctx.getImageData(0, 0, width, height).data;
  var i = 0;
  var c2v = new Object();
  for (var y = 0; y < header; y++) {
    for (var x = 0; x < width; x++, i+=4) {
      var c = ((data[i] << 16) | (data[i+1] << 8) | data[i+2]); // RGBA
      if (!c2v.hasOwnProperty(c)) {
	c2v[c] = y*width + x;
      }
    }
  }
  var map = new Array(height-header);
  for (var y = 0; y < height-header; y++) {
    var a = new Array(width);
    for (var x = 0; x < width; x++, i+=4) {
      var c = ((data[i] << 16) | (data[i+1] << 8) | data[i+2]); // RGBA
      a[x] = c2v[c];
    }
    map[y] = a;
  }
  return map;
}
