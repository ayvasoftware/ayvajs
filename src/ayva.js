export class Ayva {

  /**
   * Create a new instance of Ayva with the specified configuration.
   * 
   * @param {Object} config
   * @param {String} config.name
   */
  constructor (config) {
    // TODO: Implement
    this._devices = [];
  }

  /**
   * @param {Object} axisConfig - axis configuration object
   * @param {String|String[]} [axisConfig.alias] - an alias or array of aliases used to refer to this axis
   * @param {String} axisConfig.name - the machine name of this axis (such as L0, R0, etc...)
   * @param {String} axisConfig.type - linear, rotation, auxiliary, or boolean
   * @param {Object} [axisConfig.limits] - specifies the bounds of output values on this axis (not applicable for boolean axes)
   * @param {Number} [axisConfig.limits.upper] - maximum value
   * @param {Number} [axisConfig.limits.lower] - minimum value
   * @param {Number} [axisConfig.scale] - interpreted as units per millimeter for linear axes, units per radian for rotation axes, and as a unitless scaler for auxiliary axes (not applicable for boolean axes).
   */
  configureAxis (axisConfig) {
    // TODO: Implement
  }

  /**
   * Registers new output devices. Ayva outputs commands to all connected devices.
   * 
   * @param {...Object} device - object with a write method.
   */
  addOutputDevices (...devices) {
    for (let device of devices) {
      if (!(device && device.write && device.write instanceof Function)) {
        throw new Error(`Invalid device: ${device}`);
      }
    }

    this._devices.push(...devices);
  }

  /**
   * Writes the specified command out to all connected devices.
   * 
   * Caution: This method is primarily intended for internal usage. Any movements performed
   * by the command will not be tracked by Ayva's internal position tracking.
   * @private
   */
  write (command) {
    if (!this._devices || !this._devices.length) {
      throw new Error('No output devices have been added.');
    }

    if (!(typeof command === 'string' || command instanceof String)) {
      throw new Error(`Invalid command: ${command}`);
    }

    if (!(command.trim() && command.trim().length)) {
      throw new Error('Cannot send a blank command.');
    }

    for (let device of this._devices) {
      device.write(command);
    }
  }
}

