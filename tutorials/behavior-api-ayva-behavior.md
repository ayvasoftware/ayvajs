<p style="margin-top:40px"><code>AyvaBehavior</code> is a base class that implements <code>perform()</code> in such a way as to allow moves, logic, pauses, or sub behaviors to be <i>queued</i>. This ensures the behavior is interruptable, that logic executes at the right time, and that the main thread is never blocked. It works by maintaining an internal <i>action queue</i>, and making each call to <code>perform()</code> execute only the next action from the queue.</p>

To use an ```AyvaBehavior``` as the base class of your behaviors you must import it. For example, _in a browser_:

```javascript
import Ayva, { AyvaBehavior } from 'https://unpkg.com/ayvajs';
```
or _from within a Node.js app_:
```javascript
import Ayva, { AyvaBehavior } from 'ayvajs';
```

### generateActions()

When you extend an ```AyvaBehavior```, you must implement the ```generateActions()``` method. The ```generateActions()``` method takes an optional Ayva instance as the argument and is expected to populate the action queue with all of the actions that constitute a single iteration of the behavior. ```AyvaBehavior``` contains methods that allow you to do this. For example, here is a reimplementation of the stroke behavior from the previous section using ```AyvaBehavior```:

```javascript
class MyStrokeBehavior extends AyvaBehavior {
  constructor (speed) {
    super(); // Must call super constructor.
    this.speed = speed;
  }

  generateActions (ayva) {
    const { stroke } = ayva.$; // Get the move builder method for the stroke axis.

    this.queueMove(stroke(0, this.speed)); // This adds the downstroke move builder to the queue.
    this.queueMove(stroke(1, this.speed)); // This adds the upstroke move builder to the queue.
  }
}

ayva.do(new MyStrokeBehavior(2)); // 2 strokes per second.
```

_Note: This particular example doesn't really benefit that much from using ```AyvaBehavior```, but we will expand upon this later._

<a href="./tutorial-examples/behavior-api-custom-example-4.html" target="_blank">Try it out!</a>

### queueMove()

As shown in the previous example, the ```queueMove()``` method of ```AyvaBehavior``` can be used to add moves to the action queue. It is overloaded to either accept a _<a href="./tutorial-motion-api-syntactic-sugar.html#move-builders" target="_blank">move builder</a>_ or _<a href="./tutorial-motion-api-overview.html" target="_blank">move descriptors</a>_. i.e. The following are equivalent:

```javascript
this.queueMove(ayva.$.stroke(0, 1).twist(0));
```

```javascript
this.queueMove({
  axis: 'stroke',
  to: 0,
  speed: 1
},{
  axis: 'twist',
  to: 0
});
```

### queueSleep()

```queueSleep()``` can be used to pause for the specified number of seconds before proceeding to the next action. The following example waits a half second in between strokes:

```javascript
class MyStrokeBehavior extends AyvaBehavior {
  constructor (speed) {
    super();
    this.speed = speed;
  }

  generateActions (ayva) {
    const { stroke } = ayva.$;

    this.queueMove(stroke(0, this.speed));
    this.queueSleep(0.5);
    this.queueMove(stroke(1, this.speed));
    this.queueSleep(0.5);
  }
}

ayva.do(new MyStrokeBehavior(1.5));
```

<a href="./tutorial-examples/behavior-api-custom-example-5.html" target="_blank">Try it out!</a>

### queueFunction()

```queueFunction()``` can be used to add a function to the action queue. This function can perform whatever logic is desired and modify the action queue of the behavior if necessary.

```javascript
class MyStrokeBehavior extends AyvaBehavior {
  constructor (speed) {
    super();
    this.speed = speed;
  }

  generateActions (ayva) {
    const { stroke } = ayva.$;

    this.queueMove(stroke(0, this.speed));
    this.queueMove(stroke(1, this.speed));
    this.queueSleep(0.5);

    this.queueFunction((behavior) => {
      if (Math.random() < 0.25) {
        // 25% chance of performing a slightly different stroke pattern with a twist.
        behavior.queueMove(stroke(0.25, this.speed * 2).twist(0));
        behavior.queueMove(stroke(1, this.speed / 2).twist(0.5));
        behavior.queueSleep(0.25);
      }
    });
  }
}

ayva.do(new MyStrokeBehavior(1));
```

_Note: When called, the queued function is passed the_ ```behavior``` _that is actually executing the function. This becomes important if the behavior were being queued by another ```AyvaBehavior``` (i.e. being used as a sub behavior). This is why we use ```behavior.queueMove()``` inside of the function instead of ```this.queueMove()```. Sub behaviors will be explored in the next section._

<a href="./tutorial-examples/behavior-api-custom-example-6.html" target="_blank">Try it out!</a>

### queueBehavior()

```AyvaBehavior```'s can incorporate other ```AyvaBehavior```'s as sub behaviors using the ```queueBehavior()``` method. This method takes three parameters: the ```AyvaBehavior```, the number of iterations to generate, and the instance of Ayva (_the Ayva instance parameter is optional and only needed if the sub behavior's ```generateActions()``` method relies on an Ayva instance_).

The following example demonstrates using ```ClassicStroke``` as a sub behavior. It performs a basic ```ClassicStroke``` at a given speed, and then another at half speed:

```javascript
class MyCompositeBehavior extends AyvaBehavior {
  constructor (speed) {
    super();
    this.speed = speed;
  }

  generateActions () {
    const fullSpeedStroke = new ClassicStroke(0, 1, this.speed);
    const halfSpeedStroke = new ClassicStroke(0, 1, this.speed / 2);

    this.queueBehavior(fullSpeedStroke, 4); // 4 full speed strokes.
    this.queueBehavior(halfSpeedStroke, 4); // 4 half speed strokes.
  }
}

ayva.do(new MyCompositeBehavior(1));
```

_Note: ```ClassicStroke``` does not need an Ayva instance to generate its actions, so the third parameter to ```queueBehavior()``` is omitted._

<a href="./tutorial-examples/behavior-api-custom-example-7.html" target="_blank">Try it out!</a>

### insert*()

Every ```queue*()``` method has a corresponding ```insert*()``` method that instead adds an action to the _front_ of the action queue. Ex:

```javascript
class MyStrokeBehavior extends AyvaBehavior {
  generateActions (ayva) {
    const { stroke } = ayva.$;

    this.queueMove(stroke(0, 1));
    this.queueMove(stroke(1, 1));

    this.queueFunction((behavior) => {
      if (Math.random() < 0.5) {
        // If we used queueSleep here this would end up occurring *after the subsequent strokes in the queue
        // Instead, because we used "insert" the sleep will occur immediately after this function runs.
        behavior.insertSleep(0.5);
      }
    });

    this.queueMove(stroke(0.5, 1));
    this.queueMove(stroke(1, 1));
  }
}

ayva.do(new MyStrokeBehavior());
```

<a href="./tutorial-examples/behavior-api-custom-example-8.html" target="_blank">Try it out!</a>

### Whew!

That's all for the Behavior API! Feel free to explore the <a href="./index.html" target="_blank">API Documentation</a> to discovered anything not covered here. 😊
