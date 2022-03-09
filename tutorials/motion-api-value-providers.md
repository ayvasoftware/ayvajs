## What are Value Providers?

All moves take a finite amount of steps. Ayva determines how many steps a given move will take based on the duration of the move and the frequency of updates (as specified in the <a href="./tutorial-configuration.html#custom-configuration" target="_blank">configuration</a>). A value provider allows you to, well, _provide the value_ for an axis at a given step. 😊

It is nothing more than a function that takes parameters describing the current step—as well as the movement overall—and returns what the value should be. When paired with a target position and speed (or duration), a value provider can be used as a _ramp_ function that describes the shape of the motion towards a target. A value provider can also simply provide a value without regard to a target position. Both scenarios are covered in the following sections.

### Ramp

Value providers are passed as the ```value``` property. The following example demonstrates using the built-in ramp functions covered in the previous section as value providers for individual movements:

```javascript
// Move slowly to the top with the default ramp (cosine)
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

Value providers accept a single argument—a parameters object with the following properties:

TBD

