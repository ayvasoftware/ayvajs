Powerful as it may be, the ```move()``` method is also a little verbose. Consider a 4-axis move:

```javascript
ayva.move({
  axis: 'stroke',
  to: 0,
  speed: 0.25
},{
  axis: 'twist',
  to: 0,
},{
  axis: 'roll',
  to: 0.4,
},{
  axis: 'pitch',
  to: 0.2,
});
```

Ayva provides some syntactic sugar to streamline such statements.

### Move Builders

A move builder provides a way to construct moves using method chaining. The example at the beginning
of this section rewritten using a move builder would be:

```javascript
ayva.moveBuilder()
  .stroke(0, 0.25)
  .twist(0)
  .roll(0.4)
  .pitch(0.2).execute();
```

<a href="./tutorial-examples/move-builder-example-1.html" target="_blank">Try it out!</a>

```moveBuilder()``` creates a special builder object with functions for each axis specified in the configuration (both name and alias).
Each function is overloaded to allow creating a movement for that axis in ways that are more succinct. When a move is created, it is 
added to the builder's internal list of  moves, and then the builder itself is returned to allow for chaining.

The ```execute()``` method of a builder internally calls the ```move()``` method to actually perform all of the moves.

### $ Property
Every Ayva instance has a special property—__$__—that contains subproperties for each axis specified in the configuration (both name and alias).
These properties can be used as functions to create move builders:

```javascript
// The same example using $ shorthand.
ayva.$.stroke(0, 0.25)
  .twist(0)
  .roll(0.4)
  .pitch(0.2).execute();
```

We will use this special property instead of ```moveBuilder()``` for the remainder of this tutorial.

### Builder Methods

This section documents all the forms a builder's axis methods can take:

<h4><i>[axis]</i>(to, speed, value)</h4>

```javascript
// Builder <to, speed, value>
ayva.$.stroke(0, 1, Ayva.RAMP_PARABOLIC).execute();

// move() equivalent
ayva.move({
  axis: 'stroke',
  to: 0,
  speed: 1,
  value: Ayva.RAMP_PARABOLIC
});
```

<h4 class="pad-20"><i>[axis]</i>(to, speed)</h4>

```javascript
// Builder <to, speed>
ayva.$.stroke(0, 1).execute();

// move() equivalent
ayva.move({
  axis: 'stroke',
  to: 0,
  speed: 1
});
```

<h4 class="pad-20"><i>[axis]</i>(to, value)</h4>

```javascript
// Builder.  <to, speed> and <to, value>
ayva.$.stroke(0, 1).twist(0, Ayva.RAMP_LINEAR).execute();

// move() equivalent
ayva.move({
  axis: 'stroke',
  to: 0,
  speed: 1
},{
  axis: 'twist',
  to: 0,
  value: Ayva.RAMP_LINEAR
});
```
Note: In this example, the stroke axis uses the (to, speed) form while the twist axis uses the (to, value) form—omitting speed to synchronize
with the stroke axis. See the <a href="./tutorial-motion-api-multiaxis.html#auto-sync" target="_blank">Auto Synchronization</a> section
of the multiaxis movement documentation.

<h4 class="pad-20"><i>[axis]</i>(to)</h4>

```javascript
// Builder <to, speed> and <to>
ayva.$.stroke(0, 1).twist(0).execute();

// move() equivalent
ayva.move({
  to: 0,
  speed: 1
},{
  axis: 'twist',
  to: 0
});
```

<h4 class="pad-20"><i>[axis]</i>(value, duration)</h4>

```javascript
// Example value provider that yields a 60 BPM oscillating motion.
const sinProvider = ({ x }) => (Math.sin(x * Math.PI * 2 * 60) + 1) / 2; 

// Builder <value, duration>
ayva.$.twist(sinProvider, 60).execute();

// move() equivalent
ayva.move({
  axis: 'twist',
  duration: 60,
  value: sinProvider
});
```

<h4 class="pad-20"><i>[axis]</i>(value)</h4>

```javascript
// Example value provider that yields a 60 BPM oscillating motion.
const sinProvider = ({ x }) => (Math.sin(x * Math.PI * 2 * 60) + 1) / 2;

// Builder <value, duration> and <value>
ayva.$.stroke(sinProvider, 60).twist(sinProvider).execute();

// move() equivalent
ayva.move({
  duration: 60,
  value: sinProvider
},{
  axis: 'twist',
  value: sinProvider
});
```

<h4 class="pad-20"><i>[axis]</i>(object)</h4>

```javascript
// Builder <object>
// Any property that is available for objects passed to move() can be used here as well (except for 'axis')
ayva.$.stroke({ to: 0, duration: 1}).execute();

// move() equivalent
ayva.move({
  axis: 'stroke',
  to: 0,
  duration: 1
});
```

### Reusability

Move builders can be held onto and executed as many times as you like. The following example performs
a bouncy stroke with a twist by constructing two reusable moves and repeatedly executing them in a loop:

```javascript
const upStroke = ayva.$.stroke(1, 2, Ayva.RAMP_NEGATIVE_PARABOLIC).twist(0.25);
const downStroke = ayva.$.stroke(0.25, 2, Ayva.RAMP_PARABOLIC).twist(0.75);

// Perform 10 bouncy twist strokes.
for (let i = 0; i < 10; i++) {
  upStroke.execute();
  downStroke.execute();
}
```
<a href="./tutorial-examples/move-builder-bounce-example.html" target="_blank">Try it out!</a>

### Live Updates with $

The axis subproperties of the special property __$__ can also be used to perform live updates if necessary.
You can get and set the value of an axis directly through the ```value``` property.

```javascript
console.log(ayva.$.stroke.value); // 0.5 - the starting value.

// Perform a live update. 0.4 will be converted to TCode and output to the device immediately.
ayva.$.stroke.value = 0.4;
```

This is useful if you want to perform your own live control algorithms, 
or for certain axes for which a "move" doesn't make sense (i.e. setting the suck algorithm):

```javascript
// Set the suck algorithm to close to 0.8 on the up strokes.
ayva.$.suck.value = 0.8;
```

### Updating Limits with $

The axis subproperties of __$__ also allow updating limits:

```javascript
ayva.$.stroke.min = 0.25;
ayva.$.stroke.max = 0.75;
```

### Convenience Methods
When you want to quickly execute a move on only one axis, even a move builder might feel verbose:

```javascript
ayva.$.stroke(0, 1).execute();
```

There are convenience methods for the default six axes configuration that are direct properties of an Ayva instance.
These methods are shorthands for creating a move builder on one axis and executing it immediately:

```javascript
ayva.stroke(0, 1);  // Equivalent to ayva.$.stroke(0, 1).execute()
ayva.left(0, 1);    // Equivalent to ayva.$.left(0, 1).execute()  
ayva.forward(0, 1); // Equivalent to ayva.$.forward(0, 1).execute()
ayva.twist(0, 1);   // Equivalent to ayva.$.twist(0, 1).execute()
ayva.pitch(0, 1);   // Equivalent to ayva.$.pitch(0, 1).execute()
ayva.roll(0, 1);    // Equivalent to ayva.$.roll(0, 1).execute()
```

They accept the same arguments a move builder accepts.  

Note: __These methods only work when the axes are configured (such as in the default configuration).__

### Whew!

That's all for the Motion API! The next tutorial will cover a layer of abstraction built on top of all of this—the Behavior API. 😊

<div style="text-align: center; font-size: 18px">Next: <a href="./tutorial-behavior-api.html">Behavior API</a></div>



