import { clamp, validNumber } from './util.js';

/**
 * A variable duration is a timer that completes within some variable time range.
 */
class VariableDuration {
  #startTime;

  #targetElapsed;

  /**
   * Create and start the duration timer immediately.
   * @param {Number} from
   * @param {Number} [to]
   */
  constructor (from, to) {
    if (validNumber(from, 0) && to === undefined) {
      // Allow specifying only a single time unit duration.
      this.#targetElapsed = from * 1000;
    } else if (!(validNumber(from, 0) && validNumber(to, 0) && from < to)) {
      throw new Error(`Invalid duration range: (${from}, ${to})`);
    } else {
      // Pick a random time within the specified range to complete.
      this.#targetElapsed = (Math.random() * (to - from) + from) * 1000;
    }

    this.#startTime = performance.now();
  }

  get targetElapsed () {
    return this.#targetElapsed;
  }

  /**
   * True if this duration's target time has been reached.
   */
  get complete () {
    return performance.now() - this.#startTime >= this.#targetElapsed;
  }

  /**
   * Returns the percent complete of this duration.
   */
  get percentage () {
    return clamp((performance.now() - this.#startTime) / this.#targetElapsed, 0, 1);
  }
}

export default VariableDuration;
