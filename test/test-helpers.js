import sinon from 'sinon';

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
        alias: 'surge',
      },
      {
        name: 'L2',
        type: 'linear',
        alias: 'sway',
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
        alias: 'testBooleanAxis',
      },
      {
        name: 'B2',
        type: 'boolean',
        alias: 'testBooleanAxis2',
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

/**
 * @returns Promise that resolves when enough ticks for a behavior cycle to complete have elapsed.
 */
export async function tickBehavior () {
  await Promise.resolve();
}

/**
 * Shorthand for replacing function with mock version that returns a result.
 */
export function mock (obj, property, result) {
  const replacement = sinon.fake.returns(result);
  sinon.replace(obj, property, replacement);
  return replacement;
}

/**
 * Shorthand for replacing function with spied version.
 */
export function spy (obj, property) {
  const replacement = sinon.fake(obj[property]);
  sinon.replace(obj, property, replacement);
  return replacement;
}

/**
 * Mock ayva.move()
 */
export function mockMove (ayva) {
  return mock(ayva, 'move', Promise.resolve(true));
}

/**
 * Spy ayva.move()
 */
export function spyMove (ayva) {
  return spy(ayva, 'move');
}

/**
 * Mock ayva.sleep()
 */
export function mockSleep (ayva) {
  return mock(ayva, 'sleep', Promise.resolve(true));
}

/**
 * Spy ayva.sleep()
 */
export function spySleep (ayva) {
  return spy(ayva, 'sleep');
}

/**
 * Mock output device.
 */
export function mockOutput (ayva) {
  const write = sinon.fake();
  ayva.addOutputDevice({ write });

  return write;
}

export { restore } from 'sinon';
