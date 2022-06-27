import MoveBuilder from '../util/move-builder.js';

/**
 * Base class for Ayva Behaviors.
 * @deprecated since v0.13.0. Use GeneratorBehavior instead.
 */
class AyvaBehavior {
  #actions = [];

  #complete = false;

  get complete () {
    return this.#complete;
  }

  /**
   * Generate the actions that make up this behavior. Subclasses should implement this method.
   *
   * For full details on how to implement this method, see the {@tutorial behavior-api} tutorial.
   *
   * @param {Ayva} ayva - instance of Ayva to generate actions for.
   */
  generateActions (ayva) { // eslint-disable-line no-unused-vars
    throw new Error('Behavior does not implement generateActions()');
  }

  /**
   * Generates and returns the actions of this behavior.
   * Any actions that were already on this behaviors action queue will also be returned.
   * The action queue of the behavior will be clear after this operation.
   *
   * @param {Number} iterations - how many iterations of this behavior to generate.
   * @param {Ayva} ayva - instance of Ayva to generate actions for.
   * @ignore
   */
  emitActions (iterations = 1, ayva = null) {
    for (let i = 0; i < iterations; i++) {
      this.generateActions(ayva);
    }

    return this.#actions.splice(0, this.#actions.length);
  }

  /**
   * Consume and perform the next action of this behavior asychronously.
   * If there are no current actions remaining, new actions will be generated.
   *
   * @param {Ayva} ayva - instance of Ayva to perform actions with.
   */
  async perform (ayva) {
    if (!this.#actions.length) {
      this.generateActions(ayva);
    }

    if (!this.#actions.length) {
      throw new Error('Behavior did not generate any actions.');
    }

    const { type, value } = this.#actions.shift();

    if (type === 'function' && value instanceof Function) {
      return value.call(undefined, this, ayva);
    } else if (type === 'sleep' && Number.isFinite(value) && value >= 0) {
      return ayva.sleep(value);
    } else if (type === 'move' && value instanceof MoveBuilder) {
      return value.execute();
    } else if (type === 'move' && value instanceof Array) {
      return ayva.move(...value);
    }

    throw new Error(`Invalid action: (${type}, ${value})`);
  }

  /**
   * Add a move to the end of the action queue.
   *
   * @example
   * class ExampleBehavior extends AyvaBehavior {
   *   generateActions (ayva) {
   *     this.queueMove({
   *       to: 0,
   *       speed: 1,
   *     },{
   *       axis: 'twist',
   *       to: 0,
   *       speed: 1
   *     });
   *   }
   * }
   * @param {...Object} moves - objects that describe the moves per the {@tutorial motion-api}.
   *//**
   * Add a move constructed with a move builder to the end of the action queue.
   * See the {@tutorial motion-api-syntactic-sugar} tutorial.
   *
   * @example
   * class ExampleBehavior extends AyvaBehavior {
   *   generateActions (ayva) {
   *     this.queueMove(ayva.$.stroke(0, 1).twist(0, 1));
   *   }
   * }
   *
   * @param {MoveBuilder} moveBuilder - a move builder.
   */
  queueMove (...moves) {
    const value = moves[0] instanceof MoveBuilder ? moves[0] : moves;
    this.#queueAction({ type: 'move', value });
  }

  /**
   * Add a sleep to the end of the action queue.
   *
   * @param {Number} seconds - number of seconds to sleep.
   */
  queueSleep (seconds) {
    this.#queueAction({ type: 'sleep', value: seconds });
  }

  /**
   * Add a function to the end of the action queue.
   *
   * @param {Function} func - the function.
   */
  queueFunction (func) {
    this.#queueAction({ type: 'function', value: func });
  }

  /**
   * Add the actions from the specified behavior to the end of the action queue.
   * Allows for behavior composition.
   *
   * @param {AyvaBehavior} behavior - the sub behavior.
   * @param {Number} iterations - how many iterations of the sub behavior to generate.
   * @param {Ayva} ayva - instance of Ayva.
   */
  queueBehavior (behavior, iterations = 1, ayva = null) {
    // TODO: Cycle detection?
    this.#queueActions(behavior.emitActions(iterations, ayva));
  }

  /**
   * Adds a function that flags this behavior as complete to the end of the action queue.
   */
  queueComplete () {
    this.queueFunction(() => {
      this.#complete = true;
    });
  }

  /**
   * Add a move to the front of the action queue.
   *
   * @example
   * class ExampleBehavior extends AyvaBehavior {
   *   generateActions (ayva) {
   *     this.insertMove({
   *       to: 0,
   *       speed: 1,
   *     },{
   *       axis: 'twist',
   *       to: 0,
   *       speed: 1
   *     });
   *   }
   * }
   * @param {...Object} moves - objects that describe the moves per the {@tutorial motion-api}.
   *//**
   * Add a move constructed with a move builder to the front of the action queue.
   * See the {@tutorial motion-api-syntactic-sugar} tutorial.
   *
   * @example
   * class ExampleBehavior extends AyvaBehavior {
   *   generateActions (ayva) {
   *     this.insertMove(ayva.$.stroke(0, 1).twist(0, 1));
   *   }
   * }
   *
   * @param {MoveBuilder} moveBuilder - a move builder.
   */
  insertMove (...moves) {
    const value = moves[0] instanceof MoveBuilder ? moves[0] : moves;
    this.#insertAction({ type: 'move', value });
  }

  /**
   * Add a sleep to the front of the action queue.
   *
   * @param {Number} seconds - number of seconds to sleep.
   */
  insertSleep (seconds) {
    this.#insertAction({ type: 'sleep', value: seconds });
  }

  /**
   * Add a function to the front of the action queue.
   *
   * @param {Function} func - callback function.
   */
  insertFunction (func) {
    this.#insertAction({ type: 'function', value: func });
  }

  /**
   * Add the actions from the specified behavior to the front of the action queue.
   * Allows for behavior composition.
   *
   * @param {AyvaBehavior} behavior - the sub behavior.
   * @param {Number} iterations - how many iterations of the sub behavior to generate.
   * @param {Ayva} ayva - instance of Ayva.
   */
  insertBehavior (behavior, iterations = 1, ayva = null) {
    // TODO: Cycle detection?
    this.#insertActions(behavior.emitActions(iterations, ayva));
  }

  /**
   * Adds a function that flags this behavior as complete to the front of the action queue.
   */
  insertComplete () {
    this.insertFunction(() => {
      this.#complete = true;
    });
  }

  #queueAction (action) {
    this.#actions.push(action);
  }

  #queueActions (actions) {
    this.#actions.splice(this.#actions.length, 0, ...actions);
  }

  #insertAction (action) {
    this.#actions.unshift(action);
  }

  #insertActions (actions) {
    this.#actions.splice(0, 0, ...actions);
  }
}

export default AyvaBehavior;
