> This tutorial assumes basic familiarity with <a href="https://www.patreon.com/tempestvr" target="_blank">Open Source Multi Axis Stroker Robots</a>, TCode, and <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript" target="_blank">JavaScript</a>.

## What is Ayva?
Ayva is a lightweight, behavior-based JavaScript library for controlling <a href="https://www.patreon.com/tempestvr" target="_blank">Open Source Multi Axis Stroker Robots</a> such as the <a href="https://www.thingiverse.com/thing:4843410" target="_blank">OSR2+</a>, SR6, or any device that can be controlled with TCode. It allows specifying simple or complex multi-axis movements using an expressive Motion API. More complex behaviors can be constructed using a Behavior API.
## Quick Start
### CDN
In a web app, Ayva can be imported as an <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules" target="_blank">ES6 module</a> using a <a href="https://developer.mozilla.org/en-US/docs/Glossary/CDN" target="_blank">CDN</a> such as <a href="https://unpkg.com/" target="_blank">unpkg</a>:

```html
<!DOCTYPE html>
<body>
  <script type="module">
    // Import the latest version of Ayva. 
    // To import a specific version, add @<version> to the end of the url. 
    // Ex: https://unpkg.com/ayvajs@0.10.0
    import Ayva from 'https://unpkg.com/ayvajs'; 

    // Construct a new instance of Ayva using the default configuration (a stroker with 6+ axes)
    const ayva = new Ayva().defaultConfiguration();

    // ...
  </script>
</body>
```

One or more output devices must be added to an instance of Ayva in order to do anything. You may create your own device object (any object with a ```write()``` method is considered an output device), or you may use the simple <a href="https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API" target="_blank">Web Serial API</a> based _WebSerialDevice_ provided:

```html
<!DOCTYPE html>
<body>
  <!-- 
    Create a button that requests a connection to the device when clicked. We need to do this
    because the Web Serial API only allows a request to connect if it was triggered by a user gesture.
  -->
  <button id="connect">Connect</button>

  <script type="module">
    import Ayva, { WebSerialDevice } from 'https://unpkg.com/ayvajs';

    // Construct a new instance of Ayva using the default configuration (a stroker with 6+ axes)
    const ayva = new Ayva().defaultConfiguration();

    // Construct a new WebSerialDevice.
    const device = new WebSerialDevice();

    // Setup event listener to request device connection after the Connect button is clicked.
    document.querySelector('#connect').addEventListener('click', () => {
      device.requestConnection().then(() => {
        // Add the output device to the Ayva instance.
        ayva.addOutputDevice(device);

        // I can now start using Ayva to control the device.
        // The following line sends a command to move the default axis to position zero at 1 unit per second.
        ayva.move({ to: 0, speed: 1 });
      }).catch((error) => {
        console.error('Error connecting to device:', error);
      });
    });
  </script>
</body>
```

_You can try out this example <a href="https://ayvajs.github.io/ayvajs/web-serial-example.html" target="_blank">here</a>. Make sure your device is powered on and plugged into your machine. Once you have clicked the button and connected, your device should move to the bottom position after a moment._

### npm

Ayva can be installed and used in a <a href="https://nodejs.org/en/" target="_blank">Node.js</a> app via <a href="https://docs.npmjs.com/about-npm" target="_blank">npm</a>:

```
npm install ayvajs
```

To import Ayva into your Node.js app:
```js
import Ayva from 'ayvajs';

const ayva = new Ayva().defaultConfiguration();

// ...
```

Ayva does not provide any device implementations that work in a Node.js app. Instead, Ayva can work with an external library. The recommended serial library for Node.js is <a href="https://serialport.io/" target="_blank">serialport</a>:

```
npm install serialport
```
Then:  

```js
import Ayva from 'ayvajs';
import { SerialPort } from 'serialport';

// Create a new device on the specified port. 
// Note: /dev/cu.usbserial-0001 is just an example. Your port will likely be different.
const device = new SerialPort({ path: '/dev/cu.usbserial-0001', baudRate: 115200 });

const ayva = new Ayva().defaultConfiguration();
ayva.addOutputDevice(device);

ayva.move({ to: 0, speed: 1 });
```
_Note: This example is the syntax from __version 10__ of SerialPort_.

When running in Node.js, your app will need to be configured with type _module_ (in the <a href="https://nodejs.org/api/packages.html#type" target="_blank">package.json</a>), __or__ you will need to suffix your file with the ```.mjs``` extension and include that extension explicitly when running it. i.e.

```javascript
node my-app.mjs
```

<div style="text-align: center; font-size: 18px">Next: <a href="./tutorial-configuration.html">Configuration</a></div>
