# ayva
## What is Ayva?
Ayva is a lightweight, behavior-based JavaScript library for controlling <a href="https://www.patreon.com/tempestvr" target="_blank">Open Source Multi Axis Stroker Robots</a> such as the <a href="https://www.thingiverse.com/thing:4843410" target="_blank">OSR2+</a>, SR6, or any device that can be controlled with TCode.

The following codepen examples demonstrate some of the capabilities of Ayva (as well as usage of the <a href="https://github.com/ayvajs/osr-emu" target="_blank">OSR Emulator</a>—a useful component for visualizing and testing movements without an actual hardware device):

<a href="https://ayvajs.github.io/ayvajs-docs/orbit-grind-example.html" target="_blank">Orbit Grind</a>  
<a href="https://ayvajs.github.io/ayvajs-docs/classic-stroke-example.html" target="_blank">Classic Stroke</a>  
<a href="https://ayvajs.github.io/ayvajs-docs/custom-behavior-example.html" target="_blank">Custom Behavior</a>  
<a href="https://ayvajs.github.io/ayvajs-docs/random-stroker-example.html" target="_blank">Random Stroker</a>     

Features:
- Perform arbitrarily complex movements across multiple axes using an expressive Motion API.
- Construct arbitrarily complex behaviors using a <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function*" target="_blank">generator function</a> based Behavior API.
- Built-in common motion shapes (cosine, parabolic, linear, tempest).
- Built-in Classic Stroke behavior and orbital motion based behaviors (Tempest Strokes).
- Run built-in patterns by name (orbit-grind, vortex-tease, swirl-tease, etc).
- Configurable. Setup an arbitrary number of axes with limits, alias, and type (linear, rotation, or auxiliary).
- Supports the OSR2+, SR6, or any device that can be controlled with TCode.
- Agnostic about the nature of the target device(s) (doesn't care if device is <a href="https://github.com/ayvajs/osr-emu" target="_blank">simulated</a> or actual).
- Supports outputing commands to multiple devices at once.
- Cross platform with zero dependencies.
- Runs in a browser, as part of a Node.js app, or theoretically anywhere with a JavaScript runtime.
- Extensively tested (100% coverage).
- Thoroughly <a href="https://ayvajs.github.io/ayvajs-docs/index.html" target="_blank">documented</a>.
- Quick and easy setup.

## Tutorials
For detailed information on how to use Ayva, see the following tutorials provided in the <a href="https://ayvajs.github.io/ayvajs-docs/index.html" target="_blank">Documentation</a>:

<a href="https://ayvajs.github.io/ayvajs-docs/tutorial-getting-started.html" target="_blank">Getting Started</a>  
<a href="https://ayvajs.github.io/ayvajs-docs/tutorial-configuration.html" target="_blank">Configuration</a>  
<a href="https://ayvajs.github.io/ayvajs-docs/tutorial-motion-api.html" target="_blank">Motion API</a>  
<a href="https://ayvajs.github.io/ayvajs-docs/tutorial-behavior-api.html" target="_blank">Behavior API</a>   



