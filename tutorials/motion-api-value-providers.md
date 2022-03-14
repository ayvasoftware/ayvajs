## What are Value Providers?

All moves take a finite amount of steps. Ayva determines how many steps a given move will take based on the duration of the move and the frequency of updates (as specified in the <a href="./tutorial-configuration.html#custom-configuration" target="_blank">configuration</a>). A value provider allows you to, well, _provide the value_ for an axis at a given step. 😊

It is nothing more than a function that takes parameters describing the current step—as well as the movement overall—and returns what the value should be. When paired with a target value and speed (or duration), a value provider can be used as a _ramp_ function that describes the shape of the motion towards a target. A value provider may also simply provide a value without regard to a target value. Both scenarios are covered in the following sections.

### Ramp

Value providers are passed as the ```value``` property. The following example demonstrates using the built-in ramp functions covered in the previous section as value providers for individual movements:

```javascript
// Use the default ramp (cosine) to slowly move to the top (no value provider specified).
ayva.move({
  to: 1,
  speed: 0.25
});

// "Fall" towards the bottom (parabolic)
ayva.move({ 
  to: 0,
  speed: 0.75,
  value: Ayva.RAMP_PARABOLIC
});

// "Bounce" back to the top (negative parabolic)
ayva.move({
  to: 1,
  speed: 0.75,
  value: Ayva.RAMP_NEGATIVE_PARABOLIC
});

// Linear move back to the bottom.
ayva.move({
  to: 0,
  speed: 0.75,
  value: Ayva.RAMP_LINEAR
});

// Move slowly back to the top with cosine.
// Note: The default ramp is cosine so we did not actually have to explicitly express it here.
ayva.move({
  to: 1,
  speed: 0.25,
  value: Ayva.RAMP_COS
});
```

<a href="./tutorial-examples/value-providers-ramp.html" target="_blank">Try it out!</a>  

### Custom Ramp

Value providers are called with a single argument—a parameters object with properties you can use to compute the value of the current step.
To create a ramp function, you can make use of the ```to```, ```from```, and ```x``` properties. These are the _target value_, the _start value_, 
and the _fraction of the move that should be completed by the end of the current step_, respectively. The following example demonstrates how one might
implement a simple linear shaped movement using these parameters:

```java
const myLinearRamp = (parameters) => {
  const to = parameters.to;
  const from = parameters.from;
  const x = parameters.x;

  return from + (to - from) * x;
};

ayva.move({
  to: 0,
  speed: 0.25,
  value: myLinearRamp
});
```

<a href="./tutorial-examples/value-providers-custom-ramp.html" target="_blank">Try it out!</a>  

This example could be made more succinct by passing the function directly and making use of 
<a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment" target="_blank">object destructuring</a> 
to capture the properties we want from the ```parameters``` object:

```java
ayva.move({
  to: 0,
  speed: 0.25,
  value: ({ to, from, x }) => from + (to - from) * x
});
```

_Note that the special property_ ```x``` _is a value between 0 (exclusive) and 1 (inclusive). i.e._ ```x``` _attains the value of 1 at the end of the movement._
<br/>  

#### Ayva.ramp
The pattern ```from + (to - from) * (...)``` is common enough that Ayva provides a shorthand for it in the form of a static function: ```Ayva.ramp```.
This method takes a value provider and converts it into a ramp function using the ```from + (to - from) * (...)``` pattern.
The previous example could therefore be rewritten even more succinctly as:

```javascript
ayva.move({
  to: 0,
  speed: 0.25,
  value: Ayva.ramp(({ x }) => x)
});
```

> <p style="color: #AA0000"><b>Note:</b> Care should be taken when creating ramp functions. In order to actually result in reaching the target, they <b>should</b> attain the value 1 at x = 1. However, this is <b><u>not</u></b> enforced in any way.</p>

### Custom Motion

A target value does not have to be specified when using a value provider. The following example generates motion using a sin wave.

```javascript
const bpm = 24; // Beats per minute. Try tweaking this value.

ayva.move({
  duration: 60,
  value: ({ x }) => {
    const result = Math.sin(x * Math.PI * 2 * bpm);

    // Sin is in the range [-1, 1]. So we must shift and scale into the range [0, 1].
    return (result + 1) / 2;
  }
});
```

<a href="./tutorial-examples/value-providers-sin.html" target="_blank">Try it out!</a>

When you do not specify a target value you _must_ specify a duration (and not a speed). Ayva needs a way to compute how many steps the move will
take. Therefore the following is invalid:

```javascript
// This will result in an error no matter what the value provider is!
ayva.move({
  speed: 1,
  value: () => {
    // ...
  }
});
```

