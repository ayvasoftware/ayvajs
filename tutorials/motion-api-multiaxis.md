## move()

To perform multiaxis movements simply pass additional axes as arguments to the ```move()``` method:

```javascript
// Slowly stroke to the bottom while twisting to the left.
ayva.move({
  to: 0,
  speed: 0.25
},{
  axis: 'twist',
  to: 0,
  speed: 0.25
});
```
_Note: Remember that when an axis is not specified, it uses the_ default _axis. Therefore the first axis in this example is the_ stroke axis.  
<a href="./tutorial-examples/move-multiaxis-example-1.html" target="_blank" style="padding-top:10px; display:block">Try it out!</a>

Everything that has been covered in previous tutorials applies to multiaxis movements (ramps, value providers, etc).
Movements across multiple axes are performed simultaneously and "independently" (i.e. they need not have the same duration). The <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise" target="_blank">Promise</a> that ```move()``` returns will resolve when all axes have finished moving:

```javascript
// The twist axis move in this example is twice as fast 
// as the stroke axis move. Therefore, it finishes first.
ayva.move({
  to: 0,
  speed: 0.25
},{
  axis: 'twist',
  to: 0,
  speed: 0.5
});
```

<a href="./tutorial-examples/move-multiaxis-example-2.html" target="_blank">Try it out!</a>

### Auto Synchronization
If you omit the duration (or speed) for an axis in a multiaxis movement, its duration will automatically be set to the duration of the longest running (slowest) axis:
```javascript
// The twist and roll axis in this example take on the duration of the stroke axis.
// All axes therefore finish at the same time.
ayva.move({
  to: 0,
  speed: 0.25
},{
  axis: 'twist',
  to: 0,
},{
  axis: 'roll',
  to: 0
});
```

<a href="./tutorial-examples/move-multiaxis-example-3.html" target="_blank">Try it out!</a>

It follows that _at least one axis_ __must__ specify a speed or duration, or an error will be thrown.

### Manual Synchronization
It is possible to instead synchronize the duration of an axis with a specific axis using the ```sync``` property:
```javascript
// In this example, the longest running move (slowest) is the twist axis.
// However, the roll axis is set to synchronize with the fastest move (the stroke axis).
ayva.move({
  to: 0,
  speed: 0.5
},{
  axis: 'twist',
  to: 0,
  speed: 0.25
},{
  axis: 'roll',
  to: 0,
  sync: 'stroke'
});
```

<a href="./tutorial-examples/move-multiaxis-example-4.html" target="_blank">Try it out!</a>

### Value Provider Parameters
The parameters passed to value providers in multiaxis movements are unique to each axis (when applicable).
See the full list of <a href="./tutorial-motion-api-value-providers.html#parameters" target="_blank">parameters</a> in the Value Providers documentation.

### home()
Ayva provides a convenience method to move all linear and rotation axes to the _home_ position (0.5):

```javascript
ayva.home();
```

It returns a Promise that resolves when all the moves have finished.





