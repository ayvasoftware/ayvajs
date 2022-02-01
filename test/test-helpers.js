/**
 * Return a simple OSR2 test configuration.
 */
export function createTestConfig () {
  return {
    name: 'OSR2',
    defaultAxis: 'L0',
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
        alias: 'forward',
      },
      {
        name: 'L2',
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
        name: 'R2',
        type: 'rotation',
        alias: 'pitch',
      },
      {
        name: 'A0',
        type: 'auxiliary',
        alias: 'valve',
      },
      {
        name: 'A1',
        type: 'auxiliary',
        alias: 'suck',
      },
      {
        name: 'B1',
        type: 'boolean',
        alias: 'test-boolean-axis',
      },
      {
        name: 'B2',
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
