/* eslint-disable max-classes-per-file */
import TempestStroke from './tempest-stroke.js';
import Ayva from '../ayva.js';

class TempestDanceStroke {
  #currentMeasureIndex;

  get bpm () {
    return this.tempo;
  }

  /**
   * Create a new TempestDanceStroke.
   *
   * @param {Object} config
   * @param {String} config.timeSignature
   * @param {Number} config.tempo
   * @param {Number} config.startTime
   * @param {Array<Measure>} config.measures
   * @param {Object} timer

   * @typedef {Object} Measure
   * @property {String|Object} stroke - The TempestStroke configuration (stroke name or axes)
   * @property {String} [timeSignature] - The time signature of the measure. Defaults to the time signature of the stroke.
   * @property {String|Number} [release] - fraction of a beat (1/4, 1/8, etc) the transition to the next measure should take. Defaults to zero.
   *
   */
  constructor ({
    timeSignature, tempo, startTime, measures, timer,
  }) {
    this.measures = measures;
    this.timeSignature = timeSignature;
    this.tempo = tempo;
    this.startTime = startTime || 0;
    this.timeSignatureBeatUnit = TempestDanceStroke.getTimeSignatureBeatUnit(timeSignature);
    this.timer = timer;

    const secondsPerBeat = 60 / this.bpm;
    let currentTime = 0;
    let previousMeasure = null;

    this.measures.forEach((measure) => {
      if (measure.stroke) {
        measure.parameters = (new TempestStroke(measure.stroke)).axes;
        delete measure.stroke;
      }

      const measureTimeSignature = measure.timeSignature || this.timeSignature;
      const measureTimeSignatureBeatUnit = TempestDanceStroke.getTimeSignatureBeatUnit(measureTimeSignature);
      const measureBeat = 1 / this.timeSignatureBeatUnit;
      measure.noteValue = 1 / measureTimeSignatureBeatUnit;
      measure.noteCount = TempestDanceStroke.getNoteCount(measureTimeSignature);
      measure.release = measure.release ? TempestDanceStroke.getNoteValue(measure.release) : 0;
      measure.startTime = currentTime;
      measure.rest = measure.rest || false;

      // noteBeatCount is the answer to the question "How many beats are in one note of this measure?"
      // i.e. If the time signature is 4/4 and this measure has 1/8 notes, then noteBeatCount = 0.5 (an 1/8 note is half a beat).
      const noteBeatCount = measure.noteValue / measureBeat;
      measure.totalBeatCount = noteBeatCount * measure.noteCount;
      measure.duration = measure.totalBeatCount * secondsPerBeat;
      measure.measureBpm = (1 / noteBeatCount) * this.bpm;
      measure.releaseDuration = (measure.release / measureBeat) * secondsPerBeat;

      if (measure.releaseDuration > measure.duration) {
        throw new Error(`Release cannot be longer than the measure: ${measure.releaseDuration} > ${measure.duration}`);
      }

      if (previousMeasure) {
        previousMeasure.nextMeasure = measure;
      }

      measure.previousMeasure = previousMeasure;
      previousMeasure = measure;
      currentTime += measure.duration;
    });

    this.#currentMeasureIndex = null;
  }

  perform (ayva) {
    const moves = ayva.getAxes().map((axisConfig) => {
      const { name, alias, defaultValue } = axisConfig;

      return {
        axis: name,
        duration: Number.MAX_SAFE_INTEGER, // Infinite Move
        value: () => {
          const measure = this.computeCurrentMeasure(this.currentTime);

          if ((!measure || !measure.parameters) && !measure?.rest) {
            return null;
          }

          const releaseStartTime = measure.duration - measure.releaseDuration;
          const axisMotion = this.#findAxisMotion(ayva, axisConfig, measure);

          if (!axisMotion) {
            return null;
          }

          const elapsed = this.currentTime - measure.startTime;
          const elapsedRadians = elapsed * ((measure.measureBpm * 2 * Math.PI) / 60);
          const axisValue = this.computeAxisValue(axisMotion, measure.measureBpm, elapsedRadians, ayva.frequency);

          const { nextMeasure } = measure;

          if (nextMeasure && elapsed >= releaseStartTime) {
            // Blend with the next stroke...
            let otherAxisValue = defaultValue;
            const nextMotionParams = nextMeasure.parameters;
            const nextAxisMotion = nextMotionParams ? (nextMotionParams[name] || nextMotionParams[alias]) : null;

            if (nextAxisMotion) {
              otherAxisValue = this.computeAxisValue(nextAxisMotion, measure.measureBpm, elapsedRadians, ayva.frequency);
            }

            const releaseTime = elapsed - releaseStartTime;
            const provider = Ayva.blendMotion(
              () => axisValue,
              () => otherAxisValue,
              Ayva.map(releaseTime, 0, measure.releaseDuration, 0, 1)
            );

            return provider();
          }

          return axisValue;
        },
      };
    });

    return ayva.move(...moves);
  }

