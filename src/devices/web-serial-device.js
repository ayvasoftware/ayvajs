/**
 * Small convenience class for easily connecting to a serial device from a browser
 * using the [Web Serial API]{@link https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API}.
 */
class WebSerialDevice {
  #baudRate;

  #connected = false;

  #output = null;

  #input = null;

  #serial = null;

  /**
   * Whether the device is currently connected.
   */
  get connected () {
    return this.#connected;
  }

  /**
   * Create a new WebSerialDevice.
   *
   * @example
   * const device = new WebSerialDevice();
   *
   * @param {Number} [baudRate=115200] - Communication rate.
   * @param {Serial} [serial=navigator.serial] - Web Serial API interface.
   */
  constructor (baudRate = 115200, serial = null) {
    this.#baudRate = baudRate;
    this.#serial = serial || (globalThis.navigator ? globalThis.navigator.serial : null);
  }

  /**
   * Opens a request to connect to a serial device.
   *
   * @example
   * const device = new WebSerialDevice();
   * device.requestConnection().then(() => {
   *   // ...
   * });
   *
   * @returns {Promise} a promise that resolves when the device is connected, and rejects if the device failed to connect.
   */
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

  /**
   * Write output to the device.
   *
   * @param {String} output - string to send to the device.
   */
  write (output) {
    if (this.#connected) {
      this.#output.write(output);
    } else {
      throw new Error('No device connected.');
    }
  }
}

export default WebSerialDevice;
