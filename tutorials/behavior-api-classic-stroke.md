## What is a Classic Stroke?

So named for its timelessness. The OG stroke. It commands Ayva to perform a simple up and down movement on the stroke axis with some 
(optional) variation on a few parameters such as speed, positions, shape, and twist. Its been often stated that many people are satisfied 
with just the stroke and twist axis. If you're one of those people, ```ClassicStroke``` has got you covered!

### Setup

To use ```ClassicStroke```, you must import it. This can be done at the same time that you import the Ayva class. For example:

```javascript
import Ayva, { ClassicStroke } from 'https://unpkg.com/ayvajs';
```

_Note: Ayva is the_ __<a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import" target="_blank">default export</a>__ _of ayvajs, while ```ClassicStroke``` is a_ __<a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import" target="_blank">named export</a>__. _This is the reason ```ClassicStroke``` is enclosed in curly brackets._

Once ```ClassicStroke``` is imported, you can create new strokes using ```ClassicStroke```'s constructor:

```javascript
// Create a new stroke with default parameters.
const myStroke = new ClassicStroke();

// Perform the stroke until commanded to do otherwise.
ayva.do(myStroke);
```

### Parameters

To customize ```ClassicStroke```'s behavior, a configuration object can be passed to the constructor with any of the following parameters:

<h5 class="parameter-heading">bottom</h5>
<div class="type-section">
  <b>Type:</b> Number <b class="type-separator">|</b> Array <b class="type-separator">|</b> Function
</div>
<p>The bottom of the stroke range. This can be an absolute value, an array of values, or a function that provides the value for each stroke. <br/><b>Defaults to <code>0</code></b></p>

```javascript
// Specify as absolute value.
ayva.do(new ClassicStroke({
  bottom: 0.5,
}));
```
<a href="./tutorial-examples/classic-stroke-example-bottom-1.html" target="_blank">Try it out!</a>

```javascript
// Specify as array of values (this pattern will repeat).
ayva.do(new ClassicStroke({
  bottom: [0, 0.25, 0.5, 0.25]
}));
```
<a href="./tutorial-examples/classic-stroke-example-bottom-2.html" target="_blank">Try it out!</a>

```javascript
// Specify as a function (this example generates a random value between 0 and 0.5 for each stroke).
ayva.do(new ClassicStroke({
  bottom: () => Ayva.map(Math.random(), 0, 1, 0, 0.5)
}));
```
<a href="./tutorial-examples/classic-stroke-example-bottom-3.html" target="_blank">Try it out!</a>

<h5 class="parameter-heading">top</h5>
<div class="type-section">
  <b>Type:</b> Number <b class="type-separator">|</b> Array <b class="type-separator">|</b> Function
</div>
<p>The top of the stroke range. This can be an absolute value, an array of values, or a function that provides the value for each stroke. <br/><b>Defaults to <code>1</code></b></p>

```javascript
// Specify as absolute value.
ayva.do(new ClassicStroke({
  top: 0.75,
}));
```

```javascript
// Specify as array of values (this pattern will repeat).
ayva.do(new ClassicStroke({
  top: [1, 0.75, 0.5, 0.75]
}));
```

```javascript
// Specify as a function (this example generates a random value between 0.5 and 1 for each stroke).
ayva.do(new ClassicStroke({
  top: () => Ayva.map(Math.random(), 0, 1, 0.5, 1)
}));
```

<h5 class="parameter-heading">speed</h5>
<div class="type-section">
  <b>Type:</b> Number <b class="type-separator">|</b> Array <b class="type-separator">|</b> Function
</div>
<p>The speed of the stroke. This can be an absolute value, an array of values, or a function that provides the value for each stroke. <br/><b>Defaults to <code>1</code></b></p>

```javascript
// Specify as absolute value.
ayva.do(new ClassicStroke({
  speed: 1.5,
}));
```

```javascript
// Specify as array of values (this pattern will repeat)
ayva.do(new ClassicStroke({
  speed: [0.5, 1, 1.5, 1 ]
}));
```

```javascript
// Specify as a function (this example generates a speed that varies with sin)
ayva.do(new ClassicStroke({
  speed: (index) => {
    const x = index / 20; // One cycle every 20 strokes.

    const minSpeed = 0.5;
    const maxSpeed = 3;
    return Ayva.map(Math.sin(x * Math.PI * 2), -1, 1, minSpeed, maxSpeed);
  }
}));
```
<a href="./tutorial-examples/classic-stroke-example-speed.html" target="_blank">Try it out!</a>

<h5 class="parameter-heading">duration</h5>
<div class="type-section">
  <b>Type:</b> Number <b class="type-separator">|</b> Array <b class="type-separator">|</b> Function
</div>
<p>Alternative to speed—the duration of each stroke. This can be an absolute value, an array of values, or a function that provides the value for each stroke. <b>Defaults to <code>undefined</code></b> (incompatible with speed property).</p>

<h5 class="parameter-heading">shape</h5>
<div class="type-section">
  <b>Type:</b> Function <b class="type-separator">|</b> Array
</div>
<p>The "shape" of the stroke. This can be a ramp function, or an even lengthed array of ramp functions. 
When specified as an array, the even indexed array entries correspond with up strokes, and odd index entries with down strokes.
<br/><b>Defaults to <code>Ayva.RAMP_COS</code></b></p>

