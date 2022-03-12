## What are Behaviors?

Behaviors are classes that package movements and logic into an object that can be given to Ayva to perform. They allow for inheritance and composition to create more complex, reusable, and holistic experiences. 

There are some built-in behaviors, and you can create custom behaviors that utilize those. But you can also create something entirely new!

### do()

The entry point for behaviors is Ayva's simple ```do()``` method. It takes a behavior and performs that behavior until commanded to stop 
(or the behavior completes). The following example uses the built-in behavior __ClassicStroke__, whose default configuration commands
Ayva to perform a cosine shaped full stroke on the main axis at one stroke per second:

```javascript
ayva.do(new ClassicStroke());
```
_Note: A __ClassicStroke__ does not complete, so this will continue forever until ```ayva.stop()``` is called, or ```ayva.do()``` is called
with another behavior to perform instead._

<a href="./tutorial-examples/behavior-api-example.html" target="_blank">Try it out!</a>

How to create your own behaviors will be covered in later sections. The next section details how to configure __ClassicStroke__ for more
complex (and fun 😉) experiences.

<div style="text-align: center; font-size: 18px">Next: <a href="./tutorial-behavior-api-classic-stroke.html">Classic Stroke</a></div>




