/**
 * Small convenience class for easily connecting to a serial device from a browser.
 * This class has been excluded from test coverage because mocking all the browser
 * globals involved is cumbersome. But it works. Trust me :).
 */
class WebSerialDevice {
  #baudRate;

  #connected = false;

  #output = null;

  #input = null;

  #serial = null;

  get connected () {
    return this.#connected;
  }

  constructor (baudRate = 115200, serial = null) {
    this.#baudRate = baudRate;
    this.#serial = serial || (globalThis.navigator ? globalThis.navigator.serial : null);
  }

  async requestConnection () {
    const port = await this.#serial.requestPort();

    await port.open({ baudRate: this.#baudRate });

    const encoder = new TextEncoderStream();
    encoder.readable.pipeTo(port.writable);

    const decoder = new TextDecoderStream();
    port.readable.pipeTo(decoder.writable);

    this.#output = encoder.writable.getWriter();
    this.#input = decoder.readable.getReader();
    this.#connected = true;

    const disconnectListener = (event) => {
      if (event.target === port) {
        this.#connected = false;

        this.#serial.removeEventListener('disconnect', disconnectListener);
      }
    };

    this.#serial.addEventListener('disconnect', disconnectListener);

    // Add a small delay so that the OSR has time to "boot" or w/e...
    return new Promise((resolve) => {
      setTimeout(resolve, 2000);
    });
  }

  write (output) {
    if (this.#connected) {
      this.#output.write(output);
    } else {
      throw new Error('No device connected.');
    }
  }
}

export default WebSerialDevice;
