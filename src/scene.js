// scene.js
// Scene object takes care of every in-game object and the scrollable map.
//   requires: utils.js
//   requires: geom.js
//   requires: actor.js
'use strict';

function Scene(app)
{
  this.app = app;
  this.music = null;
  this.screen = new Rectangle(0, 0, app.screen.width, app.screen.height);
}

define(Scene, Object, '', {
  changeScene: function (scene) {
    var app = this.app;
    app.post(function () { app.init(scene); });
  },
  
  init: function () {
    // [OVERRIDE]
  },

  update: function () {
    // [OVERRIDE]
  },

  render: function (ctx, bx, by) {
    // [OVERRIDE]
  },

  set_dir: function (vx, vy) {
    // [OVERRIDE]
  },

  set_action: function (action) {
    // [OVERRIDE]
  },

  keydown: function (key) {
    // [OVERRIDE]
  },

  keyup: function (key) {
    // [OVERRIDE]
  },

  mousedown: function (x, y, button) {
    // [OVERRIDE]
  },

  mouseup: function (x, y, button) {
    // [OVERRIDE]
  },

  mousemove: function (x, y) {
    // [OVERRIDE]
  },

});


//  TextScene
//
function TextScene(app, text)
{
  this._Scene(app);
  this.text = text;
}

define(TextScene, Scene, 'Scene', {
  init: function () {
    this._Scene_init();
    var scene = this;
    var frame = this.app.frame;
    var e = this.app.addElement(
      new Rectangle(frame.width/8, frame.height/4,
		  3*frame.width/4, frame.height/2));
    e.align = 'left';
    e.style.padding = '10px';
    e.style.color = 'black';
    e.style.background = 'white';
    e.style.border = 'solid black 2px';
    e.innerHTML = this.text;
    e.onmousedown = (function (e) { scene.change(); });
  },
  
  render: function (ctx, bx, by) {
    ctx.fillStyle = 'rgb(0,0,0)';
    ctx.fillRect(bx, by, this.screen.width, this.screen.height);
  },

  change: function () {
    // [OVERRIDE]
  },

  mousedown: function (x, y, button) {
    this.change();
  },

  keydown: function (key) {
    this.change();
  },
  
});


//  GameScene
// 
function GameScene(app)
{
  this._Scene(app);
  this.layer = new Layer(app);
}

define(GameScene, Scene, 'Scene', {
  init: function () {
    // [OVERRIDE]
    this._Scene_init();
    this.layer.init();
    this.sprites = this.layer.sprites;
    this.colliders = this.layer.colliders;
  },

  update: function () {
    // [OVERRIDE]
    this._Scene_update();
    this.layer.update();
  },

  render: function (ctx, bx, by) {
    // [OVERRIDE]
    this._Scene_render(ctx, bx, by);
    this.layer.render(ctx, bx, by);
  },

  addObject: function (obj) {
    this.layer.addObject(obj);
  },
  removeObject: function (obj) {
    this.layer.removeObject(obj);
  },
  findObjects: function (rect, f) {
    return this.layer.findObjects(rect, f);
  },

});
