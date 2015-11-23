// text.js

// Font
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
    var c = text.charCodeAt(i)-32;
    ctx.drawImage(this._glyphs,
		  c*this._width0, 0, this._width0, this._height0,
		  x+this.width*i, y, this.width, this.height);
  }
};


// TextBox
function TextBox(frame, linespace, background)
{
  Sprite.call(this, null);
  this.frame = frame;
  this.linespace = (linespace !== undefined)? linespace : 0;
  this.background = (background !== undefined)? background : null;
  this.segments = [];
}

TextBox.prototype = Object.create(Sprite.prototype);

TextBox.prototype.toString = function ()
{
  return '<TextBox: '+this.segments+'>';
};

TextBox.prototype.render = function (ctx, bx, by)
{
  if (this.bounds !== null) {
    bx += this.bounds.x;
    by += this.bounds.y;
  }
  bx += this.frame.x;
  by += this.frame.y;
  if (this.background !== null) {
    ctx.fillStyle = this.background;
    ctx.fillRect(bx, by, this.frame.width, this.frame.height);
  }
  for (var i = 0; i < this.segments.length; i++) {
    var seg = this.segments[i];
    seg.font.renderString(ctx, seg.text, bx+seg.bounds.x, by+seg.bounds.y);
  }  
};

TextBox.prototype.clear = function ()
{
  this.segments = [];
};

TextBox.prototype.add = function (font, bounds, text)
{
  var seg = {font:font, bounds:bounds, text:text};
  this.segments.push(seg);
  return seg;
}

TextBox.prototype.addNewline = function (font)
{
  var x = 0;
  var y = 0;
  if (this.segments.length !== 0) {
    y = this.segments[this.segments.length-1].bounds.bottom()+this.linespace;
  }
  var newseg = this.add(font, new Rectangle(x, y, 0, font.height), '');
  var dy = newseg.bounds.bottom() - this.frame.height;
  if (0 < dy) {
    for (var i = this.segments.length-1; 0 <= i; i--) {
      var seg = this.segments[i];
      seg.bounds.y -= dy;
      if (seg.bounds.y < 0) {
	this.segments.splice(i, 1);
      }
    }
  }
  return newseg;
}

TextBox.prototype.addText = function (font, text)
{
  for (var i = 0; i < text.length; ) {
    if (text[i] == '\n') {
      this.addNewline(font);
      i++;
      continue;
    }
    var j = text.indexOf('\n', i);
    if (j < 0) {
      j = text.length; 
    }
    var s = text.substring(i, j);
    var size = font.getSize(s);
    var last = ((this.segments.length === 0)? null :
		this.segments[this.segments.length-1]);	
    if (last === null ||
	this.frame.width < last.bounds.right()+size.x) {
      last = this.addNewline(font);
    } else if (last.font !== font) {
      var bounds = new Rectangle(last.bounds.right(), last.bounds.y);
      last = this.add(font, bounds, '');
    }
    last.text += s;
    last.bounds.width += size.x;
    last.bounds.height = Math.max(last.bounds.height, size.y);
    i = j;
  }
};

TextBox.prototype.getSize = function (font, lines)
{
  var w = 0, h = 0;
  for (var i = 0; i < lines.length; i++) {
    var size = font.getSize(lines[i]);
    w = Math.max(w, size.x);
    h = h+size.y+this.linespace;
  }
  return new Vec2(w, h-this.linespace);
}

TextBox.prototype.putText = function (font, lines, halign, valign)
{
  halign = (halign !== undefined)? halign : 'left';
  valign = (valign !== undefined)? valign : 'top';
  var y = 0;
  switch (valign) {
  case 'center':
    y += (this.frame.height-this.getSize(font, lines).y)/2;
    break;
  case 'bottom':
    y += this.frame.height-this.getSize(font, lines).y;
    break;
  }
  for (var i = 0; i < lines.length; i++) {
    var text = lines[i];
    var size = font.getSize(text);
    var x = 0;
    switch (halign) {
    case 'center':
      x += (this.frame.width-size.x)/2;
      break;
    case 'right':
      x += this.frame.width-size.x;
      break;
    }
    var bounds = new Rectangle(x, y, size.x, size.y);
    this.segments.push({font:font, bounds:bounds, text:text});
    y += size.y+this.linespace;
  }  
};

// PauseTask
function PauseTask(ticks)
{
  Task.call(this);
  this.duration = ticks;
}

PauseTask.prototype = Object.create(Task.prototype);

PauseTask.prototype.ff = function ()
{
  this.die();
};

// TextTask
function TextTask(textbox, font, text, interval, sound)
{
  Task.call(this);
  this.textbox = textbox;
  this.font = font;
  this.text = text;
  this.interval = (interval !== undefined)? interval : 0;
  this.sound = (sound !== undefined)? sound : null;
  this.ended = new Slot();
  this._index = 0;
}

TextTask.prototype = Object.create(Task.prototype);

TextTask.prototype.update = function ()
{
  if (this.text.length <= this._index) {
    this.die();
  } else if (this.interval === 0 ||
	     (this.scene.ticks % this.interval) === 0) {
    this.textbox.addText(this.font, this.text.substr(this._index, 1));
    this._index++;
    if (this.sound !== null) {
      playSound(this.sound);
    }
  }
};

TextTask.prototype.ff = function ()
{
  this.textbox.addText(this.font, this.text.substr(this._index));
  this._index = this.text.length;
  this.die();
};

// TextBoxTT
function TextBoxTT(frame, linespace, background)
{
  TextBox.call(this, frame, linespace, background);
  this.interval = 0;
  this.sound = null;
  this.queue = [];
}

TextBoxTT.prototype = Object.create(TextBox.prototype);

TextBoxTT.prototype.update = function ()
{
  TextBox.prototype.update.call(this);
  while (true) {
    var task = this.getCurrentTask();
    if (task === null) break;
    if (task.scene === null) {
      task.start(this.scene);
    }
    task.update();
    if (task.scene !== null) break;
    this.queue.shift();
  }
};

TextTask.prototype.ff = function ()
{
  while (true) {
    var task = this.getCurrentTask();
    if (task === null) break;
    if (task.scene === null) {
      task.start(this.scene);
    }
    task.ff();
    if (task.scene !== null) break;
    this.queue.shift();
  }
};

TextBoxTT.prototype.getCurrentTask = function ()
{
  return (0 < this.queue.length)? this.queue[0] : null;
};

TextBoxTT.prototype.addPause = function (ticks)
{
  var task = new PauseTask(ticks);
  this.queue.push(task);
  return task;
};

TextBoxTT.prototype.addTask = function (font, text, interval, sound)
{
  interval = (interval !== undefined)? interval : this.interval;
  sound = (sound !== undefined)? sound : this.sound;
  var task = new TextTask(this, font, text, interval, sound);
  this.queue.push(task);
  return task;
};
