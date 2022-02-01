export default class StrokeParameterProvider {
  #index = 0;

  #value;

  constructor (valueFunction) {
    this.#value = valueFunction;
  }

  next () {
    return this.#value(this.#index++);
  }

  get index () {
    return this.#index;
  }
}
