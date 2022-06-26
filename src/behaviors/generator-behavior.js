import MoveBuilder from '../util/move-builder.js';

class GeneratorBehavior {
  #generator;

  #done = false;

  /**
   * Generate the actions that make up this behavior. Subclasses should implement this method.
   *
   * For full details on how to implement this method, see the {@tutorial behavior-api} tutorial.
   *
   * @param {Ayva} ayva - instance of Ayva to generate actions for.
   */
  * generate (ayva) { // eslint-disable-line require-yield, no-unused-vars
    throw new Error('generate() not implemented.');
  }

  * iterate (count, ayva) {
    for (let i = 0; i < count; i++) {
      yield* this.generate(ayva);
    }
  }

  perform (ayva) {
    const value = this.#next(ayva);

    if (value) {
      if (Array.isArray(value)) {
        return ayva.move(...value);
      } else if (Number.isFinite(value) && value >= 0) {
        return ayva.sleep(value);
      } else if (value instanceof MoveBuilder) {
        return value.execute();
      } else if (value instanceof Promise) {
        return value;
      }

      return ayva.move(value);
    }

    return Promise.resolve();
  }

  #next (ayva) {
    if (!this.#generator || this.#done) {
      this.#generator = this.generate(ayva);
      this.#done = false;
    }

    const { value, done } = this.#generator.next();

    this.#done = done;

    return !done ? value : null;
  }
}

export default GeneratorBehavior;
