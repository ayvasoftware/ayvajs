export default {
  round (value, digits) {
    const factor = 10 ** digits;
    return Math.round(factor * value) / factor;
  },

  clamp (value, min, max) {
    return Math.max(min, Math.min(max, value));
  },

  /**
   * Shorthand for defining a readonly property.
   */
  createConstant (object, name, value) {
    Object.defineProperty(object, name, {
      value: value,
      writeable: false,
      configurable: false,
      enumerable: true,
    });
  },

  /**
   * Return a random number between min and max.
   */
  random (min, max) {
    return (max - min) * Math.random() + min;
  },

  /**
   * Return a random integer between 1 and the maximum.
   */
  randomCount (max) {
    return Math.ceil(Math.random() * max);
  },

  /**
   * Shorthand for Object.prototype.hasOwnProperty.call()
   */
  has (obj, prop) {
    return Object.prototype.hasOwnProperty.call(obj, prop);
  },

  /**
   * Shorthand for throwing an error during validation.
   * @param {*} error
   */
  fail (error) {
    throw new Error(error);
  },
};
