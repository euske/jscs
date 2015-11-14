// utils.js
// Misc. routines.

// aliases
int = Math.floor;
upperbound = Math.min;
lowerbound = Math.max;

// log(x): display a thing in the console (Firefox only, maybe)
function log(x)
{
  if (window.console !== undefined) {
    window.console.log(x);
  }
}

// assert(x, msg): throw an exception if the condition is not met.
function assert(x, msg)
{
  if (!x) {
    throw new Error(msg);
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

// rnd(a, b): returns a random number.
function frnd(a, b)
{
  b = (b !== undefined)? b : 0;
  if (b < a) {
    var c = a;
    a = b;
    b = c;
  }
  return a+(Math.random()*(b-a));
}

function rnd(a, b)
{
  return int(frnd(a, b));
}

// format: pretty print a number.
function format(v, n, c)
{
  n = (n !== undefined)? n : 3;
  c = (c !== undefined)? c : ' ';
  var s = '';
  while (s.length < n) {
    s = (v % 10)+s;
    v = Math.floor(v/10);
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
  var c2v = {};
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

// makeSprites: make sprites/tiles from the Sheet.
function makeSprites(sheet, tw, needflip)
{
  var th = sheet.height;
  var sprites = createCanvas(sheet.width*2, th);
  var ctx = getEdgeyContext(sprites);
  var src = Math.floor(sheet.width/tw);
  var dst = 0;
  var map = {};
  function add(i, flip) {
    ctx.save();
    if (flip) {
      ctx.translate((dst+1)*tw, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(sheet, i*tw, 0, tw, th, 0, 0, tw, th);
    } else {
      ctx.drawImage(sheet, i*tw, 0, tw, th, dst*tw, 0, tw, th);
      map[i] = dst;
    }
    ctx.restore();
    dst++;
  }
  for (var i = 0; i < src; i++) {
    add(i, false);
    if (needflip.hasOwnProperty(i)) {
      add(i, true);
    }
  }
  
  return sprites;
}

// playSound(sound): play a sound resource.
function playSound(sound)
{
  sound.currentTime = 0;
  sound.play();
}

// Slot: an event system
function Slot(object)
{
  this.object = object;
  this.receivers = [];
}
Slot.prototype.toString = function ()
{
  return ('<Slot('+this.object+') '+this.receivers+'>');
};

Slot.prototype.subscribe = function (recv)
{
  this.receivers.push(recv);
};

Slot.prototype.unsubscribe = function (recv)
{
  removeArray(this.receivers, recv);
};

Slot.prototype.signal = function ()
{
  for (var i = 0; i < this.receivers.length; i++) {
    var args = Array.prototype.slice.call(arguments);
    args.unshift(this.object);
    this.receivers[i].apply(null, args);
  }
};
