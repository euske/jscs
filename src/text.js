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

function MakeSegment(font, pt, text)
{
  text = (text !== undefined)? text : '';
  var size = font.getSize(text);
  var bounds = new Rectangle(pt.x, pt.y, size.x, size.y);
  var seg = {font:font, bounds:bounds, text:text};
  return seg;
}


// TextBox
function TextBox(frame)
{
  Sprite.call(this, null);
  this.frame = frame;
  this.linespace = 0;
  this.padding = 0;
  this.background = null;
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

TextBox.prototype.add = function (seg)
{
  this.segments.push(seg);
};

TextBox.prototype.addNewline = function (font)
{
  var x = this.frame.x;
  var y = this.frame.y;
  if (this.segments.length !== 0) {
    y = this.segments[this.segments.length-1].bounds.bottom()+this.linespace;
  }
  var newseg = MakeSegment(font, new Vec2(x, y));
  this.add(newseg);
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
      last = MakeSegment(font, pt);
      this.add(last);
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
function DisplayTask(textbox, font, text)
{
  TextTask.call(this);
  this.textbox = textbox;
  this.font = font;
  this.text = text;
  this.interval = 0;
  this.sound = null;
  this._index = 0;
}

DisplayTask.prototype = Object.create(TextTask.prototype);

DisplayTask.prototype.update = function ()
{
  if (this.text.length <= this._index) {
    this.die();
  } else if (this.interval === 0) {
    this.ff();
  } else if ((this.scene.ticks % this.interval) === 0) {
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
function MenuTask(textbox, font)
{
  TextTask.call(this);
  this.textbox = textbox;
  this.font = font;
  this.cursor = MakeSegment(font, new Vec2(), '>');
  this.vertical = false;
  this.items = [];
  this.current = null;
  this.sound = null;
  this.selected = new Slot(this);
}

MenuTask.prototype = Object.create(TextTask.prototype);

MenuTask.prototype.addItem = function (pos, text, value)
{
  value = (value !== undefined)? value : text;
  var item = { pos:pos, text:text, value:value };
  this.items.push(item);
};

MenuTask.prototype.start = function (scene)
{
  Task.prototype.start.call(this, scene);
  for (var i = 0; i < this.items.length; i++) {
    var item = this.items[i];
    this.textbox.add(MakeSegment(this.font, item.pos, item.text));
  }
  this.updateCursor();
};

MenuTask.prototype.keydown = function (key)
{
  var d = 0;
  var keysym = getKeySym(key);
  switch (keysym) {
  case 'left':
    d = (this.vertical)? -999 : -1;
    break;
  case 'right':
    d = (this.vertical)? +999 : +1;
    break;
  case 'up':
    d = (this.vertical)? -1 : -999;
    break;
  case 'down':
    d = (this.vertical)? +1 : +999;
    break;
  case 'action':
    if (this.current !== null) {
      this.selected.signal(this.current.value);
    };
    return;
  case 'cancel':
    this.selected.signal(null);
    return;
  }
  
  var i = ((this.current === null)? 0 : 
	   this.items.indexOf(this.current));
  i = clamp(0, i+d, this.items.length-1);
  this.current = this.items[i];
  this.updateCursor();
  if (this.sound !== null) {
    playSound(this.sound);
  }
};

MenuTask.prototype.updateCursor = function ()
{
  if (this.current !== null) {
    this.cursor.bounds.x = this.current.pos.x - this.cursor.bounds.width*2;
    this.cursor.bounds.y = this.current.pos.y;
    this.textbox.cursor = this.cursor;
  }
};


// TextBoxTT
function TextBoxTT(frame)
{
  TextBox.call(this, frame);
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
  var cursor = this.cursor;
  if (cursor !== null) {
    if (blink(this.getTime(), this.blinking)) {
      cursor.font.renderString(
	ctx, cursor.text,
	bx+cursor.bounds.x, by+cursor.bounds.y);
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
  var task = new DisplayTask(this, font, text);
  task.interval = (interval !== undefined)? interval : this.interval;
  task.sound = (sound !== undefined)? sound : this.sound;
  this.queue.push(task);
  return task;
};

TextBoxTT.prototype.addMenu = function (font)
{
  var task = new MenuTask(this, font);
  this.queue.push(task);
  return task;
};
