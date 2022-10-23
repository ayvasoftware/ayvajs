/* eslint-disable max-classes-per-file */
import TempestStroke from './tempest-stroke.js';
import Ayva from '../ayva.js';

// TODO: All the validation in this file. LOL.

const noteRegex = /([0-9]+)\/([0-9]+)/;

const getNoteValue = (value) => {
  // TODO: match single numbers.
  const match = value.match(noteRegex);

  return Number(match[1]) / Number(match[2]);
};

const getTimeSignatureLength = (value) => {
  const match = value.match(noteRegex);

  return Number(match[2]);
};

class TempestDanceStroke {
  #currentMeasureIndex;

  constructor (config, timer) {
    const measureConfigs = config.measures; // TODO: Proper JS copy.

    this.timeSignature = config.timeSignature;
    this.bpm = config.bpm;
    this.startTimeOffset = config.startTimeOffset;
    this.timeSignatureLength = getTimeSignatureLength(config.timeSignature);
    this.timer = timer;

    const secondsPerBeat = 60 / this.bpm;
    let currentTime = 0;

    let previousMeasure = null;
    measureConfigs.forEach((measure) => {
      if (measure.config) {
        measure.parameters = (new TempestStroke(measure.config)).axes;
        delete measure.config;
      }

      measure.noteValue = getNoteValue(measure.noteValue);
      measure.release = measure.release ? getNoteValue(measure.release) : 0;
      measure.startTime = currentTime;

      const noteBeatCount = measure.noteValue * this.timeSignatureLength;
      measure.totalBeatCount = noteBeatCount * measure.noteCount;
      measure.duration = measure.totalBeatCount * secondsPerBeat;
      measure.measureBpm = (1 / noteBeatCount) * this.bpm;

      // TODO: Validate release fits within duration (releaseDuration <= duration).
      measure.releaseDuration = measure.release * this.timeSignatureLength * secondsPerBeat;

      currentTime += measure.duration;

      if (previousMeasure) {
        previousMeasure.nextMeasure = measure;
      }

      previousMeasure = measure;
    });

    this.measures = measureConfigs;
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

          if (!measure || !measure.parameters) {
            return null;
          }

          const motionParams = measure.parameters;
          const releaseStartTime = measure.duration - measure.releaseDuration;
          const axisMotion = motionParams[name] || motionParams[alias];

          if (!axisMotion) {
            return null;
          }

          const elapsed = this.currentTime - measure.startTime;
          const elapsedRadians = elapsed * ((measure.measureBpm * 2 * Math.PI) / 60);
          const axisValue = this.computeAxisValue(axisMotion, measure.bpm, elapsedRadians, ayva.frequency);

          const { nextMeasure } = measure;

          if (nextMeasure && elapsed >= releaseStartTime) {
            // Blend with the next stroke...
            let otherAxisValue = defaultValue;
            const nextMotionParams = nextMeasure.parameters;
            const nextAxisMotion = nextMotionParams ? (nextMotionParams[name] || nextMotionParams[alias]) : null;

            if (nextAxisMotion) {
              otherAxisValue = this.computeAxisValue(nextAxisMotion, measure.bpm, elapsedRadians, ayva.frequency);
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
    return this.timer.now() - this.startTimeOffset;
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
}

export default TempestDanceStroke;
