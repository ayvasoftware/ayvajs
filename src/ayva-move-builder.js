class AyvaMoveBuilder {
  #ayva;

  #moves = [];

  constructor (ayva) {
    this.#ayva = ayva;

    Object.values(ayva.axes).forEach((axis) => {
      this[axis.name] = this.#createBuilderFunction(axis.name);

      if (axis.alias) {
        this[axis.alias] = this.#createBuilderFunction(axis.alias);
      }
    });
  }

  execute () {
    return this.#ayva.move(...this.#moves);
  }

  #createBuilderFunction (axis) {
    return (...args) => {
      if (args.length === 3 && typeof args[0] === 'number' && typeof args[1] === 'number' && typeof args[2] === 'function') {
        // <to, speed, value>
        this.#moves.push({
          axis,
          to: args[0],
          speed: args[1],
          value: args[2],
        });
      } else if (args.length === 2 && typeof args[0] === 'number' && typeof args[1] === 'number') {
        // <to, speed>
        this.#moves.push({
          axis,
          to: args[0],
          speed: args[1],
        });
      } else if (args.length === 2 && typeof args[0] === 'number' && typeof args[1] === 'function') {
        // <to, value>
        this.#moves.push({
          axis,
          to: args[0],
          value: args[1],
        });
      } else if (args.length === 1 && typeof args[0] === 'number') {
        // <to>
        this.#moves.push({
          axis,
          to: args[0],
        });
      } else if (args.length === 2 && typeof args[0] === 'function' && typeof args[1] === 'number') {
        // <value, duration>
        this.#moves.push({
          axis,
          value: args[0],
          duration: args[1],
        });
      } else if (args.length === 1 && typeof args[0] === 'function') {
        // <value>
        this.#moves.push({
          axis,
          value: args[0],
        });
      } else if (args.length === 1 && typeof args[0] === 'object') {
        // <object>
        this.#moves.push({
          ...args[0],
          axis,
        });
      } else {
        throw new Error(`Invalid arguments: ${args}`);
      }

      return this;
    };
  }
}

export default AyvaMoveBuilder;
