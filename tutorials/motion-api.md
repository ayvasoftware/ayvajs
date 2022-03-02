> This tutorial assumes that you have completed the <a href="https://ayvajs.github.io/ayvajs/tutorial-getting-started.html" target="_blank">Getting Started</a> and <a href="https://ayvajs.github.io/ayvajs/tutorial-configuration.html" target="_blank">Configuration</a> tutorials, and that you have some familiarity with <a href="https://www.patreon.com/tempestvr" target="_blank">Open Source Multi Axis Stroker Robots</a>, TCode, and <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript" target="_blank">JavaScript</a>.

## move()
The core of Ayva's Motion API is the ```move()``` method. The ```move()``` method takes an arbitrary number of arguments, each of which is an object describing the movement along a single axis. The simplest description is just a target position and speed:

```
ayva.move({
  axis: 'stroke', // The axis to move.
  to: 0,          // Target position in normalized units [0 - 1].
  speed: 1        // Speed in units per second.
});
```

This command tells Ayva to move the stroke axis (L0 in the default configuration) to the **bottom of its range** (position 0) at **1 unit per second**. A _unit_ in this context is the full length of the range of the axis. Therefore, another way to interpret speed is _strokes per second_.

> <a href="./tutorial-examples/move-speed.html" target="_blank">Try it out!</a> Examples in this tutorial will make use of the <a href="https://github.com/ayvajs/osr-emu" target="_blank">OSR Emulator</a> embedded in editable codepens. That way, you can run and experiment with them without using an actual device!

Alternatively, a duration for the move can be specified:

```
ayva.move({
  axis: 'stroke',
  to: 1,    
  duration: 1,   // Duration of the move in seconds
});
```

This command tells Ayva to move the stroke axis to the **top of its range** (position 1) over the course of one second.

<a href="./tutorial-examples/move-duration.html" target="_blank">Try it out!</a>

These examples could be viewed as somewhat analagous to speed and interval commands in TCode (ex: L000S100 or L099I1000 respectively). However, internally Ayva uses _live updates_ when generating TCode. This allows for movement shapes that are not linear. As you may have been able to tell from the examples, the _default ramp_ (shape of the motion) used by Ayva is actually a cosine wave. This behavior can be changed by setting the ```defaultRamp``` property on an instance of Ayva.

### Default Ramp

There are four built-in ramp types available as static properties of the Ayva class:

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

You can also supply your own ramp function. The default ramp is actually what is called a **value provider**, and how to create one will be covered in the next section.

### Value Providers

