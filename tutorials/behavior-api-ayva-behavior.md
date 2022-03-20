<p style="margin-top:40px"><code>AyvaBehavior</code> is a base class that implements <code>perform()</code> in such a way as to allow moves, logic, pauses, or sub behaviors to be <i>queued</i>. This ensures the behavior is interruptable, that logic executes at the right time, and that the main thread is never blocked. It works by maintaining an internal <i>action queue</i>, and making each call to <code>perform()</code> execute the next action from the queue.</p>

To use an ```AyvaBehavior``` as the base class of your behaviors you must import it:

```javascript
import Ayva, { AyvaBehavior } from 'https://unpkg.com/ayvajs';
```

### generateActions()

When you extend an ```AyvaBehavior```, you must implement the ```generateActions()``` method. The ```generateActions()``` method takes an Ayva instance as the argument and is expected to populate the action queue with all of the actions that constitute a single iteration of the behavior. ```AyvaBehavior``` contains methods that allow you to do this. For example, here is a reimplementation of the stroke behavior from the previous section using ```AyvaBehavior```:

```javascript
class MyStrokeBehavior extends AyvaBehavior {
  constructor (speed) {
    super();
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

_Note: This particular example doesn't really benefit much from using ```AyvaBehavior```, but we will expand upon this later._

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
}, {
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
      if (Math.random() < 0.5) {
        // 50% chance of performing a slightly different stroke pattern with a twist.
        behavior.queueMove(stroke(0.25, this.speed * 2).twist(0));
        behavior.queueMove(stroke(1, this.speed / 2).twist(0.5));
        behavior.queueSleep(0.25);
      }
    });
  }
}

ayva.do(new MyStrokeBehavior(1));
```

_Note: the function action takes a_ ```behavior``` _parameter and we use that instead of_ ```this``` _to edit the action queue. This is to ensure that the "correct" behavior's queue is updated. This becomes important if this behavior were being queued by another ```AyvaBehavior```—which is explored in the next section._

<a href="./tutorial-examples/behavior-api-custom-example-6.html" target="_blank">Try it out!</a>

### queueBehavior()

TBD