### Complexity
A value provider naturally may contain as much logic as you want. It may also return _null_ or _undefined_ to indicate no movement for a particular step.

<h3 id="parameters">Parameters</h3>

There are many more parameters available for value providers to use if needed. The full list is provided below:

<div class="table-container">
  <table class="params table">
    <thead>
      <tr>
        <th style="font-weight: bold">Parameter</th>
        <th style="font-weight: bold">Type</th>
        <th style="font-weight: bold">Attributes</th>
        <th style="font-weight: bold" class="last">Description</th>
      </tr>
    </thead>
    <tbody>
      <tr class="deep-level-0">
        <td class="name"><code>axis</code></td>
        <td class="type">
          <span class="param-type">String</span>
        </td>
        <td class="attributes">
        </td>
        <td class="description last">
          <p>The name of the axis being moved.</p>
        </td>
      </tr>
      <tr class="deep-level-0">
        <td class="name"><code>from</code></td>
        <td class="type">
          <span class="param-type">Number</span>
        </td>
        <td class="attributes">
        </td>
        <td class="description last">
          <p>The value of the axis when the move was started.</p>
        </td>
      </tr>
      <tr class="deep-level-0">
        <td class="name"><code>to</code></td>
        <td class="type">
          <span class="param-type">Number</span>
        </td>
        <td class="attributes">
          &lt;optional&gt;<br>
        </td>
        <td class="description last">
          <p>The target value of the axis. This property is only present if it was specified in the movement.</p>
        </td>
      </tr>
      <tr class="deep-level-0">
        <td class="name"><code>speed</code></td>
        <td class="type">
          <span class="param-type">Number</span>
        </td>
        <td class="attributes">
          &lt;optional&gt;<br>
        </td>
        <td class="description last">
          <p>The speed of the movement. This property is only present if <code>to</code> was specified.</p>
        </td>
      </tr>
      <tr class="deep-level-0">
        <td class="name"><code>direction</code></td>
        <td class="type">
          <span class="param-type">Number</span>
        </td>
        <td class="attributes">
          &lt;optional&gt;<br>
        </td>
        <td class="description last">
          <p>
            The direction of the movement. This property is only present if <code>to</code> was specified.<br/><br/>
            -1 if <code>to</code> < <code>from</code><br/>
            &nbsp1 if <code>to</code> > <code>from</code><br/>
            &nbsp0 if <code>to</code> = <code>from</code>
          </p>
        </td>
      </tr>
      <tr class="deep-level-0">
        <td class="name"><code>frequency</code></td>
        <td class="type">
          <span class="param-type">Number</span>
        </td>
        <td class="attributes">
        </td>
        <td class="description last">
          <p>The update frequency (50 Hz in the default configuration).</p>
        </td>
      </tr>
      <tr class="deep-level-0">
        <td class="name"><code>period</code></td>
        <td class="type">
          <span class="param-type">Number</span>
        </td>
        <td class="attributes">
        </td>
        <td class="description last">
          <p>The length of time between updates in seconds ( 1 / frequency).</p>
        </td>
      </tr>
      <tr class="deep-level-0">
        <td class="name"><code>duration</code></td>
        <td class="type">
          <span class="param-type">Number</span>
        </td>
        <td class="attributes">
        </td>
        <td class="description last">
          <p>The duration of the move in seconds.</p>
        </td>
      </tr>
      <tr class="deep-level-0">
        <td class="name"><code>stepCount</code></td>
        <td class="type">
          <span class="param-type">Number</span>
        </td>
        <td class="attributes">
        </td>
        <td class="description last">
          <p>The total number of steps of the move.</p>
        </td>
      </tr>
      <tr class="deep-level-0">
        <td class="name"><code>index</code></td>
        <td class="type">
          <span class="param-type">Number</span>
        </td>
        <td class="attributes">
        </td>
        <td class="description last">
          <p>The index of the current step.</p>
        </td>
      </tr>
      <tr class="deep-level-0">
        <td class="name"><code>currentValue</code></td>
        <td class="type">
          <span class="param-type">Number</span>
        </td>
        <td class="attributes">
        </td>
        <td class="description last">
          <p>The current value of the axis.</p>
        </td>
      </tr>
      <tr class="deep-level-0">
        <td class="name"><code>x</code></td>
        <td class="type">
          <span class="param-type">Number</span>
        </td>
        <td class="attributes">
        </td>
        <td class="description last">
          <p>The fraction of the move that should be completed by the end of this step.</p>
        </td>
      </tr>
    </tbody>
  </table>
</div>
<br/>

<div style="text-align: center; font-size: 18px">Next: <a href="./tutorial-motion-api-multiaxis.html">Multiaxis Movements</a></div>

