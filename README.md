# ayva
## What is Ayva?
Ayva is a lightweight, behavior-based JavaScript library for controlling [Open Source Multi Axis Stroker Robots](https://www.patreon.com/tempestvr).

The quickest way to get a feel for some of the capabilities of Ayva is with [this codepen example](https://codepen.io/soritesparadox/pen/YzrmaJq) that shows how easy it is to setup and perform a complex movement (an orbit grind). It also demonstrates the usage of the [OSR Emulator](https://github.com/ayvajs/osr-emu)—a useful component for visualizing and testing movements without an actual hardware device.

Features:
- Perform arbitrarily complex movements across multiple axes using an expressive Motion API.
- Construct arbitrarily complex behaviors using an action queue based Behavior API.
- Built-in common motion shapes (cosine, parabolic, linear, tempest).
- Built-in Classic Stroke behavior and orbital motion based behavior (Tempest Stroke).
- Configurable. Setup an arbitrary number of axes with limits, alias, and type (linear, rotation, or auxiliary).
- Abstracts away low level details such as outputing TCode.
- Supports outputing commands to multiple devices at once.
- Agnostic about the nature of the target device(s) (doesn't care if device is [simulated](https://github.com/ayvajs/osr-emu) or actual).
- Cross platform with zero dependencies.
- Runs in a browser, as part of a Node.js app, or theoretically anywhere with a JavaScript runtime.
- Extensively tested (100% coverage).
- Thoroughly [documented](https://ayvajs.github.io/ayvajs/index.html).
- Quick and easy setup.

## Installation
### CDN
In a browser, Ayva can be imported as an [ES6 module](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules) using a CDN such as unpkg:

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

One or more output devices must be added to an instance of Ayva in order to do anything. You may create your own device object (any object with a _write_ method is considered an output device), or you may use the simple [Web Serial API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API) based _BrowserSerialDevice_ provided:

```html
<!DOCTYPE html>
<body>
  <button id="connect">Connect</button>

  <script type="module">
    import Ayva, { BrowserSerialDevice } from 'https://unpkg.com/ayvajs';

    const ayva = new Ayva().defaultConfiguration();
    const device = new BrowserSerialDevice();

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

Ayva can be installed in a [Node.js](https://nodejs.org/en/) app via [npm](https://docs.npmjs.com/about-npm):

```
npm install ayvajs
```

And imported like so:
```js
import Ayva from 'ayvajs';

const ayva = new Ayva().defaultConfiguration();

// ...
```

Ayva does not provide any device implementations that work in a Node.js app. Instead, Ayva can work with an external library. The recommended serial library for Node.js is [serialport](https://serialport.io/):

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
For more detailed information on how to use Ayva, see the following tutorials provided in the [Documentation](https://ayvajs.github.io/ayvajs/index.html):

[Getting Started](https://ayvajs.github.io/ayvajs/tutorial-getting-started.html)  
[Configuration](https://ayvajs.github.io/ayvajs/tutorial-configuration.html)  
[Motion API](https://ayvajs.github.io/ayvajs/tutorial-motion-api.html)  
[Behavior API](https://ayvajs.github.io/ayvajs/tutorial-behavior-api.html)  



