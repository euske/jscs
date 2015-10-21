// text.js

function Font(glyphs, color)
{
  this.width = glyphs.height;
  this.height = glyphs.height;
  this.glyphs = createCanvas(glyphs.width, glyphs.height);
  var ctx = getEdgeyContext(this.glyphs);
  ctx.clearRect(0, 0, glyphs.width, glyphs.height);
  ctx.drawImage(glyphs, 0, 0);
  ctx.globalCompositeOperation = 'source-in';
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, glyphs.width, glyphs.height);
}

Font.prototype.renderString = function (ctx, text, x, y, scale)
{
  scale = (scale !== undefined)? scale : 1;
  var w = scale*this.width;
  var h = scale*this.height;
  for (var i = 0; i < text.length; i++) {
    var c = text.charCodeAt(i);
    ctx.drawImage(this.glyphs,
		  (c-32)*this.width, 0, this.width, this.height,
		  x+w*i, y, w, h);
  }
};

function TextBox(font, frame, scale, linespace)
{
  Sprite.call(this, null);
  this.font = font;
  this.frame = frame;
  this.scale = (scale !== undefined)? scale : 1;
  this.linespace = (linespace !== undefined)? linespace : 0;
  this.segments = [];
}

TextBox.prototype = Object.create(Sprite.prototype);

TextBox.prototype.toString = function ()
{
  return '<TextBox: '+this.segments+'>';
};

TextBox.prototype.getSize = function (lines)
{
  var n = 0;
  for (var i = 0; i < lines.length; i++) {
    n = Math.max(n, lines[i].length);
  }

  var font = this.font;
  var height = lines.length*(font.height+this.linespace)
  return new Vec2(this.scale*font.width*n,
		  this.scale*height-this.linespace);
}

TextBox.prototype.clearText = function ()
{
  this.segments = [];
};

TextBox.prototype.putText = function (lines, halign, valign)
{
  halign = (halign !== undefined)? halign : 'left';
  valign = (valign !== undefined)? valign : 'top';
  var size = this.getSize(lines);
  var y = this.frame.y;
  switch (valign) {
  case 'center':
    y += (this.frame.height-size.y)/2;
    break;
  case 'bottom':
    y += this.frame.height-size.y;
    break;
  }
  var font = this.font;
  var w = this.scale*font.width;
  for (var i = 0; i < lines.length; i++) {
    var text = lines[i];
    var x = this.frame.x;
    switch (halign) {
    case 'center':
      x += (this.frame.width-w*text.length)/2;
      break;
    case 'right':
      x += this.frame.width-w*text.length;
      break;
    }
    this.segments.push({x:x, y:y, text:text});
    y += this.scale*(font.height+this.linespace);
  }  
};

TextBox.prototype.render = function (ctx, bx, by)
{
  var font = this.font;
  for (var i = 0; i < this.segments.length; i++) {
    var seg = this.segments[i];
    font.renderString(ctx, seg.text, bx+seg.x, by+seg.y, this.scale);
  }  
};
