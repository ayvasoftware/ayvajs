import AyvaBehavior from './ayva-behavior.js';
import Ayva from '../ayva.js';
import StrokeParameterProvider from '../util/stroke-parameter-provider.js';
import tempestStrokeLibrary from '../util/tempest-stroke-library.js';
import { createConstantProperty, has } from '../util/util.js';

class TempestStroke extends AyvaBehavior {
  #angle;

  #bpm;

  #bpmProvider;

  get angle () {
    return this.#angle;
  }

  get bpm () {
    return this.#bpm;
  }

  static get DEFAULT_PARAMETERS () {
    return {
      from: 0,
      to: 1,
      phase: 0,
      ecc: 0,
      shift: 0,
    };
  }

  static get library () {
    return JSON.parse(JSON.stringify(tempestStrokeLibrary));
  }

  /**
   * Create a new tempest stroke with the specified config.
   *
   * @example
   * ayva.do(new TempestStroke({
   *   stroke: {
   *     from: 0,
   *     to: 1,
   *   },
   *   twist: {
   *     from: 0.25,
   *     to: 0.75,
   *     phase: 1,
   *   },
   * }));
   * @param {Object} config
   * @param {Number} bpm
   */
  constructor (config, bpm = 60) {
    super();

    if (typeof config === 'string') {
      if (!has(tempestStrokeLibrary, config)) {
        throw new Error(`No stroke named ${config} found.`);
      }

      config = tempestStrokeLibrary[config]; // eslint-disable-line no-param-reassign
    }

    createConstantProperty(this, 'axes', {});

    Object.keys(config).forEach((axis) => {
      createConstantProperty(this.axes, axis, {});

      Object.keys(config[axis]).forEach((property) => {
        createConstantProperty(this.axes[axis], property, config[axis][property]);
      });

      Object.keys(TempestStroke.DEFAULT_PARAMETERS).forEach((property) => {
        if (!has(config[axis], property)) {
          createConstantProperty(this.axes[axis], property, TempestStroke.DEFAULT_PARAMETERS[property]);
        }
      });
    });

    this.#angle = 0;
    this.#bpmProvider = StrokeParameterProvider.createFrom(bpm);
    this.#bpm = this.#bpmProvider.next();
  }

  generateActions () {
    this.queueFunction((behavior) => {
      const moves = Object.keys(this.axes).map((axis) => {
        const params = this.axes[axis];

        return {
          axis,
          value: Ayva.tempestMotion(
            params.from,
            params.to,
            params.phase,
            params.ecc,
            this.#bpm,
            params.shift + this.#angle
          ),
          duration: 30 / this.#bpm,
        };
      });

      behavior.insertMove(...moves);

      this.#angle += Math.PI;
      this.#bpm = this.#bpmProvider.next();
    });
  }

  /**
   * Returns an array of moves that will move to the start position of this Tempest Stroke.
   * The speed of the moves default to 1 unit per second.
   *
   * @param {Ayva} ayva
   * @param {Object} [mixinConfig] - configuration options to add or override for each move.
   * @returns
   */
  getTransitionMoves (ayva, mixinConfig) {
    const speedConfig = {};

    if (!mixinConfig || !(has(mixinConfig, 'speed') || has(mixinConfig, 'duration'))) {
      speedConfig.speed = 1;
    }

    return Object.keys(this.axes).map((axis) => {
      const params = this.axes[axis];

      const to = Ayva.tempestMotion(
        params.from,
        params.to,
        params.phase,
        params.ecc,
        this.#bpm,
        params.shift + this.#angle
      )({ index: 0, frequency: ayva.frequency });

      return {
        axis,
        to,
        ...speedConfig,
        ...mixinConfig,
      };
    });
  }
}

export default TempestStroke;
