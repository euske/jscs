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
function TextBox(frame, linespace, padding, background)
{
  Sprite.call(this, null);
  this.frame = frame;
  this.linespace = (linespace !== undefined)? linespace : 0;
  this.padding = (padding !== undefined)? padding : 0;
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
  if (this.background !== null) {
    var rect = this.frame.inflate(this.padding, this.padding);
    ctx.fillStyle = this.background;
    ctx.fillRect(bx+rect.x, by+rect.y, rect.width, rect.height);
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

TextBox.prototype.add = function (font, pt, text)
{
  var size = font.getSize(text);
  var bounds = new Rectangle(pt.x, pt.y, size.x, size.y);
  var seg = {font:font, bounds:bounds, text:text};
  this.segments.push(seg);
  return seg;
}

TextBox.prototype.addNewline = function (font)
{
  var x = this.frame.x;
  var y = this.frame.y;
  if (this.segments.length !== 0) {
    y = this.segments[this.segments.length-1].bounds.bottom()+this.linespace;
  }
  var newseg = this.add(font, new Vec2(x, y), '');
  var dy = newseg.bounds.bottom() - this.frame.height;
  if (0 < dy) {
    for (var i = this.segments.length-1; 0 <= i; i--) {
      var seg = this.segments[i];
      seg.bounds.y -= dy;
      if (seg.bounds.y < this.frame.y) {
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
      var pt = new Vec2(last.bounds.right(), last.bounds.y);
      last = this.add(font, pt, '');
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
  var y = this.frame.y;
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
    var x = this.frame.x;
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

// TextTask
function TextTask()
{
  Task.call(this);
}

TextTask.prototype = Object.create(Task.prototype);

TextTask.prototype.ff = function ()
{
};

TextTask.prototype.keydown = function (key)
{
  this.ff();
};

// PauseTask
function PauseTask(ticks)
{
  TextTask.call(this);
  this.duration = ticks;
}

PauseTask.prototype = Object.create(TextTask.prototype);

PauseTask.prototype.ff = function ()
{
  this.die();
};

// DisplayTask
function DisplayTask(textbox, font, text, interval, sound)
{
  TextTask.call(this);
  this.textbox = textbox;
  this.font = font;
  this.text = text;
  this.interval = (interval !== undefined)? interval : 0;
  this.sound = (sound !== undefined)? sound : null;
  this.ended = new Slot();
  this._index = 0;
}

DisplayTask.prototype = Object.create(TextTask.prototype);

DisplayTask.prototype.update = function ()
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

DisplayTask.prototype.ff = function ()
{
  this.textbox.addText(this.font, this.text.substr(this._index));
  this._index = this.text.length;
  this.die();
};

DisplayTask.prototype.keydown = function (key)
{
  TextTask.prototype.keydown.call(this, key);
};

// MenuTask
function MenuTask(textbox, font, items, sound)
{
  TextTask.call(this);
  this.textbox = textbox;
  this.font = font;
  this.items = items;
  this.sound = (sound !== undefined)? sound : null;
  this.current = null;
}

MenuTask.prototype = Object.create(TextTask.prototype);

MenuTask.prototype.start = function (scene)
{
  Task.prototype.start.call(this, scene);
  for (var i = 0; i < this.items.length; i++) {
    var item = this.items[i];
    this.textbox.add(this.font, item.pos, item.text);
  }
  this.updateCursor();
};

MenuTask.prototype.keydown = function (key)
{
  var vx = 0, vy = 0;
  switch (key) {
  case 37:			// LEFT
  case 65:			// A
  case 72:			// H
  case 81:			// Q (AZERTY)
    vx = -1;
    break;
  case 39:			// RIGHT
  case 68:			// D
  case 76:			// L
    vx = +1;
    break;
  case 38:			// UP
  case 87:			// W
  case 75:			// K
    vy = -1;
    break;
  case 40:			// DOWN
  case 83:			// S
  case 74:			// J
    vy = +1;
    break;
  case 13:			// ENTER
  case 16:			// SHIFT
  case 32:			// SPACE
  case 90:			// Z
  case 88:			// X
    break;
  }
  
  var d0 = 0;
  var choice = null;
  for (var i = 0; i < this.items.length; i++) {
    var item = this.items[i];
    var d1 = ((choice === null)? 0 :
	      ((item.pos.x-choice.x)*vx +
	       (item.pos.y-choice.y)*vy));
    if (choice === null || d0 < d1) {
      d0 = d1;
      choice = item;
    }
  }
  if (this.sound !== null) {
    playSound(this.sound);
  }
  this.current = choice;
  this.updateCursor();
};

MenuTask.prototype.updateCursor = function ()
{
  if (this.current !== null) {
    this.textbox.cursor = new Rectangle(
      this.current.pos.x, this.current.pos.y,
      this.font.width, this.font.height);
  }
};


// TextBoxTT
function TextBoxTT(frame, linespace, padding, background)
{
  TextBox.call(this, frame, linespace, padding, background);
  this.interval = 0;
  this.sound = null;
  this.queue = [];
  this.cursor = null;
  this.blinking = 0;
}

TextBoxTT.prototype = Object.create(TextBox.prototype);

TextBoxTT.prototype.render = function (ctx, bx, by)
{
  TextBox.prototype.render.call(this, ctx, bx, by);
  if (this.cursor !== null) {
    if (blink(this.getTime(), this.blinking)) {
      ctx.fillStyle = 'white';
      ctx.fillRect(bx+this.cursor.x, by+this.cursor.y,
		   this.cursor.width, this.cursor.height);
    }
  }
};

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

TextBoxTT.prototype.keydown = function (key)
{
  var task = this.getCurrentTask();
  if (task !== null) {
    task.keydown(key);
  }
};

TextBoxTT.prototype.ff = function ()
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

TextBoxTT.prototype.addDisplay = function (font, text, interval, sound)
{
  interval = (interval !== undefined)? interval : this.interval;
  sound = (sound !== undefined)? sound : this.sound;
  var task = new DisplayTask(this, font, text, interval, sound);
  this.queue.push(task);
  return task;
};

TextBoxTT.prototype.addMenu = function (font, items, sound)
{
  var task = new MenuTask(this, font, items, sound);
  this.queue.push(task);
  return task;
};
