## perform()

A behavior as far as Ayva is concerned is any object with a ```perform()``` method. An implementation of ```perform()``` should take an Ayva instance and
return a <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise" target="_blank">Promise</a> that resolves when a single iteration of the behavior is complete. Here is an example of a behavior that simply strokes up and down
the full range of the stroke axis:

```javascript
const myStrokeBehavior = {
  perform (ayvaInstance) {
    ayvaInstance.stroke(0, 1);        // Stroke down.
    return ayvaInstance.stroke(1, 1); // Stroke up.
  }
};

ayva.do(myStrokeBehavior); // Perform the behavior until commanded to stop.
```

_Note: This example uses the convenience methods for stroking as documented in the <a href="./tutorial-motion-api-syntactic-sugar.html#convenience" target="_blank">Syntactic Sugar ($)</a> tutorial._

<a href="./tutorial-examples/behavior-api-custom-example-1.html" target="_blank">Try it out!</a>

A behavior is independent of any specific instance of Ayva. When a particular Ayva instance performs the behavior, it passes itself as the parameter to ```perform()```. In the previous example we named this parameter ```ayvaInstance``` just to make it clear that it is not necessarily the same instance of Ayva used later in the example.

> <p style="color: #AA0000"><b>Warning!</b> Remember to return a Promise that resolves when the behavior finishes! The <code style="color: #AA0000">do()</code> method continuously calls <code style="color: #AA0000">perform()</code>, so not doing this will cause an infinite loop and <b>block the main thread!</b></p>
```javascript
// Do not do this!
const myStrokeBehavior = {
  perform (ayvaInstance) {
    ayvaInstance.stroke(0, 1);  // Stroke down.
    ayvaInstance.stroke(1, 1);  // Stroke up without returning the Promise...!
  }
}

// This will block!!
ayva.do(myStrokeBehavior); 
```

### Object Oriented Programming

You can package your behavior into a class to make it more reusable and/or configurable. Here is a reimplementation of the previous example
using OOP to allow setting the speed of the stroke:

```javascript
class MyStrokeBehavior {
  constructor (speed) {
    this.speed = speed;
  }

  perform (ayva) {
    ayva.stroke(0, this.speed);
    return ayva.stroke(1, this.speed);
  }
}

ayva.do(new MyStrokeBehavior(2)); // Perform a 2 strokes per second stroke.
```

<a href="./tutorial-examples/behavior-api-custom-example-2.html" target="_blank">Try it out!</a>

### Completion

By default, an Ayva instance will perform a behavior forever until commanded to stop. A behavior can however signal its own completion if desired. It can
do this by setting its ```complete``` property to true. Here is a behavior that only strokes for five seconds and then stops (using <a href="https://developer.mozilla.org/en-US/docs/Web/API/Performance/now" target="_blank">performance.now()</a> to keep track of time):

```javascript
class FiveSecondStroke {
  constructor (speed) {
    this.speed = speed;
  }

  perform (ayva) {
    if (!this.startTime) {
      this.startTime = performance.now();
    }

    if (performance.now() - this.startTime < 5000) {
      ayva.stroke(0, this.speed);
      return ayva.stroke(1, this.speed);  
    } else {
      // Five seconds has elapsed, so signal completion.
      this.complete = true;
    }
  }
}

ayva.do(new FiveSecondStroke(2)); // Perform a 2 strokes per second stroke for five seconds.
```

_Note: Ayva includes a convenience class for dealing with durations called ```VariableDuration```. See the <a href="./VariableDuration.html" target="_blank">API Documentation</a> to think of other ways you might implement this example._

<a href="./tutorial-examples/behavior-api-custom-example-3.html" target="_blank">Try it out!</a>

### AyvaBehavior

For simple behaviors that consist only of moves, creating an object or class that implements the ```perform()``` method might be enough. However, for more complex behaviors that require logic based on the current state, have pauses, or depend on the actions of sub behaviors, the asynchronous nature of the Motion API requires special handling.

```AyvaBehavior``` is a base class that implements ```perform()``` in such a way as to allow moves, logic, pauses, or sub behaviors to be _queued_.

TBD.
