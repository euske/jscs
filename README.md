jscs (JavaScript Cheat Sheet)

A minimalistic framework for tile-based 2D games in JavaScript.

main.js
-------
 * run()
   Does basic plumbing such as event dispatch and event loop.
   In most cases, you don't need to change this.

game.js
-------
 * new Game(framerate, frame, images, audios, labels)
   Assets management and overall state handling (game over, etc.)

   - keyup(e)
   - keydown(e)
   - focus()
   - blur()
     Handle JavaScript events.
   
   - renderString(font, text, scale, x, y)
     Graphically render text on the canvas.
   
   - addElement(bounds)
     Creates a new HTML div element and put it on a screen.

   - init()
   - idle()
   - repaint()
     A game specific code goes here.

scene.js
-------
 * new Scene(game, tilesize)

   - addTask(task)
   - removeTask(task)
   - addActor(actor)
   - removeActor(actor)
   - addParticle(particle)
   - removeParticle(particle)
   - setCenter(rect)
   - collide(actor)

   - init()
   - idle()
   - render(ctx, x, y)
     A game specific code goes here.

actor.js
--------
 * new Task(body)
   - init()
   - start()
   - idle()
 * new Queue(tasks)
   - init()
   - start()
   - idle()
   - add(task)
   - remove(task)
 * new Particle(bounds, sprite, duration)
   - init()
   - start()
   - idle()
   - render(ctx, x, y) 
 * Actor
   - init()
   - start()
   - idle()
   - render(ctx, x, y) 
   - move(dx, dy)
 
utils.js
--------
 * log(x)
 * clamp(v0, v, v1)
 * rnd(a, b)
 * format(v, n, c)
 * copyArray(a)
 * removeArray(a, b)
 * removeChildren(n, name)
 * new Slot(object)
   - subscribe(recv)
   - unsubscribe(recv)
   - signal(arg)
 * new Point(x, y)
   - equals(p)
   - copy()
   - move(dx, dy)
 * new Rectangle(x, y, width, height)
   - equals(rect)
   - copy()
   - move(dx, dy)
   - inset(dx, dy)
   - contains(x, y)
   - overlap(rect)
   - clamp(rect)
   - union(rect)
   - intersection(rect)
 * collideRect(r0, r1, v)
 * createCanvas(width, height)
 * getEdgeyContext(canvas)
 
