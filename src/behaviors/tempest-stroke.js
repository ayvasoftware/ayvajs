/* eslint-disable max-classes-per-file */
/* eslint-disable no-use-before-define */
import AyvaBehavior from './ayva-behavior.js';
import Ayva from '../ayva.js';
import StrokeParameterProvider from '../util/stroke-parameter-provider.js';
import tempestStrokeLibrary from '../util/tempest-stroke-library.js';
import { createConstantProperty, has, validNumber } from '../util/util.js';

/**
 * A behavior that allows specifying oscillatory motion on an arbitrary
 * number of axes with a formula loosely based on orbital motion calculations.
 * See the [Tempest Stroke Tutorial]{@link https://ayvajs.github.io/ayvajs-docs/tutorial-behavior-api-tempest-stroke.html}.
 */
class TempestStroke extends AyvaBehavior {
  #angle;

  #bpm;

  #bpmProvider;

  get angle () {
    return this.#angle;
  }

  set angle (rad) {
    this.#angle = rad;
  }

  get bpm () {
    return this.#bpm;
  }

  static #granularity = 36;

  /**
   * How many slices to divide a stroke (180 degrees) into.
   * This controls how often a bpm provider is called per stroke.
   */
  static set granularity (value) {
    if (!validNumber(value, 1)) {
      throw new Error(`Invalid granularity: ${value}`);
    }

    TempestStroke.#granularity = value;
  }

  static get granularity () {
    return TempestStroke.#granularity;
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
    // TODO: Deep clone some other way.
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
   * @param {Number} [bpm=60]
   * @param {Number} [angle=0]
   */
  constructor (config, bpm = 60, angle = 0) {
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

    this.#angle = angle;
    this.#bpmProvider = StrokeParameterProvider.createFrom(bpm);
    this.#bpm = this.#bpmProvider.next();
  }

  generateActions () {
    const { granularity } = TempestStroke;

    for (let i = 0; i < granularity; i++) {
      this.queueFunction((behavior) => {
        this.#createMoves(behavior, i);
      });
    }

    this.queueFunction(() => {
      this.#angle += Math.PI;
    });
  }

  /**
   * Returns an array of moves that will move to the start position of this Tempest Stroke.
   * The speed of the moves default to 1 unit per second.
   *
   * @param {Ayva} ayva
   * @param {Object} [mixinConfig] - configuration options to add or override for each move.
   * @returns array of moves
   */
  getStartMoves (ayva, mixinConfig) {
    const speedConfig = {};

    if (!mixinConfig || !(has(mixinConfig, 'speed') || has(mixinConfig, 'duration'))) {
      speedConfig.speed = 1;
    }

    const usedAxesMapByName = {};

    const axesMoves = Object.keys(this.axes).map((axisNameOrAlias) => {
      usedAxesMapByName[ayva.getAxis(axisNameOrAlias).name] = true;
      const params = this.axes[axisNameOrAlias];

      const to = Ayva.tempestMotion(
        params.from,
        params.to,
        params.phase,
        params.ecc,
        this.#bpm,
        params.shift + this.#angle
      )({ index: -1, frequency: ayva.frequency });

      return {
        axis: axisNameOrAlias,
        to,
        ...speedConfig,
        ...mixinConfig,
      };
    });

    const unusedAxesMoves = ayva.getAxes()
      .filter((axis) => !usedAxesMapByName[axis.name])
      .map((axis) => {
        const movement = {
          axis: axis.name,
          to: axis.defaultValue,
          ...speedConfig,
          ...mixinConfig,
        };

        if (axis.type === 'boolean') {
          delete movement.speed;
          delete movement.duration;
        }

        return movement;
      });

    return [...axesMoves, ...unusedAxesMoves];
  }

  /**
   * Creates a transition to a new TempestStroke. The result is an object with the properties
   * <code>transitionStroke</code> and <code>nextStroke</code>. <code>transitionStroke</code> is a behavior that blends this stroke
   * into <code>nextStroke</code>. <code>nextStroke</code> is the target stroke with a start angle that makes the transition
   * seamless.
   *
   * @example
   * const stroke = new TempestStroke('orbit-grind');
   *
   * // Create a transition from an orbit-grind to a vortex-tease that takes 5 seconds.
   * const { transitionStroke, nextStroke } = stroke.createTransition(5, 'vortex-tease');
   *
   * ayva.do(transitionStroke).then((complete) => {
   *   if (complete) {
   *     ayva.do(nextStroke);
   *   }
   * });
   *
   * @param {Number} duration - duration of the transition in seconds
   * @param {Object|String} nextStrokeConfig - stroke config or name of library config
   * @param {Number|Function} [bpm=60] - beats per minute of next stroke (or function that provides bpm)
   * @returns object containing transitionStroke behavior and nextStroke behavior.
   */
  createTransition (duration, nextStrokeConfig, bpm = 60) {
    const nextStroke = new TempestStroke(nextStrokeConfig, bpm);
    nextStroke.angle = this.#computeTransitionStartAngle(duration, this, nextStroke.bpm);

    return {
      nextStroke,
      transitionStroke: this.#createBlendBehavior(nextStroke, duration),
    };
  }

  #createMoves (behavior, index) {
    const { granularity } = TempestStroke;
    const moves = Object.keys(this.axes).map((axis) => {
      const params = this.axes[axis];
      const seconds = 30 / granularity;
      const angleSlice = Math.PI / granularity;

      return {
        axis,
        value: Ayva.tempestMotion(
          params.from,
          params.to,
          params.phase,
          params.ecc,
          this.#bpm,
          params.shift + this.#angle + (index * angleSlice)
        ),
        duration: seconds / this.#bpm,
      };
    });

    behavior.insertMove(...moves);
    this.#bpm = this.#bpmProvider.next();
  }