  computeAxisValue (axisMotion, bpm, angle, frequency) {
    return axisMotion.motion(
      axisMotion.from,
      axisMotion.to,
      axisMotion.phase,
      axisMotion.ecc,
      bpm,
      axisMotion.shift + angle,
    )({ index: -1, frequency });
  }

  get currentMeasure () {
    if (Number.isFinite(this.#currentMeasureIndex)) {
      return this.measures[this.#currentMeasureIndex];
    }

    return null;
  }

  get currentTime () {
    return this.timer.now() - this.startTime;
  }

  computeCurrentMeasure (timeIndex) {
    if (!(this.currentMeasure && this.#measureContains(this.currentMeasure, timeIndex))) {
      this.#currentMeasureIndex = this.#findMeasure(timeIndex);
    }

    return this.currentMeasure;
  }

  #measureContains (measure, timeIndex) {
    return timeIndex >= measure.startTime && timeIndex < measure.startTime + measure.duration;
  }

  #findMeasure (timeIndex) {
    let start = 0;
    let end = this.measures.length - 1;

    while (start <= end) {
      const middle = Math.floor((start + end) / 2);
      const measure = this.measures[middle];
      const endTime = measure.startTime + measure.duration;

      if (this.#measureContains(measure, timeIndex)) {
        return middle;
      } else if (endTime <= timeIndex) {
        start = middle + 1;
      } else {
        end = middle - 1;
      }
    }

    return null;
  }

  /**
   * If this measure doesn't have a value for the given axis, find the value from the previous measure.
   */
  #findAxisMotion (ayva, { name, alias, defaultValue }, measure) {
    const defaultMotion = {
      from: defaultValue, to: defaultValue, shift: 0, motion: Ayva.tempestMotion,
    };

    const { parameters } = measure;

    if (!measure.rest && parameters && (parameters[name] || parameters[alias])) {
      // The measure is not a rest and has its own motion on this axis.
      return parameters[name] || parameters[alias];
    }

    if (!measure.rest) {
      // The measure is not a rest and doesn't have its own motion on this axis.
      return defaultMotion;
    }

    // If we made it here, the measure is a rest. Find the motion from the previous measure (if it exists).
    let { previousMeasure } = measure;

    while (previousMeasure && !(previousMeasure.parameters?.[name] || previousMeasure.parameters?.[measure.name])) {
      previousMeasure = previousMeasure.previousMeasure;
    }

    if (previousMeasure) {
      const previousMotion = previousMeasure.parameters[name] || previousMeasure.parameters[alias];
      const value = this.computeAxisValue(previousMotion, previousMeasure.measureBpm, (Math.PI) * previousMotion.phase, ayva.frequency);
      return { ...previousMotion, from: value, to: value };
    }

    return null;
  }

  /**
   * Extracts the beat of a time signature. i.e. 3/4 -> 4
   *
   * @param {String} value - time signature
   * @returns the beat of the time signature
   */
  static getTimeSignatureBeatUnit (value) {
    const match = value.match(TempestDanceStroke.noteRegex);

    if (!match) {
      throw new Error(`Invalid time signature: ${value}`);
    }

    return Number(match[2]);
  }

  /**
   * Converts a relative duration value (1/2, 1/4, etc) to its decimal equivalent.
   *
   * @param {String} value - relative duration as a fraction
   * @returns the decimal equivalent of the relative duration (1/2 -> 0.5)
   */
  static getNoteValue (value) {
    if (Number.isFinite(value)) {
      return value;
    }

    const match = value.match(TempestDanceStroke.noteRegex);

    if (!match) {
      throw new Error(`Invalid note value: ${value}`);
    }

    return Number(match[1]) / Number(match[2]);
  }

  static getNoteCount (value) {
    const match = value.match(TempestDanceStroke.noteRegex);

    if (!match) {
      throw new Error(`Invalid note value: ${value}`);
    }

    return Number(match[1]);
  }

  static noteRegex = /([0-9]*\.?[0-9]+)\/([0-9]*\.?[0-9]+)/;
}

export default TempestDanceStroke;
