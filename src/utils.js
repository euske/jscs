// utils.js

// log(x)
function log(x)
{
  if (typeof(window.console) !== 'undefined') {
    window.console.log(x);
  }
}

// clamp(v0, v, v1)
function clamp(v0, v, v1)
{
  return Math.min(Math.max(v, v0), v1);
}
  
// rnd(n)
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

// format
function format(v, n, c)
{
  n = (typeof(n) !== 'undefined')? n : 3;
  c = (typeof(c) !== 'undefined')? c : " ";
  var s = "";
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

// Point
function pt_make(x, y)
{
  return {x:x, y:y};
}
function pt_move(p, dx, dy)
{
  return {x:(p.x+dx), y:(p.y+dy)};
}
function pt_str(p)
{
  return "("+p.x+", "+p.y+")";
}

// Rectangle
function rect_make(x, y, width, height)
{
  return {x:x, y:y, width:width, height:height};
}
function rect_move(rect, dx, dy)
{
  return {x:(rect.x+dx), y:(rect.y+dy), width:rect.width, height:rect.height};
}
function rect_str(rect)
{
  return "("+rect.x+", "+rect.y+", "+rect.width+", "+rect.height+")";
}

// collideRect
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
  var dx = Math.floor(v.x*dy / v.y);
  if ((v.x <= 0 && x1+dx <= left) ||
      (0 <= v.x && right <= x0+dx) ||
      (x1+dx < left || right < x0+dx)) {
    return v;
  }
  return pt_make(dx, dy);
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
  var dy = Math.floor(v.y*dx / v.x);
  if ((v.y <= 0 && y1+dy <= top) ||
      (0 <= v.y && bottom <= y0+dy) ||
      (y1+dy < top || bottom < y0+dy)) {
    return v;
  }
  return pt_make(dx, dy);
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
