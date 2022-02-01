/* eslint-disable max-classes-per-file */
import Ayva from '../ayva.js';
import AyvaBehavior from './ayva-behavior.js';
import { has, validNumber } from '../util.js';
import StrokeParameterProvider from './stroke-parameter-provider.js';

/**
 * So named for its timelessness. The OG stroke. Simple up and down movement with some (optional) variation on a few parameters
 * such as speed, positions, shape, and twist.
 */
class ClassicStroke extends AyvaBehavior {
  #top;

  #bottom;

  #speed;

  #config;

  get speed () {
    return this.#speed;
  }

  get top () {
    return this.#top;
  }

  get bottom () {
    return this.#bottom;
  }

  static get DEFAULT_CONFIG () {
    return {
      top: 1,
      bottom: 0,
      speed: 1,
      shape: Ayva.RAMP_COS,
      suck: null,
      twist: null,
    };
  }

  /**
   * Create a new ClassicStroke.
   *
   * @example
   * // Bounce stroke.
   * ayva.do(new ClassicStroke(0, 1, 1, [ Ayva.RAMP_NEGATIVE_PARABOLIC, Ayva.RAMP_PARABOLIC ]));
   *
   * @param {Number} bottom - bottom of the stroke or a function that computes the bottom for each down stroke
   * @param {Number} top - top of the stroke or a function that computes the top for each up stroke
   * @param {Number} speed - speed of the stroke or a function that computes the speed for each stroke
   * @param {Function|Array} shape - a value provider for the shape or an even-lengthed array of value providers
   *//**
   * Create a new ClassicStroke.
   *
   * @example
   * ayva.do(new ClassicStroke({
   *   bottom: 0,
   *   top: 1,
   *   speed: 1,
   * }));
   *
   * @param {Object} config - stroke configuration
   */
  constructor (bottom = 0, top = 1, speed = 1, shape = Ayva.RAMP_COS) {
    super();

    let config;
    if (typeof bottom === 'object' && !(bottom instanceof Array)) {
      config = bottom;
    } else {
      config = {
        top,
        bottom,
        speed,
        shape,
      };
    }

    this.#init(config);
  }

