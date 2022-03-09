## move()
The core of Ayva's Motion API is the ```move()``` method. The ```move()``` method takes an arbitrary number of arguments, each of which is an object describing the motion along a single axis. The simplest description is just a target position and speed:

```javascript
ayva.move({
  axis: 'stroke', // The axis to move.
  to: 0,          // Target position in normalized units [0 - 1].
  speed: 1        // Speed in units per second.
});
```

This command tells Ayva to move the stroke axis (L0 in the default configuration) to the **bottom of its range** (position 0) with an _average speed_ of **1 unit per second**. A _unit_ in this context is the full length of the range of the axis. Therefore, another way to interpret speed is _strokes per second_.

<a href="./tutorial-examples/move-speed.html" target="_blank">Try it out!</a>

Alternatively, a duration for the move can be specified:

```javascript
ayva.move({
  axis: 'stroke',
  to: 1,    
  duration: 1,   // Duration of the move in seconds
});
```

This command tells Ayva to move the stroke axis to the **top of its range** (position 1) over the course of one second.

<a href="./tutorial-examples/move-duration.html" target="_blank">Try it out!</a>

These examples could be viewed as somewhat analagous to speed and interval commands in TCode (ex: L000S100 or L099I1000, respectively). However, internally Ayva uses _live updates_ when generating TCode. This allows for movement shapes that are not linear. As you may have been able to tell from the examples, the _default ramp_ (shape of the motion) used by Ayva is actually a cosine wave. Later, we will discuss how to change this behavior.

### Default Axis

In the examples shown so far we have explicitly set the axis to _stroke_. In the default configuration, the _stroke_ axis is actually the default axis, so we didn't really have to specify it in those cases. i.e.

```javascript
ayva.move({
  to: 0,
  speed: 1
});
```
or
```javascript
ayva.move({
  to: 1,    
  duration: 1,
});
```
would also have worked, respectively. This can be changed by setting the ```defaultAxis``` property.
```javascript
ayva.defaultAxis = 'twist';
```
Alternatively, the default axis can be specified when <a href="./tutorial-configuration.html#custom-configuration" target="_blank">creating a configuration</a>.

### Asynchronous Movement

The ```move()``` method is <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function" target="_blank">asynchronous</a>. It returns a <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise" target="_blank">Promise</a> that resolves when the move is finished. If you need to execute code only after a move is done, you can use <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises#chaining" target="_blank">Promise chaining</a>:

```javascript
ayva.move({ to: 0, speed: 1 }).then(() => {
  console.log('The move is complete!')
});
```

Or you can use the <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await" target="_blank">await</a> keyword inside of an <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function" target="_blank">async</a> function:


```javascript
async function myStroke() {
  await ayva.move({ to: 0, speed: 1 });
  console.log('The move is complete!');
}

myStroke();
```

### Move Order

Internally, Ayva uses a queue to keep track of moves. If a move is already in progress when ```move()``` is called, the requested move is added to a queue and will not execute until all preceding moves have finished. So while ```move()``` is asynchronous, all moves are guaranteed to execute in the order they were called. The following example illustrates this:

```javascript
// Perform a few down and up strokes (with up strokes performed at half speed).
ayva.move({ to: 0, speed: 1 });
ayva.move({ to: 1, speed: 0.5 });
ayva.move({ to: 0, speed: 1 });
ayva.move({ to: 1, speed: 0.5 }).then(() => {
  // The following line will not execute until all moves have finished.
  console.log('Finished all strokes!');
});

// Because move() is asynchronous, the following line executes before the moves have finished.
console.log('Stroking...');
```
<a href="./tutorial-examples/move-order.html" target="_blank">Try it out!</a>  

_In this example, if you open the Developer Tools in your browser while running, you should see the text_ "Stroking..." _print to the console first, and then when all strokes have finished you should see the text_ "Finished all strokes!" _print._

### Stopping

The ```stop()``` method can be called to stop all movements (running or pending). The following example demonstrates ```stop()``` by creating a button that the user can click to stop the movement:

```javascript
// Create a large stop button positioned towards the top right.
const stopButton = document.createElement('button');
stopButton.textContent = 'Click to Stop!';
stopButton.style.fontSize = '32px';
stopButton.style.position = 'absolute';
stopButton.style.top = '50px';
stopButton.style.right = '50px';
document.body.appendChild(stopButton);

// Call stop() when the button is clicked.
stopButton.addEventListener('click', () => ayva.stop());

// Start a long running move (10 seconds).
ayva.move({ to: 1, duration: 10 }).then((complete) => {
  // Note: A move's Promise resolves with the value true if the move completed successfully, false otherwise.
  if (!complete) {
    console.log('The move was stopped before it finished.');
  } else {
    console.log('The move completed successfully.');
  }
});
```
<a href="./tutorial-examples/move-stop.html" target="_blank">Try it out!</a>  

_In this example, if you open the Developer Tools in your browser while running and you click the stop button before the move finishes, you should see the message_ "The move was stopped before it finished." _print. If you do not click the stop button and instead let the move finish you should see_ "The move completed successfully."
### Default Ramp

The default ramp can be changed by setting the ```defaultRamp``` property on an instance of Ayva. There are four built-in ramp types available as static properties of the Ayva class:

#### Cosine
```ayva.defaultRamp = Ayva.RAMP_COS;```

<img class="ramp-example" width="150px" src="./images/cos-ramp.png">
<a class="try-it-out" href="./tutorial-examples/move-cos-ramp.html" target="_blank">Try it out!</a>  

#### Linear
```ayva.defaultRamp = Ayva.RAMP_LINEAR;```

<img class="ramp-example" width="150px" src="./images/linear-ramp.png">
<a class="try-it-out" href="./tutorial-examples/move-linear-ramp.html" target="_blank">Try it out!</a>  

#### Parabolic

```ayva.defaultRamp = Ayva.RAMP_PARABOLIC;```

<img class="ramp-example" width="150px" src="./images/parabolic-ramp.png">
<a class="try-it-out"href="./tutorial-examples/move-parabolic-ramp.html" target="_blank">Try it out!</a>  

#### Negative Parabolic

```ayva.defaultRamp = Ayva.RAMP_NEGATIVE_PARABOLIC```

<img class="ramp-example" width="150px" src="./images/negative-parabolic-ramp.png">
<a class="try-it-out" href="./tutorial-examples/move-negative-parabolic-ramp.html" target="_blank">Try it out!</a>  

You can also supply your own ramp function. The default ramp is actually a **value provider**, and how to create one will be covered in the next section.

<div style="text-align: center; font-size: 18px">Next: <a href="./tutorial-motion-api-value-providers.html">Value Providers</a></div>