```javascript
// Specify as function (ramp)
ayva.do(new ClassicStroke({
  shape: Ayva.RAMP_PARABOLIC
}));
```
<a href="./tutorial-examples/classic-stroke-example-shape-1.html" target="_blank">Try it out!</a>

```javascript
// Specify as array of values (this pattern will repeat)
ayva.do(new ClassicStroke({
  shape: [ Ayva.RAMP_NEGATIVE_PARABOLIC, Ayva.RAMP_PARABOLIC, Ayva.RAMP_COS, Ayva.RAMP_LINEAR ]
}));
```
<a href="./tutorial-examples/classic-stroke-example-shape-2.html" target="_blank">Try it out!</a>

<h5 class="parameter-heading">relativeSpeeds</h5>
<div class="type-section">
  <b>Type:</b> Array
</div>
<p>An even lengthed array of factors to scale stroke speeds by. The even indexed array entries correspond with up strokes, and odd index entries correspond with down strokes.
<br/><b>Defaults to <code>[1, 1]</code></b></p>

```javascript
// Specify as array of values (this pattern will repeat)
ayva.do(new ClassicStroke({
  speed: 2,

  // Multiply base speed (2) by these factors on corresponding strokes.
  relativeSpeeds: [ 0.5, 0.75, 0.75, 1 ] 
}));
```
<a href="./tutorial-examples/classic-stroke-example-relative-speeds.html" target="_blank">Try it out!</a>

<h5 class="parameter-heading">suck</h5>
<div class="type-section">
  <b>Type:</b> Number
</div>
<p>The suck algorithm value. <br/><b>Defaults to <code>null</code></b> (i.e. no suck algorithm).</p>


```javascript
ayva.do(new ClassicStroke({
  // Set suck algorithm to close valve to 0.8 on the up strokes.
  suck: 0.8 
}));
```

<h5 class="parameter-heading">twist</h5>
<div class="type-section">
  <b>Type:</b> Object
</div>
<p>
  A configuration object for a cos shaped twist with the following parameters:
  <br/><br/>
  <code>from</code> - position of the twist axis when at the <i>bottom</i> of a stroke.<br/>
  <code>to</code> - position of the twist axis when at the <i>top</i> of a stroke.<br/>
  <code>phase</code> - phase of the cos wave in multiples of π/2<br/><br/>
  <b>Defaults to <code>null</code></b> (i.e. no twist).
</p>

```java
ayva.do(new ClassicStroke({
  twist: {
    from: 0.5,
    to: 1,
    phase: 1
  }
}));
```
<a href="./tutorial-examples/classic-stroke-example-twist.html" target="_blank">Try it out!</a>

### All Together Now

All of these parameters can be used together to create a unique experience:

```java
ayva.do(new ClassicStroke({
  // Random bottom
  bottom: () => Ayva.map(Math.random(), 0, 1, 0, 0.3),

  // Random top
  top: () => Ayva.map(Math.random(), 0, 1, 0.7, 1),

  // Speed vary by sin
  speed: (index) => {
    const x = index / 20; // One cycle every 20 strokes.

    const minSpeed = 0.5;
    const maxSpeed = 3;
    return Ayva.map(Math.sin(x * Math.PI * 2), -1, 1, minSpeed, maxSpeed);
  },

  // "Bouncy" motion by using parabolic ramps
  shape: [ Ayva.RAMP_NEGATIVE_PARABOLIC, Ayva.RAMP_PARABOLIC ],

  // Make up strokes perform at half speed.
  relativeSpeeds: [0.5, 1],

  // With some twist motion slightly out of phase.
  twist: {
    from: 0.25,
    to: 0.75,
    phase: 0.5
  }  
}));
```
<a href="./tutorial-examples/classic-stroke-example-all-together.html" target="_blank">Try it out!</a>

> <p style="color: #AA0000"><b>Warning:</b><code style="color: #AA0000">ClassicStroke</code> does not manipulate the values of any axis but the <b>stroke</b> and <b>twist</b> axis (<i>if configured</i>). You must therefore take care to orient other axes to the values you would like them to be for the duration of the stroke. The following example demonstrates the effect of <b>not</b> doing this. 😅

```javascript
// Move the roll and pitch axis way off.
ayva.$.roll(0, 1).pitch(0, 1).execute().then(() => {
  // This stroke will occur without changing the pitch or roll back!
  // Probably not what you want...
  ayva.do(new ClassicStroke());
});
```

<a href="./tutorial-examples/classic-stroke-example-bad.html" target="_blank">Try it out!</a>

### Shorthand

For simple strokes, you do not have to pass a configuration object. The constructor of ```ClassicStroke``` accepts the ```bottom```, ```top```, ```speed```, and ```shape``` properties directly; with each being optional and set to appropriate default values. Ex:

```javascript
// A parabolic stroke with bottom = 0, top = 1, and speed = 2.
new ClassicStroke(0, 1, 2, Ayva.RAMP_PARABOLIC);
```

See the <a href="./ClassicStroke.html#ClassicStroke" target="_blank">API Documentation</a> for additional details. 

<div style="text-align: center; font-size: 18px">Next: <a href="./tutorial-behavior-api-tempest-stroke.html">Tempest Stroke</a></div>

