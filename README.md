jscs
====

(JavaScript Cheat Sheet)

A minimalistic framework for tile-based 2D games in JavaScript.

Sample game: http://euske.github.io/jscs/index.html

main.js
-------
 * `run()`
   <br> Basic plumbing such as event dispatch and main loop.
   In most cases, you don't need to change this.

game.js
-------
 * `new Game(framerate, frame, images, audios, labels)`
   <br> Asset management and overall state handling (game over, etc.)

   - `keyup(e)`
     <br> Handles JavaScript events.
   - `keydown(e)`
     <br> Handles JavaScript events.
   - `focus(e)`
     <br> Handles JavaScript events.
   - `blur(e)`
     <br> Handles JavaScript events.
   
   - `renderString(font, text, scale, x, y)`
     <br> Graphically render text on the canvas in the given font.
   
   - `addElement(bounds)`
     <br> Creates a new HTML div element and put it on a screen.
   - `removeElement(elem)`
     <br> Removes an HTML element from the screen.

   - `init()`
     <br> Game initialization.
     [A game specific code goes here.]
   
   - `update()`
     <br> Called for every frame.
     [A game specific code goes here.]
   
   - `repaint()`
     <br> Repaint the entire game screen.
     [A game specific code goes here.]

scene.js
--------
 * `new Scene(game)`
   <br> Responsible for event handling for a particular scene of game.
        (Title, Game Over, Main Game, etc.)
 
   - `init()`
     <br> Scene initialization.
     [A game specific code goes here.]
     
   - `update()`
     <br> Called for every frame.
     [A game specific code goes here.]
     
   - `render(ctx, x, y)`
     <br> Called when the scene needs to be painted.
     [A game specific code goes here.]
   
   - `move(vx, vy)`
     <br> Receives the controller input.
     
   - `action(action)`
     <br> Receives the action button input.

 * `new Level(game)` [extends Scene]
   <br> Holds all entities that are shown in the game world.

   - `addObject(obj)`
   - `removeObject(task)`
     <br> Adds/Removes a Game object to the scene.
     
   - `setCenter(rect)`
     <br> Moves the screen view so that it contains the given rect.
      
   - `collide(actor)`
     <br> Returns a list of Actor objects that collide with the Actor object.

actor.js
--------
 * `new Task(body)`
   <br> A generic process object that is called for every frame.
   
   - `init()`
   - `start()`
   - `update()`
   
 * new Queue(tasks) [extends Task]
   <br> A list of Task objects that are executed sequentially.
   
   - `add(task)`
   - `remove(task)`
   
 * new Sprite(bounds) [extends Task]
   <br> A visible object that might not interact with other characters.
   
   - `render(ctx, x, y)`
   
 * new Actor(bounds, hitbox, tileno) [extends Particle]
   <br> An moving object that interacts with other Actors.
   
   - `move(dx, dy)`
 
utils.js
--------
 * `log(x)`
   <br> Prints a string to the console.
 * `clamp(v0, v, v1)`
   <br> Keeps a number v within the range [v0, v1].
 * `blink(t, d)`
   <br> Returns true if t is within the on interval.
 * `rnd(a[, b])`
   <br> Generates a random number in the range [0, a) or [a, b).
 * `format(v, n, c)`
   <br> Formats a number to a fixed number of digits.
 
 * `copyArray(a)`
   <br> Deep-copies an array.
 * `removeArray(a, f)`
   <br> Removes element(s) from the array a that matches f.
 
 * `removeChildren(n, name)`
   <br> Removes all DOM children that have the given tag from n.
   
 * `createCanvas(width, height)`
   <br> Creates a canvas element with the given size.
 
 * `getEdgeyContext(canvas)`
   <br> Returns a pixellated canvas 2D context.
 
 * `new Slot(object)`
   <br> An event publisher.
    
   - `subscribe(recv)`
     <br> Registers a function as an event receiver.
   - `unsubscribe(recv)`
     <br> Unregisters a function as an event receiver.
   - `signal(arg)`
     <br> Calls a registerd function of all subscriers.
   
 * `new Point(x, y)`
   <br> A point object.
 
   - `equals(p)`
   - `copy()`
   - `move(dx, dy)`
   
 * `new Rectangle(x, y, width, height)`
   <br> A rectangle object.
   
   - `equals(rect)`
   - `copy()`
   - `move(dx, dy)`
   - `inset(dx, dy)`
   - `contains(x, y)`
   - `overlap(rect)`
   - `clamp(rect)`
   - `union(rect)`
   - `intersection(rect)`
   
 * `collideRect(r0, r1, v)`
   <br> Clips the motion vector v so that the rect r0 doesn't
   intersect with the rect r1.

 * `image2array(img)`
   <br> Converts an image to 2D array.
