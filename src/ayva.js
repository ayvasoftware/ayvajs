import util from './util.js';

class Ayva {
  #devices = [];

  #axes = {};

  #frequency = 50; // Hz

  get #stepSeconds () {
    return 1 / this.#frequency;
  }

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
  home (to = 0.5) {
    if (typeof to !== 'number') {
      throw new Error(`Invalid value: ${to}`);
    }

    const speed = 0.5;

    const movements = this.#getAxesArray()
      .filter((axis) => axis.type === 'linear' || axis.type === 'rotation')
      .map((axis) => ({ to, speed, axis: axis.name }));

    if (movements.length) {
      return this.move(...movements);
    }

    console.warn('No linear or rotation axes configured.'); // eslint-disable-line no-console
    return Promise.resolve();
  }

  /**
   * Performs movements or updates along one or more axes. This is a powerful method that can synchronize
   * axis movement while allowing for fine control over position, speed, and move duration.
   * For full details on how to use this method, see the {@tutorial motion-api} tutorial.
   *
   * @example
   * ayva.move({
   *   axis: 'stroke',
   *   to: 0,
   *   speed: 1,
   * },{
   *   axis: 'twist',
   *   to: 0.5,
   *   speed: 0.5,
   * });
   *
   * @param  {Object} movements
   * @return {Promise} a promise that resolves when all movements have finished
   */
  async move (...movements) {
    this.#validateMovements(movements);
    const suppliers = this.#createValueSuppliers(movements);
    const totalSteps = this.#computeTotalSteps(suppliers);

    // TODO: Perform immediate moves (duration = 0 or undefined)
    for (let stepIndex = 0; stepIndex < totalSteps; stepIndex++) {
      // TODO: Think about what time should be if I am planning ahead... ?
      const time = stepIndex * this.#stepSeconds;

      const axisValues = suppliers
        .filter((supplier) => stepIndex < supplier.parameters.totalSteps)
        .map((supplier) => {
          const { parameters, valueSupplier } = supplier;

          const nextValue = valueSupplier({
            ...parameters,
            time,
            stepIndex,
            stepSeconds: this.#stepSeconds,
            value: this.#axes[parameters.axis].value,
            progress: util.round(time / parameters.duration, 3),
          });

          // TODO: Perform a little validation on the value here.
          // Instead of silently ignoring invalid values.

          return {
            axis: parameters.axis,
            value: nextValue,
          };
        }).filter(({ value }) => typeof value === 'number' || typeof value === 'boolean');

      const tcodes = axisValues.map(({ axis, value }) => this.#tcode(axis, value));

      if (tcodes.length) {
        this.write(`${tcodes.join(' ')}\n`);
        axisValues.forEach(({ axis, value }) => {
          this.#axes[axis].value = typeof value === 'number' ? util.round(value, 3) : value;
        });
      }

      await this.sleep(this.#stepSeconds); // eslint-disable-line no-await-in-loop
    }
  }

  /**
   * Asynchronously sleep for the specified number of seconds.
   * @param {*} seconds
   * @returns
   */
  async sleep (seconds) {
    return new Promise((resolve) => {
      setTimeout(resolve, seconds * 1000);
    });
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
   * Converts the value into a standard TCode string for the specified axis. (i.e. 0.5 -> L0500)
   * If the axis is a boolean axis, true values get mapped to 999 and false gets mapped to 000.
   *
   * @param {*} axis
   * @param {*} value
   * @returns
   */
  #tcode (axis, value) {
    let valueText;

    if (typeof value === 'boolean') {
      valueText = value ? '999' : '000';
    } else {
      // TODO: Scale to within limit range here.
      valueText = `${Math.round(util.clamp(value * 1000, 0, 999))}`.padStart(3, '0');
    }

    return `${this.#axes[axis].name}${valueText}`;
  }

  /**
   * Create value suppliers with initial parameters.
   *
   * Precondition: Each movement is a valid movement per the Motion API.
   * @param {*} movements
   * @returns
   */
  #createValueSuppliers (movements) {
    const { fail, has } = util;
    let maxDuration = 0;

    const computedMovements = movements.map((movement) => {
      // Initialize all parameters that we can deduce.
      const axis = movement.axis || this.defaultAxis;

      const result = {
        ...movement,
        axis,
        from: this.#axes[axis].value,
        stepSeconds: this.#stepSeconds,
      };

      if (has(movement, 'duration') && typeof movement.to !== 'function') {
        // { to: <number>, duration: <number> }
        // So we can compute the speed from distance / time.
        result.speed = Math.abs(movement.to - result.from) / movement.duration;
      } else if (has(movement, 'speed')) {
        // { to: <function> , speed: <any> } and { to: <boolean>, speed: <any> } are invalid.
        // So we know 'to' must be numerical here and we can therefore compute the duration from distance / speed.
        result.duration = Math.abs(movement.to - result.from) / movement.speed;
      }

      if (has(movement, 'velocity')) {
        // { to: <function>, velocity: <function> } and { to: <boolean>, velocity: <function> } are invalid.
        // So we know 'to' must be numerical here and we can compute a direction for the velocity.
        const distance = movement.to - result.from;
        result.direction = distance > 0 ? 1 : distance < 0 ? -1 : 0; // eslint-disable-line no-nested-ternary
      }

      if (has(result, 'duration')) {
        maxDuration = result.duration > maxDuration ? result.duration : maxDuration;
      }

      return result;
    });

    const movementsByAxis = computedMovements.reduce((map, p) => {
      map[p.axis] = p;
      return map;
    }, {});

    computedMovements.forEach((movement) => {
      // We need to compute the duration for any movements we couldn't in the first pass.
      // This will be either implicit or explicit sync movements.
      if (has(movement, 'sync')) {
        // Excplicit sync.
        let syncMovement = movement;

        while (has(syncMovement, 'sync')) {
          syncMovement = movementsByAxis[syncMovement.sync];
        }

        movement.duration = syncMovement.duration || maxDuration;

        if (typeof movement.to !== 'function') {
          // Now we can compute a speed.
          movement.speed = (movement.to - movement.from) / movement.duration;
        }
      } else if (!has(movement, 'duration') && this.#axes[movement.axis].type !== 'boolean') {
        // Implicit sync to max duration.
        movement.duration = maxDuration;
      }

      if (has(movement, 'duration')) {
        movement.totalSteps = Math.round(movement.duration * this.#frequency);
      } else if (this.#axes[movement.axis].type !== 'boolean') {
        // By this point, the only movements without a duration should be boolean.
        // This should literally never happen because of validation. But including here for debugging and clarity.
        fail(`Unable to compute duration for movement along axis: ${movement.axis}`);
      }
    });

    // Create the actual value suppliers.
    return computedMovements.map((movement) => {
      const supplier = {};

      if (typeof movement.to !== 'function') {
        // Create a value supplier from parameters.
        if (this.#axes[movement.axis].type === 'boolean') {
          supplier.valueSupplier = () => movement.to;
        } else if (has(movement, 'velocity')) {
          const deltaFunction = movement.velocity;
          supplier.valueSupplier = (params) => params.value + deltaFunction(params);
        } else {
          const delta = (movement.to - movement.from) / movement.totalSteps;
          supplier.valueSupplier = (params) => params.value + delta;
        }
      } else {
        // User provided value supplier.
        supplier.valueSupplier = movement.to;
        delete movement.to;
      }

      delete movement.sync;
      supplier.parameters = movement;

      return supplier;
    });
  }

  /**
   * Compute the total steps of the move given a list of value suppliers.
   * i.e. The maximum number of steps.
   *
   * @param {Object[]} valueSuppliers
   */
  #computeTotalSteps (valueSuppliers) {
    let maxTotalSteps = 0;

    valueSuppliers.forEach((supplier) => {
      const steps = supplier.parameters.totalSteps;

      if (steps) {
        maxTotalSteps = steps > maxTotalSteps ? steps : maxTotalSteps;
      }
    });

    return maxTotalSteps;
  }

  /**
   * All the validation on movement descriptors :O
   *
   * TODO: Clean this up and maybe move some of this out into a generic, parameterizable validator.
   *
   * @param {*} movements
   */
  #validateMovements (movements) {
    const { has, fail } = util;
    const movementMap = {};
    let atLeastOneDuration = false;
    let atLeastOneNonBoolean = false;

    if (!movements || !movements.length) {
      fail('Must supply at least one movement.');
    }

    movements.forEach((movement) => {
      if (!movement || typeof movement !== 'object') {
        fail(`Invalid movement: ${movement}`);
      }

      const invalidValue = (name) => fail(`Invalid value for parameter '${name}': ${movement[name]}`);
      const hasSpeed = has(movement, 'speed');
      const hasDuration = has(movement, 'duration');
      const hasVelocity = has(movement, 'velocity');
      const axis = movement.axis || this.defaultAxis;

      if (!axis) {
        fail('No default axis configured. Must specify an axis for each movement.');
      }

      if (has(movement, 'axis')) {
        if (typeof movement.axis !== 'string' || !movement.axis.trim() || !this.#axes[movement.axis]) {
          invalidValue('axis');
        }
      }

      if (typeof movement.to !== 'function') {
        let invalidTo = false;

        if (this.#axes[axis].type === 'boolean') {
          invalidTo = typeof movement.to !== 'boolean';
        } else {
          invalidTo = typeof movement.to !== 'number' || (movement.to < 0 || movement.to > 1);
        }

        if (invalidTo) {
          invalidValue('to');
        }
      }

      if (hasSpeed && hasDuration) {
        fail('Cannot supply both speed and duration.');
      }

      if (hasSpeed || hasDuration) {
        atLeastOneDuration = true;

        if (hasSpeed && (typeof movement.speed !== 'number' || movement.speed <= 0)) {
          invalidValue('speed');
        } else if (hasDuration && (typeof movement.duration !== 'number' || movement.duration <= 0)) {
          invalidValue('duration');
        }
      }

      if (typeof movement.to === 'function') {
        if (hasSpeed && !hasDuration) {
          fail('Must provide a duration when \'to\' is a function.');
        }
      }

      if (hasVelocity && typeof movement.velocity !== 'function') {
        fail('\'velocity\' must be a function.');
      } else if (hasVelocity && typeof movement.to === 'function') {
        fail('Cannot provide both a value and velocity function.');
      }

      if (has(movement, 'sync')) {
        if (typeof movement.sync !== 'string' || !movement.sync.trim()) {
          invalidValue('sync');
        }

        if (has(movement, 'speed') || has(movement, 'duration')) {
          fail(`Cannot specify a speed or duration when sync property is present: ${movement.axis}`);
        }
      }

      if (this.#axes[axis].type !== 'boolean') {
        atLeastOneNonBoolean = true;
      } else {
        if (has(movement, 'speed') || has(movement, 'velocity')) {
          fail(`Cannot specify speed or velocity for boolean axes: ${axis}`);
        }

        if (has(movement, 'duration') && typeof movement.to !== 'function') {
          fail('Cannot specify a duration for a boolean axis movement with constant value.');
        }
      }

      if (movementMap[axis]) {
        fail(`Duplicate axis movement: ${axis}`);
      }

      movementMap[axis] = movement;
    });

    movements.forEach((movement) => {
      let syncMovement = movement;
      const originalMovementAxis = movement.axis;

      while (has(syncMovement, 'sync')) {
        if (!movementMap[syncMovement.sync]) {
          fail(`Cannot sync with axis not specified in movement: ${syncMovement.axis} -> ${syncMovement.sync}`);
        }

        syncMovement = movementMap[syncMovement.sync];

        if (syncMovement.sync === originalMovementAxis) {
          fail('Sync axes cannot form a cycle.');
        }
      }
    });

    if (!atLeastOneDuration && atLeastOneNonBoolean) {
      fail('At least one movement must have a speed or duration.');
    }
  }

  /**
   * Ensure all required fields are present in the configuration and that all are of valid types.
   *
   * TODO: Move some of this out into a generic validator that takes a validation spec.
   * @param {Object} axisConfig
   */
  #validateAxisConfig (axisConfig) {
    const { fail } = util;
    if (!axisConfig || typeof axisConfig !== 'object') {
      fail(`Invalid configuration object: ${axisConfig}`);
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
      fail(`Configuration is missing properties: ${missing.join(', ')}`);
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
      fail(`Invalid configuration parameter(s): ${message}`);
    }

    if (['linear', 'rotation', 'auxiliary', 'boolean'].indexOf(axisConfig.type) === -1) {
      fail(`Invalid type. Must be linear, rotation, auxiliary, or boolean: ${axisConfig.type}`);
    }

    const resultConfig = {
      ...axisConfig,
      max: axisConfig.max || 1,
      min: axisConfig.min || 0,
      value: axisConfig.type === 'boolean' ? false : 0.5, // Default value. 0.5 is home position for linear, rotation, and auxiliary.
    };

    if (resultConfig.max === resultConfig.min || resultConfig.min > resultConfig.max) {
      fail(`Invalid configuration parameter(s): max = ${resultConfig.max}, min = ${resultConfig.min}`);
    }

    return resultConfig;
  }

  #getAxesArray () {
    const uniqueAxes = {};

    Object.values(this.#axes).forEach((axis) => {
      uniqueAxes[axis.name] = axis;
    });

    function sortByName (a, b) {
      return a.name > b.name ? 1 : -1;
    }

    return Object.values(uniqueAxes).sort(sortByName);
  }
}

// Separate default export from the class declaration because of jsdoc shenanigans...
export default Ayva;
