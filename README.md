# ayva
## What is Ayva?
Ayva is a lightweight, behavior-based JavaScript library for controlling <a href="https://www.patreon.com/tempestvr" target="_blank">Open Source Multi Axis Stroker Robots</a>.

The following codepen examples demo some of the capabilities of Ayva and show how trivial it is to setup and perform complex movements (as well as demonstrate the usage of the <a href="https://github.com/ayvajs/osr-emu" target="_blank">OSR Emulator</a>—a useful component for visualizing and testing movements without an actual hardware device):

<a href="https://ayvajs.github.io/ayvajs/orbit-grind-example.html" target="_blank">Orbit Grind</a>  
<a href="https://ayvajs.github.io/ayvajs/classic-stroke-example.html" target="_blank">Classic Stroke</a>  
<a href="https://ayvajs.github.io/ayvajs/custom-behavior-example.html" target="_blank">Custom Behavior</a>  
<a href="https://ayvajs.github.io/ayvajs/random-stroker-example.html" target="_blank">Random Stroker</a>     

Features:
- Perform arbitrarily complex movements across multiple axes using an expressive Motion API.
- Construct arbitrarily complex behaviors using an action queue based Behavior API.
- Built-in common motion shapes (cosine, parabolic, linear, tempest).
- Built-in Classic Stroke behavior and orbital motion based behavior (Tempest Stroke).
- Run built-in patterns by name (orbit-grind, vortex-tease, swirl-tease, etc)
- Configurable. Setup an arbitrary number of axes with limits, alias, and type (linear, rotation, or auxiliary).
- Abstracts away low level details such as outputing TCode.
- Supports outputing commands to multiple devices at once.
- Agnostic about the nature of the target device(s) (doesn't care if device is <a href="https://github.com/ayvajs/osr-emu" target="_blank">simulated</a> or actual).
- Cross platform with zero dependencies.
- Runs in a browser, as part of a Node.js app, or theoretically anywhere with a JavaScript runtime.
- Extensively tested (100% coverage).
- Thoroughly <a href="https://ayvajs.github.io/ayvajs/index.html" target="_blank">documented</a>.
- Quick and easy setup.

## Quick Start
### CDN
In a browser, Ayva can be imported as an <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules" target="_blank">ES6 module</a> using a CDN such as unpkg:

```html
<!DOCTYPE html>
<body>
  <script type="module">
    import Ayva from 'https://unpkg.com/ayvajs';

    const ayva = new Ayva().defaultConfiguration();

    // ...
  </script>
</body>
```

One or more output devices must be added to an instance of Ayva in order to do anything. You may create your own device object (any object with a _write_ method is considered an output device), or you may use the simple <a href="https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API" target="_blank">Web Serial API</a> based _WebSerialDevice_ provided:

```html
<!DOCTYPE html>
<body>
  <button id="connect">Connect</button>

  <script type="module">
    import Ayva, { WebSerialDevice } from 'https://unpkg.com/ayvajs';

    const ayva = new Ayva().defaultConfiguration();
    const device = new WebSerialDevice();

    document.querySelector('#connect').addEventListener('click', () => {
      device.requestConnection().then(() => {
        ayva.addOutputDevice(device);

        // I can now start using Ayva to control the device.
        // Send a command to move the default axis to position zero at 1 unit per second.
        ayva.move({ to: 0, speed: 1 });
      }).catch((error) => {
        console.error('Error connecting to device:', error);
      });
    });
  </script>
</body>
```

_Note: in the example above we needed to request a connection to the device after a button click. This is because the Web Serial API only allows a request to connect if it was triggered by a user gesture._
### npm

Ayva can be installed in a <a href="https://nodejs.org/en/" target="_blank">Node.js</a> app via <a href="https://docs.npmjs.com/about-npm" target="_blank">npm</a>:

```
npm install ayvajs
```

And imported like so:
```js
import Ayva from 'ayvajs';

const ayva = new Ayva().defaultConfiguration();

// ...
```

Ayva does not provide any device implementations that work in a Node.js app. Instead, Ayva can work with an external library. The recommended serial library for Node.js is <a href="https://serialport.io/" target="_blank">serialport</a>):

```
npm install serialport
```
Then:
```js
import Ayva from 'ayvajs';
import SerialPort from 'serialport';

const device = new SerialPort('/dev/cu.usbserial-0001');

const ayva = new Ayva().defaultConfiguration();
ayva.addOutputDevice(device);

ayva.move({ to: 0; speed: 1 });
```
_Note: The port used above (/dev/cu.usbserial-0001) is just an example. Yours may be different._

## Tutorials
For more detailed information on how to use Ayva, see the following tutorials provided in the <a href="https://ayvajs.github.io/ayvajs/index.html" target="_blank">Documentation</a>:

<a href="https://ayvajs.github.io/ayvajs/tutorial-getting-started.html" target="_blank">Getting Started</a>  
<a href="https://ayvajs.github.io/ayvajs/tutorial-configuration.html" target="_blank">Configuration</a>  
<a href="https://ayvajs.github.io/ayvajs/tutorial-motion-api.html" target="_blank">Motion API</a>  
<a href="https://ayvajs.github.io/ayvajs/tutorial-behavior-api.html" target="_blank">Behavior API</a>   



