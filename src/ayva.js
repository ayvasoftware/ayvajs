/* eslint-disable no-await-in-loop */
import MoveBuilder from './util/move-builder.js';
import WorkerTimer from './util/worker-timer.js';
import {
  clamp, round, has, fail, createConstantProperty, validNumber
} from './util/util.js';
import OSR_CONFIG from './util/osr-config.js';

class Ayva {
  #devices = [];

  #axes = {};

  #frequency = 50; // Hz

  #movements = new Set();

  #nextMovementId = 1;

  #nextBehaviorId = 1;

  #currentBehaviorId = null;

  #performing = false;

  defaultRamp = Ayva.RAMP_COS;

  #timer;

  static get precision () {
    // Decimals to round to for internal values.
    return 10;
  }

  get performing () {
    return this.#performing;
  }

  get axes () {
    const result = {};

    Object.keys(this.#axes).forEach((key) => {
      // Ensure that the result object is immutable by using getAxis()
      result[key] = this.getAxis(key);
    });

    return result;
  }

  get frequency () {
    return this.#frequency;
  }

  get period () {
    return this.#period;
  }

  get #period () {
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
    createConstantProperty(this, '$', {});

    if (config) {
      this.#configure(config);
    }

    if (typeof Worker === 'undefined') {
      this.#timer = {
        // Default timer is just a basic timeout.
        sleep (milliseconds) {
          return new Promise((resolve) => {
            setTimeout(resolve, milliseconds);
          });
        },
      };
    } else {
      this.#timer = new WorkerTimer();
    }
  }

  /**
   * Setup this Ayva instance with the default configuration (a six axis stroker).
   *
   * @example
   * const ayva = new Ayva().defaultConfiguration();
   *
   * @returns the instance of Ayva
   */
  defaultConfiguration () {
    this.#configure(OSR_CONFIG);
    return this;
  }

  getTimer () {
    return this.#timer;
  }

  /**
   * Perform the specified behavior until it completes or is explicitly stopped.
   * If another behavior is running, it will be stopped.
   *
   * For full details on how to use this method, see the {@tutorial behavior-api} tutorial.
   *
   * @param {AyvaBehavior} behavior - the behavior to perform.
   */
  async do (behavior) {
    this.stop();

    const behaviorId = this.#nextBehaviorId++;
    this.#currentBehaviorId = behaviorId;

    while (this.#performing) {
      await this.sleep();
    }

    this.#performing = true;

    while (this.#currentBehaviorId === behaviorId && !behavior.complete) {
      try {
        await behavior.perform(this);
      } catch (error) {
        console.error(`Error performing behavior: ${error}`); // eslint-disable-line no-console
        break;
      }
    }

    if (this.#currentBehaviorId === behaviorId) {
      this.#currentBehaviorId = null;
    }

    this.#performing = false;
  }

  /**
   * Performs movements along one or more axes. This is a powerful method that can synchronize
   * axis movement while allowing for fine control over position, speed, or move duration.
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
   *   duration: 1,
   * },{
   *   axis: 'roll',
   *   value: ({ x }) => Math.sin(x * Math.PI),
   * });
   *
   * @param  {...Object} movements
   * @return {Promise} a promise that resolves with the boolean value true when all movements have finished, or false if the move is cancelled.
   */
  async move (...movements) {
    if (!this.#devices || !this.#devices.length) {
      throw new Error('No output devices have been added.');
    }

    this.#validateMovements(movements);

    const movementId = this.#nextMovementId++;
    this.#movements.add(movementId);

    while (this.#movements.has(movementId) && this.#movements.values().next().value !== movementId) {
      // Wait until current movements have completed to proceed.
      await this.sleep();
    }

    if (!this.#movements.has(movementId)) {
      // This move must have been cancelled.
      return false;
    }

    return this.#performMovements(movementId, movements).finally(() => {
      this.#movements.delete(movementId);
    });
  }

  /**
   * Creates an MoveBuilder for this instance.
   *
   * @returns the new move builder.
   */
  moveBuilder () {
    return new MoveBuilder(this);
  }

  /**
   * Moves all linear and rotation axes to their neutral positions.
   *
   * @param {Number} [to = 0.5] - optional target position to home to.
   * @param {Number} [speed = 0.5] - optional speed of the movement.
   * @return {Promise} A promise that resolves when the movements are finished.
   */
  async home (to = 0.5, speed = 0.5) {
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
   * Cancels all running or pending movements and clears the current behavior (if any).
   */
  stop () {
    this.#currentBehaviorId = null;
    this.#movements.clear();
  }

  /**
   * Asynchronously sleep for the specified number of seconds.
   *
   * @param {*} seconds
   * @returns {Promise} a Promise that resolves when the number of seconds have passed.
   */
  sleep (seconds) {
    return this.#timer.sleep(seconds * 1000);
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
      resultConfig.value = oldConfig.value;
      resultConfig.lastValue = oldConfig.lastValue;
      delete this.#axes[oldConfig.alias];
      delete this.$[oldConfig.alias];
    }

    this.#axes[axisConfig.name] = resultConfig;
    this.#createAxisMoveBuilder(axisConfig.name);

    if (axisConfig.alias) {
      if (this.#axes[axisConfig.alias]) {
        throw new Error(`Alias already refers to another axis: ${axisConfig.alias}`);
      }

      this.#axes[axisConfig.alias] = resultConfig;
      this.#createAxisMoveBuilder(axisConfig.alias);
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
        createConstantProperty(axis, key, fetchedAxis[key]);
      });

      return axis;
    }

    return undefined;
  }

  /**
   * Update the limits for the specified axis.
   *
   * @param {String} axis
   * @param {Number} from - value between 0 and 1
   * @param {Number} to - value between 0 and 1
   */
  updateLimits (axis, from, to) {
    const isInvalid = (value) => !Number.isFinite(value) || value < 0 || value > 1;

    if (isInvalid(from) || isInvalid(to) || from === to) {
      throw new Error(`Invalid limits: min = ${from}, max = ${to}`);
    }

    if (!this.#axes[axis]) {
      throw new Error(`Invalid axis: ${axis}`);
    }

    this.#axes[axis].min = Math.min(from, to);
    this.#axes[axis].max = Math.max(from, to);
  }

  /**
   * Registers a new output device. Ayva outputs commands to all connected devices.
   * More than one device can be specified.
   *
   * @param {...Object} device - object with a write method.
   */
  addOutputDevice (...devices) {
    for (const device of devices) {
      if (!(device && device.write && device.write instanceof Function)) {
        throw new Error(`Invalid device: ${device}`);
      }
    }

    this.#devices.push(...devices);
  }

  /**
   * Alias for #addOutputDevice()
   *
   * @ignore
   * @param {...Object} device - object with a write method.
   */
  addOutputDevices (...devices) {
    this.addOutputDevice(...devices);
  }

  /**
   * Add the start of a move builder chain to $ for the specified axis.
   * Also add shortcut properties for value, min, and max to each axis.
   */
  #createAxisMoveBuilder (axis) {
    Object.defineProperty(this.$, axis, {
      value: (...args) => this.moveBuilder()[axis](...args),
      writeable: false,
      configurable: true,
      enumerable: true,
    });

    Object.defineProperty(this.$[axis], 'value', {
      get: () => this.#axes[axis].value,
      set: (target) => {
        // TODO: Thou shalt not repeat thyself?
        const { type } = this.#axes[axis];

        if (type !== 'boolean' && !validNumber(target, 0, 1)) {
          throw new Error(`Invalid value: ${target}`);
        }

        const value = type === 'boolean' ? !!target : target;
        const tcode = this.#tcode(axis, value);
        this.#write(`${tcode}\n`);
        this.#axes[axis].lastValue = this.#axes[axis].value;
        this.#axes[axis].value = value;
      },
    });

    Object.defineProperty(this.$[axis], 'lastValue', {
      get: () => this.#axes[axis].lastValue,
    });

    Object.defineProperty(this.$[axis], 'min', {
      get: () => this.#axes[axis].min,
    });

    Object.defineProperty(this.$[axis], 'max', {
      get: () => this.#axes[axis].max,
    });
  }

  /**
   * Setup the configuration.
   */
  #configure (config) {
    this.name = config.name;
    this.defaultAxis = config.defaultAxis;
    this.#frequency = (config.frequency || this.#frequency);

    if (config.axes) {
      config.axes.forEach((axis) => {
        this.configureAxis(axis);
      });
    }
  }

  /**
   * Writes the specified command out to all connected devices.
   */
  #write (command) {
    for (const device of this.#devices) {
      device.write(command);
    }
  }

  async #performMovements (movementId, movements) {
    const allProviders = this.#createValueProviders(movements);
    const stepCount = this.#computeStepCount(allProviders);
    const immediateProviders = allProviders.filter((provider) => !provider.parameters.stepCount);
    const stepProviders = allProviders.filter((provider) => !!provider.parameters.stepCount);

    this.#executeProviders(immediateProviders, 0);

    if (stepCount) {
      for (let index = 0; index < stepCount; index++) {
        const unfinishedProviders = stepProviders.filter((provider) => index < provider.parameters.stepCount);
        this.#executeProviders(unfinishedProviders, index);

        await this.sleep(this.#period);

        if (!this.#movements.has(movementId)) {
          // This move was cancelled.
          return false;
        }
      }
    } else {
      // Always sleep at least a tick even when all providers are immediate.
      await this.sleep(this.#period);
    }

    return true;
  }

  #executeProviders (providers, index) {
    const axisValues = providers
      .map((provider) => this.#executeProvider(provider, index))
      .filter(({ value }) => this.#isValidAxisValue(value));

    const tcodes = axisValues.map(({ axis, value }) => this.#tcode(axis, value));

    if (tcodes.length) {
      this.#write(`${tcodes.join(' ')}\n`);

      axisValues.forEach(({ axis, value }) => {
        this.#axes[axis].lastValue = this.#axes[axis].value;
        this.#axes[axis].value = value;
      });
    }
  }

  #executeProvider (provider, index) {
    const time = index * this.#period;
    const { parameters, valueProvider } = provider;
    const { stepCount } = parameters;

    const nextValue = valueProvider({
      ...parameters,
      time,
      index,
      period: this.#period,
      frequency: this.#frequency,
      currentValue: this.#axes[parameters.axis].value,
      x: stepCount === 0 ? 1 : (index + 1) / stepCount,
    });

    const notNullOrUndefined = nextValue !== null && nextValue !== undefined; // Allow null or undefined to indicate no movement.

    if (!this.#isValidAxisValue(nextValue) && notNullOrUndefined) {
      console.warn(`Invalid value provided: ${nextValue}`); // eslint-disable-line no-console
    }

    return {
      axis: parameters.axis,
      value: Number.isFinite(nextValue) ? clamp(round(nextValue, Ayva.precision), 0, 1) : nextValue,
    };
  }

  #isValidAxisValue (value) {
    return Number.isFinite(value) || typeof value === 'boolean';
  }

  /**
   * Converts the value into a standard live command TCode string for the specified axis. (i.e. 0.5 -> L0500)
   * If the axis is a boolean axis, true values get mapped to 999 and false gets mapped to 000.
   *
   * @param {String} axis
   * @param {Number} value
   * @returns {String} the TCode string
   */
  #tcode (axis, value) {
    let valueText;

    if (typeof value === 'boolean') {
      valueText = value ? '9999' : '0000';
    } else {
      const { min, max } = this.#axes[axis];
      const normalizedValue = round(value * 0.9999, 4); // Convert values from range (0, 1) to (0, 0.9999)
      const scaledValue = (max - min) * normalizedValue + min;

      valueText = `${clamp(round(scaledValue * 10000), 0, 9999)}`.padStart(4, '0');
    }

    return `${this.#axes[axis].name}${valueText}`;
  }

  /**
   * Create value providers with initial parameters.
   *
   * Precondition: Each movement is a valid movement per the Motion API.
   * @param {Object[]} movements
   * @returns {Object[]} - array of value providers with parameters.
   */
  #createValueProviders (movements) {
    let maxDuration = 0;

    const computedMovements = movements.map((movement) => {
      // Initialize all parameters that we can deduce.
      const axis = movement.axis || this.defaultAxis;

      const result = {
        ...movement,
        axis,
        from: this.#axes[axis].value,
        period: this.#period,
      };

      if (has(movement, 'to')) {
        const distance = movement.to - result.from;
        const absoluteDistance = Math.abs(distance);

        if (has(movement, 'duration')) {
          // { to: <number>, duration: <number> }
          result.speed = round(absoluteDistance / movement.duration, Ayva.precision);
        } else if (has(movement, 'speed')) {
          // { to: <number>, speed: <number> }
          // Uncomment the below to re-enable speed scaling.
          // const axisScale = 1 / Math.abs(this.#axes[axis].max - this.#axes[axis].min);
          // result.speed = movement.speed * axisScale;
          result.duration = round(absoluteDistance / result.speed, Ayva.precision);
        }

        result.direction = distance > 0 ? 1 : distance < 0 ? -1 : 0; // eslint-disable-line no-nested-ternary
      }

      if (has(result, 'duration')) {
        maxDuration = Math.max(result.duration, maxDuration);
      }

      return result;
    });

    const movementsByAxis = computedMovements.reduce((map, p) => {
      map[p.axis] = p;

      if (this.#axes[p.axis].alias) {
        map[this.#axes[p.axis].alias] = p;
      }

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

        if (has(movement, 'to')) {
          // Now we can compute a speed.
          movement.speed = round(Math.abs(movement.to - movement.from) / movement.duration, Ayva.precision);
        }
      } else if (!has(movement, 'duration') && this.#axes[movement.axis].type !== 'boolean') {
        // Implicit sync to max duration.
        movement.duration = maxDuration;
      }

      if (has(movement, 'duration')) {
        movement.stepCount = Math.ceil(movement.duration * this.#frequency);
      } // else if (this.#axes[movement.axis].type !== 'boolean') {
      // By this point, the only movements without a duration should be boolean.
      // This should literally never happen because of validation. But including here for debugging and clarity.
      // fail(`Unable to compute duration for movement along axis: ${movement.axis}`);
      // }
    });

    // Create the actual value providers.
    return computedMovements.map((movement) => {
      const provider = {};

      if (!has(movement, 'value')) {
        // Create a value provider from parameters.
        if (this.#axes[movement.axis].type === 'boolean') {
          provider.valueProvider = () => movement.to;
        } else if (movement.to !== movement.from) {
          provider.valueProvider = this.defaultRamp;
        } else {
          // No movement.
          provider.valueProvider = () => {};
        }
      } else {
        // User provided value provider.
        provider.valueProvider = movement.value;
      }

      delete movement.sync;
      delete movement.value;
      provider.parameters = movement;

      return provider;
    });
  }

  /**
   * Compute the total steps of the move given a list of value providers.
   * i.e. The maximum number of steps.
   *
   * @param {Object[]} valueProviders
   */
  #computeStepCount (valueProviders) {
    let maxStepCount = 0;

    valueProviders.forEach((provider) => {
      const steps = provider.parameters.stepCount;

      if (steps) {
        maxStepCount = Math.max(steps, maxStepCount);
      }
    });

    return maxStepCount;
  }

  /**
   * All the validation on movement descriptors :O
   *
   * @param {Array} movements
   */
  #validateMovements (movements) {
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
      const hasTo = has(movement, 'to');
      const hasSpeed = has(movement, 'speed');
      const hasDuration = has(movement, 'duration');
      const hasValue = has(movement, 'value');
      const axis = movement.axis || this.defaultAxis;

      if (!axis) {
        fail('No default axis configured. Must specify an axis for each movement.');
      }

      if (has(movement, 'axis')) {
        if (typeof movement.axis !== 'string' || !movement.axis.trim() || !this.#axes[movement.axis]) {
          invalidValue('axis');
        }
      }

      if (hasTo) {
        let invalidTo = false;

        if (this.#axes[axis].type === 'boolean') {
          invalidTo = typeof movement.to !== 'boolean';
        } else {
          invalidTo = !Number.isFinite(movement.to) || (movement.to < 0 || movement.to > 1);
        }

        if (invalidTo) {
          invalidValue('to');
        }
      } else if (!hasValue) {
        fail('Must provide a \'to\' property or \'value\' function.');
      }

      if (hasSpeed && hasDuration) {
        fail('Cannot supply both speed and duration.');
      }

      if (hasSpeed || hasDuration) {
        atLeastOneDuration = true;

        if (hasSpeed && (!Number.isFinite(movement.speed) || movement.speed <= 0)) {
          invalidValue('speed');
        } else if (hasDuration && (!Number.isFinite(movement.duration) || movement.duration <= 0)) {
          invalidValue('duration');
        }
      }

      if (hasSpeed && !hasTo) {
        fail('Must provide a target position when specifying speed.');
      }

      if (hasValue && typeof movement.value !== 'function') {
        fail('\'value\' must be a function.');
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
        if (has(movement, 'speed')) {
          fail(`Cannot specify speed for boolean axes: ${axis}`);
        }

        if (has(movement, 'duration') && hasTo && !hasValue) {
          // { to: <boolean>, duration: <number> } is invalid (for now).
          fail('Cannot specify a duration for a boolean axis movement with constant value.');
        }
      }

      if (movementMap[axis]) {
        fail(`Duplicate axis movement: ${axis}`);
      }

      movementMap[axis] = movement;

      if (this.#axes[axis].alias) {
        movementMap[this.#axes[axis].alias] = movement;
      }
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
   * @param {Object} axisConfig
   */
  #validateAxisConfig (axisConfig) {
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
          if (!Number.isFinite(value) || value < 0 || value > 1) {
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

    const defaultValue = axisConfig.type === 'boolean' ? false : 0.5; // 0.5 is home position for linear, rotation, and auxiliary.

    const resultConfig = {
      ...axisConfig,
      max: axisConfig.max || 1,
      min: axisConfig.min || 0,
      value: defaultValue,
      lastValue: defaultValue,
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

  /**
   * Value provider that generates motion towards a target position with constant velocity.
   */
  static RAMP_LINEAR ({ to, from, x }) {
    return from + ((to - from) * x);
  }

  /**
   * Value provider that generates motion towards a target position that resembles part of a cos wave (0 - 180 degrees).
   */
  static RAMP_COS ({ to, from, x }) {
    const value = (-Math.cos(Math.PI * x) / 2) + 0.5;

    return from + ((to - from) * value);
  }

  /**
   * Value provider that generates motion towards a target position in the shape of the latter half of a parabola.
   */
  static RAMP_PARABOLIC ({ to, from, x }) {
    return ((to - from) * x * x) + from;
  }

  /**
   * Value provider that generates motion towards a target position in the shape of the first half of an upside down parabola.
   */
  static RAMP_NEGATIVE_PARABOLIC ({ to, from, x }) {
    const value = -((x - 1) ** 2) + 1;

    return ((to - from) * value) + from;
  }

  /**
   * Creates a value provider that generates oscillatory motion. The formula is:
   *
   * cos(x + phase·π/2 + ecc·sin(x))
   *
   * The result is translated and scaled to fit the range and beats per minute specified.
   * This formula was created by [TempestMAx]{@link https://www.patreon.com/tempestvr}—loosely based
   * on orbital motion calculations. Hence, tempestMotion.
   *
   * See [this graph]{@link https://www.desmos.com/calculator/mba8qzrqxd} of the function
   * where you can adjust the parameters to see how they affect the motion.
   *
   * @example
   * // Note: These examples use the Builder Pattern of the Motion API.
   *
   * // Simple up/down stroke for 10 seconds.
   * ayva.$.stroke(Ayva.tempestMotion(1, 0), 10).execute();
   *
   * // ... out of phase with a little eccentricity.
   * ayva.$.stroke(Ayva.tempestMotion(1, 0, 1, 2), 10).execute();
   *
   * // ... at 30 BPM.
   * ayva.$.stroke(Ayva.tempestMotion(1, 0, 1, 2, 30), 10).execute();
   *
   * @param {Number} from - the start of the range of motion
   * @param {Number} to - the end of the range of motion
   * @param {Number} [phase] - the phase of the wave in multiples of π/2
   * @param {Number} [ecc] - the eccentricity of the wave.
   * @param {Number} [bpm] - beats per minute
   * @param {Number} [shift] - the phase shift of the wave in radians (slide wave horizontally left or right)
   * @returns the value provider.
   */
  static tempestMotion (from, to, phase = 0, ecc = 0, bpm = 60, shift = 0) {
    this.#validateTempestParameters(from, to, phase, ecc, bpm, shift);

    const angularVelocity = (2 * Math.PI * bpm) / 60;
    const scale = 0.5 * (to - from);
    const midpoint = 0.5 * (to + from);

    const provider = ({ index, frequency }) => {
      const angle = ((index * angularVelocity) / frequency) + shift;
      return midpoint - scale * Math.cos(angle + (0.5 * Math.PI * phase) + (ecc * Math.sin(angle)));
    };

    createConstantProperty(provider, 'from', from);
    createConstantProperty(provider, 'to', to);
    createConstantProperty(provider, 'phase', phase);
    createConstantProperty(provider, 'ecc', ecc);
    createConstantProperty(provider, 'bpm', bpm);

    return provider;
  }

  static #validateTempestParameters (from, to, phase, ecc, bpm, shift) {
    const valid = validNumber(from, 0, 1)
      && validNumber(to, 0, 1)
      && validNumber(phase)
      && validNumber(ecc)
      && validNumber(bpm) && bpm > 0
      && validNumber(shift);

    if (!valid) {
      throw new Error(`One or more stroke parameters are invalid (${from}, ${to}, ${phase}, ${ecc}, ${bpm}, ${shift})`);
    }
  }

  /**
   * Creates a value provider that is a blend of the two value providers passed.
   * The factor is the multiplier for the values generated by the second provider.
   * The first provider's values will be multiplied by 1 - factor.
   *
   * @param {Function} firstProvider
   * @param {Function} secondProvider
   * @param {Number} factor - value between 0 and 1
   */
  static blendMotion (firstProvider, secondProvider, factor) {
    return (...args) => round((1 - factor) * firstProvider(...args) + factor * secondProvider(...args), Ayva.precision);
  }

  /**
   * Return a copy of the default configuration.
   */
  static get defaultConfiguration () {
    return {
      ...OSR_CONFIG,
    };
  }
}

// Separate default export from the class declaration because of jsdoc shenanigans...
export default Ayva;
