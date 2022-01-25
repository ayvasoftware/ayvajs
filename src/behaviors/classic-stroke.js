import Ayva from '../ayva.js';
import AyvaBehavior from './ayva-behavior.js';
import { clamp } from '../util.js';

class ClassicStroke extends AyvaBehavior {
  #top;

  #bottom;

  #speed;

  #ramp;

  #currentSpeed;

  #currentTop;

  #currentBottom;

  get speed () {
    return this.#currentSpeed;
  }

  get top () {
    return this.#currentTop;
  }

  get bottom () {
    return this.#currentBottom;
  }

  constructor (from = 0, to = 1, speed = 1, ramp = Ayva.RAMP_COS) {
    super();

    this.#top = clamp(Math.max(from, to), 0, 1);
    this.#bottom = clamp(Math.min(from, to), 0, 1);
    this.#speed = speed;
    this.#ramp = ramp;

    if (!Number.isFinite(from) || !Number.isFinite(to) || !Number.isFinite(speed) || this.#bottom >= this.#top) {
      throw new Error(`Invalid stroke specified: (${from}, ${to}, ${speed})`);
    }

    this.#currentSpeed = this.#speed;
    this.#currentTop = this.#top;
    this.#currentBottom = this.#bottom;
  }

  generateActions (ayva) {
    this.queueFunction(() => {
      const { value, lastValue } = ayva.$.stroke;

      this.insertMove({
        to: this.#getTarget(value, lastValue),
        speed: this.#currentSpeed,
        value: this.#ramp,
      });
    });
  }

  /**
   * Decide where to stroke next based on the current position.
   * Applies some common sense so there are smoother transitions between patterns.
   */
  #getTarget (currentValue, lastValue) {
    const lastStrokeWasUp = (currentValue - lastValue) >= 0;

    if (currentValue <= this.#currentBottom) {
      return this.#currentTop;
    } else if (currentValue >= this.#currentTop || lastStrokeWasUp) {
      return this.#currentBottom;
    }

    return this.#currentTop;
  }
}

export default ClassicStroke;