  #createBlendBehavior (targetTempestStroke, duration) {
    return new TempestStrokeTransition(this, targetTempestStroke, duration);
  }

  #computeTransitionStartAngle (duration, sourceTempestStroke, targetBpm) {
    const averageBpm = (sourceTempestStroke.bpm + targetBpm) / 2;
    return sourceTempestStroke.angle + (Math.PI * 2 * (averageBpm / 60) * duration);
  }
}

class TempestStrokeTransition extends AyvaBehavior {
  #source;

  #target;

  #duration;

  constructor (sourceBehavior, targetBehavior, duration) {
    super();
    this.#source = sourceBehavior;
    this.#target = targetBehavior;
    this.#duration = duration;
  }

  generateActions (ayva) {
    const defaultParamsLinearRotation = {
      from: 0.5, to: 0.5, phase: 0, ecc: 0,
    };

    const defaultParamsAux = {
      from: 0, to: 0, phase: 0, ecc: 0,
    };

    const sourceAxes = this.#getAxisMapByName(this.#source.axes, ayva);
    const targetAxes = this.#getAxisMapByName(this.#target.axes, ayva);

    const transitionAxisMoves = {};

    Object.keys(targetAxes).forEach((axis) => {
      const defaultParams = ayva.getAxis(axis).type === 'auxiliary' ? defaultParamsAux : defaultParamsLinearRotation;

      const sourceAxis = sourceAxes[axis] ?? { ...defaultParams };
      const targetAxis = targetAxes[axis];

      transitionAxisMoves[axis] = this.#createTransitionAxisMove(sourceAxis, targetAxis);
    });

    // Catch any dangling axes that were part of source but not part of target.
    Object.keys(sourceAxes).forEach((axis) => {
      if (!transitionAxisMoves[axis]) {
        const defaultParams = ayva.getAxis(axis).type === 'auxiliary' ? defaultParamsAux : defaultParamsLinearRotation;

        const sourceAxis = sourceAxes[axis];
        const targetAxis = { ...defaultParams };

        transitionAxisMoves[axis] = this.#createTransitionAxisMove(sourceAxis, targetAxis);
      }
    });

    const moves = [];
    Object.keys(transitionAxisMoves).forEach((axis) => {
      moves.push({
        axis,
        ...transitionAxisMoves[axis],
      });
    });

    this.queueMove(...moves);
    this.queueComplete();
  }

  #createTransitionAxisMove (sourceAxis, targetAxis) {
    const sourceBpm = this.#source.bpm;
    const averageBpm = (this.#source.bpm + this.#target.bpm) / 2;

    return {
      value: (params) => {
        const { x } = params;

        const from = Ayva.map(x, 0, 1, sourceAxis.from, targetAxis.from);
        const to = Ayva.map(x, 0, 1, sourceAxis.to, targetAxis.to);
        const phase = Ayva.map(x, 0, 1, sourceAxis.phase, targetAxis.phase);
        const ecc = Ayva.map(x, 0, 1, sourceAxis.ecc, targetAxis.ecc);
        const bpm = Ayva.map(x, 0, 1, sourceBpm, averageBpm);

        const provider = Ayva.tempestMotion(from, to, phase, ecc, bpm, this.#source.angle);
        return provider(params);
      },
      duration: this.#duration,
    };
  }

  #getAxisMapByName (axes, ayva) {
    // Convert axes config to be by name instead of alias so it is easier to reason about.
    return Object.keys(axes).reduce((map, axis) => {
      const axisConfig = ayva.getAxis(axis);
      map[axisConfig.name] = axes[axis];
      return map;
    }, {});
  }
}

export default TempestStroke;