  /**
   * A classic stroke consists of a single function action that computes and inserts a move to either the top or the bottom of the stroke based on
   * where the device is currently located, and what the most recent movement along the stroke axis was. Any variation on parameters is also computed
   * and applied.
   *
   * @param {Ayva} ayva
   */
  generateActions (ayva) {
    this.queueFunction((behavior) => {
      const { value, lastValue } = ayva.$.stroke;
      const { target, shape, direction } = this.#getTargetShape(value, lastValue);
      const speed = this.#speed * (shape.relativeSpeed || 1);

      const moves = [{
        speed,
        to: target,
        value: typeof shape === 'object' ? shape.value : shape,
      }];

      if (this.#config.twist) {
        moves.push(this.#computeTwistMove({
          direction, value, target, speed, ayva,
        }));
      }

      behavior.insertMove(...moves);

      this.#speed = this.#config.speed.next();

      if (validNumber(this.#config.suck, 0, 1)) {
        ayva.$.suck.value = this.#config.suck;
      }
    });
  }

  #init (config) {
    const strokeConfig = {
      ...ClassicStroke.DEFAULT_CONFIG,
      ...config,
    };

    this.#validate(strokeConfig);

    strokeConfig.top = StrokeParameterProvider.createFrom(strokeConfig.top);
    strokeConfig.bottom = StrokeParameterProvider.createFrom(strokeConfig.bottom);
    strokeConfig.speed = StrokeParameterProvider.createFrom(strokeConfig.speed);

    const { shape } = strokeConfig;

    if (shape instanceof Array) {
      strokeConfig.shape = new StrokeParameterProvider((index) => shape[index % shape.length]);
    } else {
      strokeConfig.shape = new StrokeParameterProvider(() => shape);
    }

    this.#config = strokeConfig;

    // Compute initial stroke values.
    this.#top = this.#config.top.next();
    this.#bottom = this.#config.bottom.next();
    this.#speed = this.#config.speed.next();
  }

  #computeTwistMove ({ direction, value, target, speed, ayva }) { // eslint-disable-line object-curly-newline
    const { frequency } = ayva;
    const phase = (direction === 'up' ? 0 : 2) + (this.#config.twist.phase || 0);
    const distance = Math.abs(value - target);
    const bpm = (speed * 60) / (2 * distance);
    const twistMotion = Ayva.tempestMotion(this.#config.twist.from, this.#config.twist.to, phase, 0, bpm);
    const expectedTwistValue = twistMotion({ index: 0, frequency });

    if (Math.abs(expectedTwistValue - ayva.$.twist.value) > 0.05) {
      // I'm starting off axis. Just do a smooth twist to the next position rather than jerking back.
      const nextTwistMotion = Ayva.tempestMotion(this.#config.twist.from, this.#config.twist.to, phase + 2, 0, bpm);
      const targetTwistValue = nextTwistMotion({ index: 0, frequency });

      return {
        axis: 'twist',
        to: targetTwistValue,
        value: Ayva.RAMP_COS,
      };
    }

    return {
      axis: 'twist',
      value: twistMotion,
    };
  }

  /**
   * Decide where to stroke next based on the current position.
   * Applies some common sense so there are smoother transitions between patterns.
   */
  #getTargetShape (currentValue, lastValue) {
    const lastStrokeWasUp = (currentValue - lastValue) >= 0;
    const nextShapeDirection = this.#config.shape.index % 2 === 0 ? 'up' : 'down';

    let target;
    let direction;

    if (currentValue <= this.#bottom || (currentValue < this.#top && !lastStrokeWasUp)) {
      direction = 'up';
      target = this.#top;
      this.#top = this.#config.top.next();

      if (nextShapeDirection === 'down') {
        this.#config.shape.next(); // Skip to the next up shape.
      }
    } else {
      direction = 'down';
      target = this.#bottom;
      this.#bottom = this.#config.bottom.next();

      if (nextShapeDirection === 'up') {
        this.#config.shape.next(); // Skip to the next down shape.
      }
    }

    return { target, shape: this.#config.shape.next(), direction };
  }

  #validate (config) {
    const fail = (parameter, value) => {
      throw new Error(`Invalid stroke ${parameter}: ${value}`);
    };

    if (!validNumber(config.bottom, 0, 1) && typeof config.bottom !== 'function' && !(config.bottom instanceof Array)) {
      fail('bottom', config.bottom);
    }

    if (!validNumber(config.top, 0, 1) && typeof config.top !== 'function' && !(config.top instanceof Array)) {
      fail('top', config.top);
    }

    if (config.bottom === config.top) {
      throw new Error(`Invalid stroke range specified: (${config.bottom}, ${config.top})`);
    }

    if ((!validNumber(config.speed) || config.speed <= 0) && typeof config.speed !== 'function' && !(config.speed instanceof Array)) {
      fail('speed', config.speed);
    }

    if (typeof config.shape !== 'function' && !(config.shape instanceof Array)) {
      fail('shape', config.shape);
    }

    if (typeof config.twist !== 'object') {
      fail('twist', config.twist);
    }

    if (config.twist) {
      if (!validNumber(config.twist.from, 0, 1)) {
        fail('twist from', config.twist.from);
      }

      if (!validNumber(config.twist.to, 0, 1)) {
        fail('twist to', config.twist.to);
      }

      if (has(config.twist, 'phase') && !validNumber(config.twist.phase)) {
        fail('twist phase', config.twist.phase);
      }
    }

    if (config.shape instanceof Array) {
      if (!config.shape.length) {
        throw new Error('Missing stroke shape.');
      }

      if (config.shape.length % 2 !== 0) {
        throw new Error('Must specify an even number of stroke shapes.');
      }

      config.shape.forEach((shape) => {
        if (typeof shape !== 'function' && typeof shape !== 'object') {
          fail('shape', shape);
        }

        if (typeof shape === 'object') {
          if (typeof shape.value !== 'function') {
            fail('shape', shape);
          }

          if (has(shape, 'relativeSpeed')) {
            if (!validNumber(shape.relativeSpeed) || shape.relativeSpeed <= 0) {
              throw new Error(`Invalid relative speed specified in stroke shape: ${shape.relativeSpeed}`);
            }
          }
        }
      });
    }

    if (has(config, 'suck') && !validNumber(config.suck, 0, 1) && config.suck !== null) {
      fail('suck', config.suck);
    }
  }
}

export default ClassicStroke;
