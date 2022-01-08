/**
 * Return a simple OSR2 test configuration.
 */
export function TEST_CONFIG () {
  return {
    name: 'OSR2',
    defaultAxis: 'stroke',
    frequency: 50,
    axes: [
      {
        name: 'L0',
        type: 'linear',
        alias: 'stroke',
      },
      {
        name: 'L1',
        type: 'linear',
        alias: 'left',
      },
      {
        name: 'R0',
        type: 'rotation',
        alias: 'twist',
      },
      {
        name: 'R1',
        type: 'rotation',
        alias: 'roll',
      },
      {
        name: 'A0',
        type: 'auxiliary',
        alias: 'valve',
      },
      {
        name: 'A1',
        type: 'boolean',
        alias: 'test-boolean-axis',
      },
      {
        name: 'A2',
        type: 'boolean',
        alias: 'test-boolean-axis-2',
      },
    ],
  };
}

/**
 * Returns a function that binds arguments to a method on an object.
 * This is useful for more cleanly testing when exceptions should occur.
 *
 * @param {Object} object
 * @param {String} method
 * @returns
 */
export function createFunctionBinder (object, method) {
  return function (...args) {
    return object[method].bind(object, ...args);
  };
}
