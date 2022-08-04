/* eslint-disable max-classes-per-file */
/* eslint-disable no-use-before-define */
import GeneratorBehavior from './generator-behavior.js';
import Ayva from '../ayva.js';
import StrokeParameterProvider from '../util/stroke-parameter-provider.js';
import tempestStrokeLibrary from '../util/tempest-stroke-library.js';
import { createConstantProperty, has, validNumber } from '../util/util.js';

/**
 * A behavior that allows specifying oscillatory motion on an arbitrary
 * number of axes with a formula loosely based on orbital motion calculations.
 * See the [Tempest Stroke Tutorial]{@link https://ayvajs.github.io/ayvajs-docs/tutorial-behavior-api-tempest-stroke.html}.
 */
class TempestStroke extends GeneratorBehavior {
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
      construct: Ayva.tempestMotion,
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

  * generate () {
    const { granularity } = TempestStroke;

    for (let i = 0; i < granularity; i++) {
      yield this.#createMoves(i);
    }

    this.#angle += Math.PI;
  }

  /**
   * Generates moves that will move to the start position of this Tempest Stroke.
   * The speed of the moves default to 1 unit per second.
   *
   * @param {Ayva} ayva
   * @param {Object} [mixin] - configuration options to add or override for each move.
   */
  * start (ayva, mixin) {
    const moves = this.getStartMoves(ayva, mixin);
    yield moves;
  }

  /**
   * Returns an array of moves that will move to the start position of this Tempest Stroke.
   * The speed of the moves default to 1 unit per second.
   *
   * @deprecated since version 0.13.0. Use start() generator instead.
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

      const to = params.construct(
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
   * Creates a new TempestStroke that starts with a transition from this TempestStroke.
   *
   * @example
   * const orbit = new TempestStroke('orbit-grind');
   *
   * // Create a transition from an orbit-grind to a 30 BPM vortex-tease that takes 5 seconds.
   * const vortex = orbit.transition('vortex-tease', 30, 5);
   *
   * ayva.do(vortex);
   *
   * @param {Object|String} config - stroke config or name of library config
   * @param {Number|Function} bpm - beats per minute of next stroke (or function that provides bpm)
   * @param {Number} duration - how long the transition should take in seconds
   */
  transition (config, bpm = 60, duration = 1, onTransitionStart = null, onTransitionEnd = null) {
    return new TempestStrokeWithTransition(config, bpm, this, duration, onTransitionStart, onTransitionEnd);
  }

  #createMoves (index) {
    const { granularity } = TempestStroke;
    const moves = Object.keys(this.axes).map((axis) => {
      const params = this.axes[axis];
      const seconds = 30 / granularity;
      const angleSlice = Math.PI / granularity;

      return {
        axis,
        value: params.construct(
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

    this.#bpm = this.#bpmProvider.next();
    return moves;
  }
}

class TempestStrokeWithTransition extends TempestStroke {
  #config;

  #transition;

  #onTransitionStart;

  #onTransitionEnd;

  constructor (config, bpmProvider, source, duration, onTransitionStart, onTransitionEnd) {
    super(config, bpmProvider);
    this.angle = TempestStrokeTransition.computeTransitionStartAngle(source, duration, this.bpm);
    this.#transition = new TempestStrokeTransition(source, this, duration);
    this.#config = config;
    this.#onTransitionStart = onTransitionStart;
    this.#onTransitionEnd = onTransitionEnd;

    if (source.ayva) {
      this.bind(source.ayva);
      this.#transition.bind(source.ayva);
    }
  }

  * generate (ayva) {
    if (!this.#transition.complete) {
      if (this.#onTransitionStart instanceof Function) {
        this.#onTransitionStart(this.#transition.duration, this.bpm);
      }

      yield* this.#transition();

      if (this.#onTransitionEnd instanceof Function) {
        this.#onTransitionEnd(this.#config, this.bpm);
      }
    }

    yield* super.generate(ayva);
  }
}

class TempestStrokeTransition extends GeneratorBehavior {
  #source;

  #target;

  #duration;

  get duration () {
    return this.#duration;
  }

  constructor (sourceBehavior, targetBehavior, duration) {
    super();
    this.#source = sourceBehavior;
    this.#target = targetBehavior;
    this.#duration = duration;
  }

  * generate (ayva) {
    if (typeof ayva !== 'object' || ayva.constructor.name !== 'Ayva') {
      throw new TypeError(`Invalid Ayva instance: ${ayva}`);
    }

    const zeroParamsLinearRotation = {
      ...TempestStroke.DEFAULT_PARAMETERS,
      from: 0.5,
      to: 0.5,
    };

    const zeroParamsAux = {
      ...TempestStroke.DEFAULT_PARAMETERS,
      from: 0,
      to: 0,
    };

    const sourceAxes = this.#getAxisMapByName(this.#source.axes, ayva);
    const targetAxes = this.#getAxisMapByName(this.#target.axes, ayva);

    const transitionAxisMoves = {};

    Object.keys(targetAxes).forEach((axis) => {
      const zeroParams = ayva.getAxis(axis).type === 'auxiliary' ? zeroParamsAux : zeroParamsLinearRotation;

      const sourceAxis = sourceAxes[axis] ?? { ...zeroParams };
      const targetAxis = targetAxes[axis];

      transitionAxisMoves[axis] = this.#createTransitionAxisMove(sourceAxis, targetAxis);
    });

    // Catch any dangling axes that were part of source but not part of target.
    Object.keys(sourceAxes).forEach((axis) => {
      if (!transitionAxisMoves[axis]) {
        const zeroParams = ayva.getAxis(axis).type === 'auxiliary' ? zeroParamsAux : zeroParamsLinearRotation;

        const sourceAxis = sourceAxes[axis];
        const targetAxis = { ...zeroParams };

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

    yield moves;
    this.complete = true;
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

        const provider = Ayva.blendMotion(
          sourceAxis.construct(from, to, phase, ecc, bpm, this.#source.angle),
          targetAxis.construct(from, to, phase, ecc, bpm, this.#source.angle),
          x
        );

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

  static computeTransitionStartAngle (source, duration, targetBpm) {
    const averageBpm = (source.bpm + targetBpm) / 2;
    return source.angle + (Math.PI * 2 * (averageBpm / 60) * duration);
  }
}

export default TempestStroke;
