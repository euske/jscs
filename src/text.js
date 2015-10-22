// text.js

function Font(glyphs, color, scale)
{
  scale = (scale !== undefined)? scale : 1;
  this._width0 = glyphs.height;
  this._height0 = glyphs.height;
  this._glyphs = createCanvas(glyphs.width, glyphs.height);
  this.width = scale*this._width0;
  this.height = scale*this._height0;
  var ctx = getEdgeyContext(this._glyphs);
  ctx.clearRect(0, 0, glyphs.width, glyphs.height);
  ctx.drawImage(glyphs, 0, 0);
  ctx.globalCompositeOperation = 'source-in';
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, glyphs.width, glyphs.height);
}

Font.prototype.getSize = function (text)
{
  return new Vec2(this.width * text.length, this.height);
};

Font.prototype.renderString = function (ctx, text, x, y)
{
  for (var i = 0; i < text.length; i++) {
    var c = text.charCodeAt(i);
    ctx.drawImage(this._glyphs,
		  (c-32)*this._width0, 0, this._width0, this._height0,
		  x+this.width*i, y, this.width, this.height);
  }
};

function TextBox(linespace)
{
  Sprite.call(this, null);
  this.linespace = (linespace !== undefined)? linespace : 0;
  this.segments = [];
}

TextBox.prototype = Object.create(Sprite.prototype);

TextBox.prototype.toString = function ()
{
  return '<TextBox: '+this.segments+'>';
};

TextBox.prototype.clear = function ()
{
  this.segments = [];
};

TextBox.prototype.add = function (font, text, x, y)
{
  var seg = {font:font, text:text, x:x, y:y};
  this.segments.push(seg);
  return seg;
}

TextBox.prototype.getSize = function (font, lines)
{
  var w = 0, h = 0;
  for (var i = 0; i < lines.length; i++) {
    var s = font.getSize(lines[i]);
    w = Math.max(w, s.x);
    h = h+s.y+this.linespace;
  }
  return new Vec2(w, h-this.linespace);
}

TextBox.prototype.putText = function (frame, font, lines, halign, valign)
{
  halign = (halign !== undefined)? halign : 'left';
  valign = (valign !== undefined)? valign : 'top';
  var y = frame.y;
  switch (valign) {
  case 'center':
    y += (frame.height-this.getSize(font, lines).y)/2;
    break;
  case 'bottom':
    y += frame.height-this.getSize(font, lines).y;
    break;
  }
  for (var i = 0; i < lines.length; i++) {
    var text = lines[i];
    var s = font.getSize(text);
    var x = frame.x;
    switch (halign) {
    case 'center':
      x += (frame.width-s.x)/2;
      break;
    case 'right':
      x += frame.width-s.x;
      break;
    }
    this.segments.push({font:font, x:x, y:y, text:text});
    y += s.y+this.linespace;
  }  
};

TextBox.prototype.render = function (ctx, bx, by)
{
  for (var i = 0; i < this.segments.length; i++) {
    var seg = this.segments[i];
    seg.font.renderString(ctx, seg.text, bx+seg.x, by+seg.y);
  }  
};
