/**
 * Various utility functions
 * 
 * @module
 * @ignore
 */

/**
 * Round a number to the specified number of digits.
 */
export function round (value, digits) {
  const factor = 10 ** digits;
  return Math.round(factor * value) / factor;
}

/**
 * Clamp a value to within the specified range.
 */
export function clamp (value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Shorthand for defining a readonly property.
 */
export function createConstantProperty (object, name, value) {
  Object.defineProperty(object, name, {
    value: value,
    writeable: false,
    configurable: false,
    enumerable: true,
  });
}

/**
 * Shorthand for Object.prototype.hasOwnProperty.call()
 */
export function has (obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

/**
 * Shorthand for throwing an error during validation.
 * @param {*} error
 */
export function fail (error) {
  throw new Error(error);
}
