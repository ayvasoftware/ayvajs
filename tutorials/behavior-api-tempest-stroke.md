## What is a Tempest Stroke?

Named for its creator, <a href="https://www.patreon.com/tempestvr" target="_blank">Tempest MAx</a>, a ```TempestStroke``` is a behavior that allows specifying oscillatory motion on an arbitrary number of axes with a formula loosely based on orbital motion calculations. The formula is:

<img style="width:250px" src="./images/tempest-motion.png">

Where ```θ``` is the angle in radians, ```p``` is the _phase_, and ```c``` is the _eccentricity_. Here is a simple graph that shows how these parameters effect the shape of the motion (_try tweaking phase and eccentricity_):

<canvas style="margin-top:20px" width=450 height=100 id="tempest-motion-graph"></canvas>
<div style="display: grid; grid-template-columns: 1fr 1fr; max-width: 50%">
  <b style="justify-self: end">phase (<span id="phase-value">0.00</span>):</b> 
  <input 
    id="phase" 
    type="range" 
    min="-1000" 
    max = "1000" 
    value=0 
    oninput="updateGraph(event)">
  <b style="justify-self: end">eccentricity (<span id="ecc-value">0.00</span>):</b> 
  <input 
    id="ecc" 
    type="range" 
    min="-1000" 
    max = "1000" 
    value=0 
    oninput="updateGraph(event)">
</div>

<script>
  function plot (selector, fn, range) {
    const canvas = document.querySelector(selector);
    const context = canvas.getContext('2d');
    const { width, height } = canvas;

    const widthScale = (width / (range[1] - range[0]));
    const heightScale = ((height - 12) / (range[3] - range[2]));
    let first = true;

    context.lineCap = 'round';
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.beginPath();

    for (let x = 0; x < width; x++) {
      const xFnVal = (x / widthScale) - range[0];
      let yGVal = (fn(xFnVal) - range[2]) * heightScale;
      
      yGVal = height - 6 - yGVal;
      
      if (first) {
        context.moveTo(x, yGVal);
        first = false;
      }
      else {
        context.lineTo(x, yGVal);
      }
    }

    context.strokeStyle = "black";
    context.lineWidth = 2;
    context.stroke(); 
  }

  function updateGraph (event) {
    let phase = document.querySelector('#phase').value / 200;
    let ecc = document.querySelector('#ecc').value / 200;

    if (event.target.getAttribute('id') === '#phase') {

    } else {

    }

    document.querySelector('#phase-value').textContent = phase.toFixed(2);
    document.querySelector('#ecc-value').textContent = ecc.toFixed(2);

    const fn = (x) => -Math.cos(x + (Math.PI * phase)/2 + ecc * Math.sin(x));

    plot('#tempest-motion-graph', fn, [0, Math.PI * 2, -1, 1]);
  }

  plot('#tempest-motion-graph', (x) => -Math.cos(x), [0, Math.PI * 2, -1, 1]);
</script>

### Setup

To use ```TempestStroke```, you must import it. This can be done at the same time that you import the Ayva class. For example:

```javascript
import Ayva, { TempestStroke } from 'https://unpkg.com/ayvajs';
```

_Note: Ayva is the_ __<a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import" target="_blank">default export</a>__ _of ayvajs, while ```TempestStroke``` is a_ __<a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import" target="_blank">named export</a>__. _This is the reason ```TempestStroke``` is enclosed in curly brackets._

Once ```TempestStroke``` is imported, you can create new strokes using ```TempestStroke```'s constructor, which takes a configuration object and bpm (beats per minute).

```java
const myStroke = new TempestStroke({
  stroke: {
    from: 0,    // Start of the range of motion [0 - 1]
    to: 1,      // End of the range of motion [0 - 1]
    phase: 0.3,
    ecc: 0.7
  }
}, 30);

ayva.do(myStroke);
```

This would cause Ayva to perform a 30 bpm stroke with motion that looks like this:

<img style="max-width: 50%" src="./images/tempest-motion-example.png">

<a href="./tutorial-examples/tempest-stroke-example-1.html" target="_blank">Try it out!</a>

You can add motion to as many axes as you like with various parameters. The following example demonstrates an orbit grind on the axes available in an OSR2+:

```java
ayva.do(new TempestStroke({
  stroke: { from: 0.0, to: 0.3, ecc: 0.3 },
  roll:   { from: 0.1, to: 0.9, phase: 1.0, ecc: -0.3 },
  pitch:  { from: 0.9, to: 0.1, ecc: -0.3 }
}));
```

_Note: only the ```from``` and ```to``` properties are required for an axis. ```phase``` and ```eccentricity``` both default to __0__. The default for bpm is __60__._

<a href="./tutorial-examples/tempest-stroke-example-2.html" target="_blank">Try it out!</a>

### Shift
You may sometimes want to do a proper _phase shift_ of the wave. Because of its position in the formula, changing the ```phase``` parameter may not always do this (because of the ```eccentricity```). You can add a constant to the angle θ with the ```shift``` parameter, specified in radians:

```java
ayva.do(new TempestStroke({
  stroke: {
    from: 0,
    to: 1,
    phase: -1,
    ecc: 2,
    shift: Math.PI / 2 // Shift the function by 90 degrees.
  }
}));
```

### Built-in Patterns

There are some built-in patterns that can be referenced by name:

```javascript
// Execute an orbit-grind at 24 bpm
ayva.do(new TempestStroke('orbit-grind', 24));
```

<a href="./tutorial-examples/tempest-stroke-example-3.html" target="_blank">Try it out!</a>

Here is the full list of available patterns:

```back-thrust-down```
```back-thrust-down-swirl```
```diagonal-down-back```
```diagonal-down-forward```
```down-backward```
```down-forward```
```forward-back-grind```
```forward-back-tease```
```lean-forward-thrust-down```
```lean-forward-thrust-down-swirl```
```left-right-tease```
```orbit-grind```
```orbit-tease```
```swirl-tease```
```thrust-forward```
```thrust-forward-swirl```
```vortex-tease```

_Explore!_

### Customizing Built-in Patterns

You can get the parameters for a built-in pattern as a starting point by using ```TempestStroke.library```:

```javascript
// Get a copy of the built-in orbit grind parameters.
const myOrbitGrind = TempestStroke.library['orbit-grind'];

// Tweak the range of the stroke axis of the orbit grind to be wider.
// Library pattern axis names use the machine names (i.e. "L0" instead of "stroke")
myOrbitGrind.L0.to = 1;

ayva.do(new TempestStroke(myOrbitGrind, 30));
```

<a href="./tutorial-examples/tempest-stroke-example-4.html" target="_blank">Try it out!</a>

### Value Provider

Internally, ```TempestStroke``` uses a <a href="./tutorial-motion-api-value-providers.html" target="_blank">value provider</a> to describe Tempest Motion. This value provider is available to be used independently of a ```TempestStroke``` in your own moves. See the <a href="./Ayva.html#.tempestMotion" target="_blank">API Documentation</a> for ```Ayva.tempestMotion()```.

<div style="text-align: center; font-size: 18px">Next: <a href="./tutorial-behavior-api-custom.html">Custom Behaviors</a></div>
