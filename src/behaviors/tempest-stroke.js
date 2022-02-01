import AyvaBehavior from './ayva-behavior.js';
import Ayva from '../ayva.js';
import StrokeParameterProvider from './stroke-parameter-provider.js';
import { createConstantProperty, has } from '../util.js';

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

    if (bpm instanceof Array) {
      this.#bpmProvider = new StrokeParameterProvider((index) => bpm[index % bpm.length]);
    } else if (typeof bpm !== 'function') {
      this.#bpmProvider = new StrokeParameterProvider(() => bpm);
    } else {
      this.#bpmProvider = new StrokeParameterProvider(bpm);
    }

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
}

export default TempestStroke;
