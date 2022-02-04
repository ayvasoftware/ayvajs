/* eslint-disable no-new, no-await-in-loop */
import '../setup-chai.js';
import sinon from 'sinon';
import VariableDuration from '../../src/util/variable-duration.js';

describe('Variable Duration Tests', function () {
  const invalidNumericValues = [null, undefined, 'bad', '', false, true, () => {}, NaN, Infinity, -1];

  const createFakeTimer = function () {
    // Each call ticks a second.
    let index = 0;
    return () => 1000 * index++;
  };

  beforeEach(function () {
    const now = createFakeTimer();
    sinon.replace(globalThis, 'performance', {
      now: sinon.fake(now),
    });
    sinon.replace(Math, 'random', sinon.fake(() => 0.5));
  });

  afterEach(function () {
    sinon.restore();
  });

  it('should throw error on invalid inputs', function () {
    invalidNumericValues.forEach((value) => {
      (function () {
        new VariableDuration(value);
      }).should.throw(`Invalid duration range: (${value}, undefined)`);

      if (value !== undefined) { // Allow second parameter to be undefined but disallow other invalid values.
        (function () {
          new VariableDuration(0, value);
        }).should.throw(`Invalid duration range: (0, ${value}`);
      }
    });

    (function () {
      new VariableDuration(10, 5);
    }).should.throw('Invalid duration range: (10, 5)');

    (function () {
      new VariableDuration(10, 10);
    }).should.throw('Invalid duration range: (10, 10)');
  });

  it('should allow a fake timer function', function () {
    // This is a test of our fake timer :)
    const now = createFakeTimer();

    expect(now()).to.equal(0);
    expect(now()).to.equal(1000);
    expect(now()).to.equal(2000);
    expect(now()).to.equal(3000);
    expect(now()).to.equal(4000);
    expect(now()).to.equal(5000);
  });

  it('should select a random time in duration and complete when time is up', function () {
    const duration = new VariableDuration(10, 20);

    // Since our random function always returns 0.5, the "randomly" selected duration should be 15 seconds...
    duration.targetElapsed.should.equal(15000);

    for (let i = 0; i < 7; i++) {
      duration.complete.should.equal(false);

      const expectedPercentage = ((2 + 2 * i)) / 15; // Each time we call either complete or percentage the clock ticks a second...
      duration.percentage.should.equal(expectedPercentage);
    }

    duration.complete.should.equal(true);
    duration.percentage.should.equal(1);
  });

  it('should allow a constant duration and complete when time is up', function () {
    const duration = new VariableDuration(10);

    duration.targetElapsed.should.equal(10000);

    for (let i = 0; i < 5; i++) {
      duration.complete.should.equal(false);

      const expectedPercentage = ((2 + 2 * i)) / 10; // Each time we call either complete or percentage the clock ticks a second...
      duration.percentage.should.equal(expectedPercentage);
    }

    duration.complete.should.equal(true);
    duration.percentage.should.equal(1);
  });
});
