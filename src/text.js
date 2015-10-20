// text.js

function Font(glyphs, color)
{
  this.width = glyphs.height;
  this.height = glyphs.height;
  this.scale = 1;
  this.lineSpace = 0;

  this.glyphs = createCanvas(glyphs.width, glyphs.height);
  var ctx = getEdgeyContext(this.glyphs);
  ctx.clearRect(0, 0, glyphs.width, glyphs.height);
  ctx.drawImage(glyphs, 0, 0);
  ctx.globalCompositeOperation = 'source-in';
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, glyphs.width, glyphs.height);
}

Font.prototype.renderString = function (ctx, text, x, y)
{
  var w = this.scale*this.width;
  var h = this.scale*this.height;
  for (var i = 0; i < text.length; i++) {
    var c = text.charCodeAt(i);
    ctx.drawImage(this.glyphs,
		  (c-32)*this.width, 0, this.width, this.height,
		  x+w*i, y, w, h);
  }
};

Font.prototype.getBBox = function (text)
{
  var lines = text.split('\n');
  var n = 0;
  for (var i = 0; i < lines.length; i++) {
    n = Math.max(n, lines[i].length);
  }
  var lineHeight = (this.height+this.lineSpace)
  return new Rectangle(0, 0,
		       this.scale*n*this.width,
		       this.scale*(lines.length*lineHeight-this.lineSpace));
}

Font.prototype.renderText = function (ctx, text, rect, halign, valign)
{
  halign = (halign !== undefined)? halign : 'left';
  valign = (valign !== undefined)? valign : 'top';
  var bbox = this.getBBox(text);
  var y = rect.y;
  switch (valign) {
  case 'center':
    y = rect.y+(rect.height-bbox.height)/2;
    break;
  case 'bottom':
    y = rect.y+rect.height-bbox.height;
    break;
  }
  var lines = text.split('\n');
  var w = this.scale*this.width;
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    var x = rect.x;
    switch (halign) {
    case 'center':
      x = rect.x+(rect.width-w*line.length)/2;
      break;
    case 'right':
      x = rect.x+rect.width-w*line.length;
      break;
    }
    this.renderString(ctx, line, x, y);
    y += this.scale*(this.height+this.lineSpace);
  }  
};
