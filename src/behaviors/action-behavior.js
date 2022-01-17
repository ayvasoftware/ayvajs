import AyvaMoveBuilder from '../ayva-move-builder.js';

/**
 * Base class for action queue based behaviors.
 *
 * TODO: Better documentation.
 */
class ActionBehavior {
  #actions = [];

  /**
   * Generate the actions that make up this behavior. Subclasses should implement this method.
   *
   * @param {Ayva} ayva - instance of Ayva to generate actions for
   */
  generateActions (ayva) { // eslint-disable-line no-unused-vars
    throw new Error('Behavior does not implement generateActions()');
  }

  /**
   * Generates the actions of this behavior and returns the resultant actions.
   * Any actions that were already on the queue will also be returned.
   * The action queue will be clear after this operation.
   *
   * @param {Ayva} ayva - instance of Ayva to generate actions for
   * @param {Number} iterations - how many iterations of this behavior to generate
   */
  emitActions (ayva, iterations = 1) {
    for (let i = 0; i < iterations; i++) {
      this.generateActions(ayva);
    }

    return this.#actions.splice(0, this.#actions.length);
  }

  /**
   * Consume and perform the next action of this behavior asychronously. If there are no current
   * actions remaining, they will be generated.
   *
   * TODO: Maybe rename this. It is only performing a single step of the behavior.
   *
   * @param {Ayva} ayva - instance of Ayva to generate actions for
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
    } else if (type === 'move' && value instanceof AyvaMoveBuilder) {
      return value.execute();
    } else if (type === 'move' && value instanceof Array) {
      return ayva.move(...value);
    }

    throw new Error(`Invalid action: (${type}, ${value})`);
  }

  /**
   * Add a move to the end of the action queue.
   */
  queueMove (...moves) {
    const value = moves[0] instanceof AyvaMoveBuilder ? moves[0] : moves;
    this.#queueAction({ type: 'move', value });
  }

  /**
   * Add a sleep to the end of the action queue.
   */
  queueSleep (seconds) {
    this.#queueAction({ type: 'sleep', value: seconds });
  }

  /**
   * Add a function to the end of the action queue.
   */
  queueFunction (func) {
    this.#queueAction({ type: 'function', value: func });
  }

  /**
   * Add the actions from the specified behavior to the end of the action queue.
   * Allows for behavior composition.
   */
  queueBehavior (behavior, ayva, iterations = 1) {
    // TODO: Cycle detection?
    this.#queueActions(behavior.emitActions(ayva, iterations));
  }

  /**
   * Add a move to the front of the action queue.
   */
  insertMove (...moves) {
    const value = moves[0] instanceof AyvaMoveBuilder ? moves[0] : moves;
    this.#insertAction({ type: 'move', value });
  }

  /**
   * Add a sleep to the front of the action queue.
   */
  insertSleep (seconds) {
    this.#insertAction({ type: 'sleep', value: seconds });
  }

  /**
   * Add a function to the front of the action queue.
   */
  insertFunction (func) {
    this.#insertAction({ type: 'function', value: func });
  }

  /**
   * Add the actions from the specified behavior to the front of the action queue.
   * Allows for behavior composition.
   */
  insertBehavior (behavior, ayva, iterations = 1) {
    // TODO: Cycle detection?
    this.#insertActions(behavior.emitActions(ayva, iterations));
  }

  /**
   * Add the specified action to the end of the action queue.
   */
  #queueAction (action) {
    this.#actions.push(action);
  }

  /**
   * Add the specified actions to the end of the action queue.
   */
  #queueActions (actions) {
    this.#actions.splice(this.#actions.length, 0, ...actions);
  }

  /**
   * Insert an action to the front of the action queue.
   */
  #insertAction (action) {
    this.#actions.unshift(action);
  }

  /**
   * Insert the specified actions to the front of the action queue.
   */
  #insertActions (actions) {
    this.#actions.splice(0, 0, ...actions);
  }
}

export default ActionBehavior;
