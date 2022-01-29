/* eslint-disable max-classes-per-file */
import Ayva from '../ayva.js';
import AyvaBehavior from './ayva-behavior.js';
import { has, validNumber } from '../util.js';

export class StrokeParameterProvider {
  #index = 0;

  #value;

  constructor (valueFunction) {
    this.#value = valueFunction;
  }

  next () {
    return this.#value(this.#index++);
  }

  get index () {
    return this.#index;
  }
}

/**
 * So named for its timelessness. The OG stroke. Simple up and down movement with some (optional) variation on a few parameters
 * such as speed, positions, and twist. No frills. Just stroke.
 *
 * TODO: Fix extremely small strokes error (Ex: 0.3, 0.31)
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
      // valve: {
      //   up: 0,
      //   down: 1,
      // },
      // twist: null,
    };
  }

  constructor (bottom = 0, top = 1, speed = 1, shape = Ayva.RAMP_COS) {
    super();

    this.#init({
      top,
      bottom,
      speed,
      shape,
    });
  }

  /**
   * A classic stroke consists of a single function action that computes and inserts a move to either the top or the bottom of the stroke, based on
   * where the device is currently located and what the most recent movement along the stroke axis was. Any variation on parameters is also computed.
   *
   * @param {Ayva} ayva
   */
  generateActions (ayva) {
    this.queueFunction((behavior) => {
      const { value, lastValue } = ayva.$.stroke;
      const { target, shape } = this.#getTargetShape(value, lastValue);

      behavior.insertMove({
        to: target,
        speed: this.#speed * (shape.relativeSpeed || 1),
        value: typeof shape === 'object' ? shape.value : shape,
      });

      this.#speed = this.#config.speed.next();
    });
  }

  #init (config) {
    const strokeConfig = {
      ...ClassicStroke.DEFAULT_CONFIG,
      ...config,
    };

    this.#validate(strokeConfig);

    strokeConfig.top = this.#createParameterProvider(strokeConfig.top);
    strokeConfig.bottom = this.#createParameterProvider(strokeConfig.bottom);
    strokeConfig.speed = this.#createParameterProvider(strokeConfig.speed);

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

  #createParameterProvider (value) {
    if (typeof value !== 'function') {
      return new StrokeParameterProvider(() => value);
    }

    return new StrokeParameterProvider(value);
  }

  /**
   * Decide where to stroke next based on the current position.
   * Applies some common sense so there are smoother transitions between patterns.
   */
  #getTargetShape (currentValue, lastValue) {
    const lastStrokeWasUp = (currentValue - lastValue) >= 0;
    const nextShapeDirection = this.#config.shape.index % 2 === 0 ? 'up' : 'down';

    let target;
    if (currentValue <= this.#bottom || (currentValue < this.#top && !lastStrokeWasUp)) {
      target = this.#top;
      this.#top = this.#config.top.next();

      if (nextShapeDirection === 'down') {
        this.#config.shape.next(); // Skip to the next up shape.
      }
    } else {
      target = this.#bottom;
      this.#bottom = this.#config.bottom.next();

      if (nextShapeDirection === 'up') {
        this.#config.shape.next(); // Skip to the next down shape.
      }
    }

    return { target, shape: this.#config.shape.next() };
  }

  #validate (config) {
    const fail = (parameter, value) => {
      throw new Error(`Invalid stroke ${parameter}: ${value}`);
    };

    if (!validNumber(config.bottom, 0, 1) && typeof config.bottom !== 'function') {
      fail('bottom', config.bottom);
    }

    if (!validNumber(config.top, 0, 1) && typeof config.top !== 'function') {
      fail('top', config.top);
    }

    if (config.bottom === config.top) {
      throw new Error(`Invalid stroke range specified: (${config.bottom}, ${config.top})`);
    }

    if ((!validNumber(config.speed) || config.speed <= 0) && typeof config.speed !== 'function') {
      fail('speed', config.speed);
    }

    if (typeof config.shape !== 'function' && !(config.shape instanceof Array)) {
      fail('shape', config.shape);
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
  }
}

export default ClassicStroke;
