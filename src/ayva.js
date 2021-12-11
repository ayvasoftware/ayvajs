class Ayva {
  #devices = [];

  #axes = {};

  /**
   * Create a new instance of Ayva with the specified configuration.
   *
   * @param {Object} [config]
   * @param {String} [config.name] - the name of this configuration
   * @param {String} [config.defaultAxis] - the default axis to command when no axis is specified
   * @param {Object[]} [config.axes] - an array of axis configurations (see {@link Ayva#configureAxis})
   * @class Ayva
   */
  constructor (config) {
    if (config) {
      this.name = config.name;
      this.defaultAxis = config.defaultAxis;

      if (config.axes) {
        config.axes.forEach((axis) => {
          this.configureAxis(axis);
        });
      }
    }
  }

  /**
   * Configures a new axis. If an axis with the same name has already been configured, it will be overridden.
   *
   * @param {Object} axisConfig - axis configuration object
   * @param {String} axisConfig.name - the machine name of this axis (such as L0, R0, etc...)
   * @param {String} axisConfig.type - linear, rotation, auxiliary, or boolean
   * @param {String|String[]} [axisConfig.alias] - an alias used to refer to this axis
   * @param {Object} [axisConfig.max = 1] - specifies maximum value for this axis (not applicable for boolean axes)
   * @param {Number} [axisConfig.min = 0] - specifies minimum value for this axis (not applicable for boolean axes)
   */
  configureAxis (axisConfig) {
    const resultConfig = this.#validateAxisConfig(axisConfig);

    const oldConfig = this.#axes[axisConfig.name];

    if (oldConfig) {
      delete this.#axes[oldConfig.alias];
    }

    this.#axes[axisConfig.name] = resultConfig;

    if (axisConfig.alias) {
      if (this.#axes[axisConfig.alias]) {
        throw new Error(`Alias already refers to another axis: ${axisConfig.alias}`);
      }

      this.#axes[axisConfig.alias] = resultConfig;
    }
  }

  /**
   * Fetch the configuration for an axis.
   *
   * @param {String} name - the name or alias of the axis to get.
   * @return {Object} axisConfig
   */
  getAxis (name) {
    const axis = this.#axes[name];

    if (axis) {
      return { ...axis };
    }

    return undefined;
  }

  /**
   * Registers new output devices. Ayva outputs commands to all connected devices.
   *
   * @param {...Object} device - object with a write method.
   */
  addOutputDevices (...devices) {
    for (const device of devices) {
      if (!(device && device.write && device.write instanceof Function)) {
        throw new Error(`Invalid device: ${device}`);
      }
    }

    this.#devices.push(...devices);
  }

  /**
   * Writes the specified command out to all connected devices.
   *
   * Caution: This method is primarily intended for internal usage. Any movements performed
   * by the command will not be tracked by Ayva's internal position tracking.
   * @private
   */
  write (command) {
    if (!this.#devices || !this.#devices.length) {
      throw new Error('No output devices have been added.');
    }

    if (!(typeof command === 'string' || command instanceof String)) {
      throw new Error(`Invalid command: ${command}`);
    }

    if (!(command.trim() && command.trim().length)) {
      throw new Error('Cannot send a blank command.');
    }

    for (const device of this.#devices) {
      device.write(command);
    }
  }

  /**
   * Ensure all required fields are present in the configuration and that all are of valid types.
   *
   * TODO: Move some of this out into a generic validator that takes a validation spec.
   * @param {Object} axisConfig
   * @private
   */
  #validateAxisConfig (axisConfig) {
    if (!axisConfig || typeof axisConfig !== 'object') {
      throw new Error(`Invalid configuration object: ${axisConfig}`);
    }

    const required = ['name', 'type'];

    const types = {
      name: 'string',
      type: 'string',
      alias: 'string',
      max: 'number',
      min: 'number',
    };

    const missing = required.filter(
      (property) => axisConfig[property] === undefined || axisConfig[property] === null
    ).sort();

    if (missing.length) {
      throw new Error(`Configuration is missing properties: ${missing.join(', ')}`);
    }

    const invalid = [];

    Object.keys(types).forEach((property) => {
      const value = axisConfig[property];

      // Since we've already caught missing required fields by this point,
      // we only need to check types of optional fields if they are actually present.
      if (value !== undefined && value !== null) {
        // eslint-disable-next-line valid-typeof
        if (typeof value !== types[property]) {
          invalid.push(property);
        } else if (property === 'min' || property === 'max') {
          if (value < 0 || value > 1) {
            invalid.push(property);
          }
        }
      }
    });

    if (invalid.length) {
      const message = invalid.sort().map((property) => `${property} = ${axisConfig[property]}`).join(', ');
      throw new Error(`Invalid configuration parameter(s): ${message}`);
    }

    if (['linear', 'rotation', 'auxiliary', 'boolean'].indexOf(axisConfig.type) === -1) {
      throw new Error(`Invalid type. Must be linear, rotation, auxiliary, or boolean: ${axisConfig.type}`);
    }

    const resultConfig = {
      ...axisConfig,
      max: axisConfig.max || 1,
      min: axisConfig.min || 0,
    };

    if (resultConfig.max === resultConfig.min || resultConfig.min > resultConfig.max) {
      throw new Error(`Invalid configuration parameter(s): max = ${resultConfig.max}, min = ${resultConfig.min}`);
    }

    return resultConfig;
  }
}

// Separate default export from the class declaration because of jsdoc shenanigans...
export default Ayva;
