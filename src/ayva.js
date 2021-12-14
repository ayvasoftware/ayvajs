import util from './util.js';

class Ayva {
  #devices = [];

  #axes = {};

  #frequency = 50; // Hz

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
      this.#frequency = (config.frequency || this.#frequency);

      if (config.axes) {
        config.axes.forEach((axis) => {
          this.configureAxis(axis);
        });
      }
    }
  }

  /**
   * Moves all linear and rotation axes to their neutral positions (0.5) or to
   * the value specified at the default speed of 0.5 units/second.
   *
   * @param {Number}
   * @return {Promise} A promise that resolves when the movements are finished.
   */
  home (value = 0.5) {
    if (typeof value !== 'number') {
      throw new Error(`Invalid value: ${value}`);
    }

    const to = util.clamp(value, 0, 1); // TODO: Move this down into the move method.
    const speed = 0.5;

    const movements = this.#getAxesArray()
      .filter((axis) => axis.type === 'linear' || axis.type === 'rotation')
      .map((axis) => ({ to, speed, axis: axis.name }));

    if (movements.length) {
      return this.move(...movements);
    }

    return Promise.resolve();
  }

  /**
   * Performs movements along one or more axes. This is a powerful method that can synchronize
   * axis movement while allowing for fine control over position, speed, and move duration.
   * For full details on how to use this method, see the {@tutorial motion-api} tutorial.
   *
   * @example
   * ayva.move({
   *   axis: 'stroke',
   *   to: 0,
   *   speed: 1,
   * });
   *
   * @param  {Object} movements
   * @return {Promise} a promise that resolves when all movements have finished
   */
  async move (...movements) {
    this.#validateMovements(movements);

    // TODO: Implement.
    // const valueSuppliers = [];

    // for (let movement of movements) {
    //   valueSuppliers.push(this.#createValueSupplier(movement));
    // }
  }

  /**
   * Configures a new axis. If an axis with the same name has already been configured, it will be overridden.
   *
   * @example
   * const ayva = new Ayva();
   *
   * ayva.configureAxis({
   *   name: 'L0',
   *   type: 'linear',
   *   alias: 'stroke',
   *   max: 0.9,
   *   min: 0.3,
   * });
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
   * Fetch an immutable object containing the properties for an axis.
   *
   * @param {String} name - the name or alias of the axis to get.
   * @return {Object} axisConfig - an immutable object of axis properties.
   */
  getAxis (name) {
    const fetchedAxis = this.#axes[name];

    if (fetchedAxis) {
      const axis = {};

      Object.keys(fetchedAxis).forEach((key) => {
        util.createConstant(axis, key, fetchedAxis[key]);
      });

      return axis;
    }

    return undefined;
  }

  /**
   * Return Ayva's device update frequency in Hz.
   */
  getFrequency () {
    return this.#frequency;
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
   * Registers new output devices. Ayva outputs commands to all connected devices.
   * Alias for #addOutputDevices()
   *
   * @param {...Object} device - object with a write method.
   */
  addOutputDevice (...devices) {
    this.addOutputDevices(...devices);
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
   * All the validation on movement descriptors :O
   * 
   * @param {*} movements
   */
  #validateMovements (movements) {
    // TODO: Implement sync validation.
    if (!movements || !movements.length) {
      throw new Error('Must supply at least one movement.');
    }

    let atLeastOneDuration = false;
    const seenAxes = {};
    const has = (obj, prop) => Object.prototype.hasOwnProperty.call(obj, prop);

    movements.forEach((movement) => {
      if (!movement || typeof movement !== 'object') {
        throw new Error(`Invalid movement: ${movement}`);
      }

      if (!has(movement, 'to')) {
        throw new Error('Missing parameter \'to\'.');
      }

      if ((typeof movement.to !== 'number' && typeof movement.to !== 'function')) {
        throw new Error(`Invalid parameter 'to': ${movement.to}`);
      }

      if (typeof movement.to === 'number' && (movement.to < 0 || movement.to > 1)) {
        throw new Error(`Invalid parameter 'to': ${movement.to}`);
      }

      if (has(movement, 'speed') || has(movement, 'duration')) {
        atLeastOneDuration = true;

        if (has(movement, 'speed')) {
          if (typeof movement.speed !== 'number' || movement.speed <= 0) {
            throw new Error(`Invalid parameter 'speed': ${movement.speed}`);
          }
        } else if (has(movement, 'duration')) {
          if (typeof movement.duration !== 'number' || movement.duration <= 0) {
            throw new Error(`Invalid parameter 'duration': ${movement.duration}`);
          }
        }

        if (has(movement, 'speed') && has(movement, 'duration')) {
          throw new Error('Cannot supply both speed and duration.');
        }
      }

      if (!has(movement, 'axis') && !this.defaultAxis) {
        throw new Error('No default axis configured. Must specify an axis for each movement.');
      }

      if (has(movement, 'axis')) {
        if (typeof movement.axis !== 'string' || !movement.axis.trim()) {
          throw new Error(`Invalid parameter 'axis': ${movement.axis}`);
        }

        if (!this.#axes[movement.axis]) {
          throw new Error(`Unknown axis '${movement.axis}'.`);
        }
      }

      if (typeof movement.to === 'function') {
        if (!has(movement, 'duration')) {
          throw new Error('Must provide a duration when \'to\' is a function.');
        }
      }

      if (has(movement, 'velocity') && typeof movement.velocity !== 'function') {
        throw new Error('\'velocity\' must be a function.');
      } else if (has(movement, 'velocity') && typeof movement.to === 'function') {
        throw new Error('Cannot provide both a value and velocity function.');
      }

      const axis = movement.axis || this.defaultAxis;

      if (seenAxes[axis]) {
        throw new Error(`Duplicate axis movement: ${axis}`);
      }

      seenAxes[axis] = true;
    });

    if (!atLeastOneDuration) {
      throw new Error('At least one movement must have a speed or duration.');
    }
  }

  /**
   * Ensure all required fields are present in the configuration and that all are of valid types.
   *
   * TODO: Move some of this out into a generic validator that takes a validation spec.
   * @param {Object} axisConfig
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
      value: axisConfig.type === 'boolean' ? false : 0.5, // Default value. 0.5 is home position for linear, rotation, and auxiliary.
    };

    if (resultConfig.max === resultConfig.min || resultConfig.min > resultConfig.max) {
      throw new Error(`Invalid configuration parameter(s): max = ${resultConfig.max}, min = ${resultConfig.min}`);
    }

    return resultConfig;
  }

  #getAxesArray () {
    const uniqueAxes = {};

    Object.values(this.#axes).forEach((axis) => {
      uniqueAxes[axis.name] = axis;
    });

    function sortByName (a, b) {
      if (a.name > b.name) {
        return 1;
      }

      return a.name < b.name ? -1 : 0;
    }

    return Object.values(uniqueAxes).sort(sortByName);
  }
}

// Separate default export from the class declaration because of jsdoc shenanigans...
export default Ayva;
