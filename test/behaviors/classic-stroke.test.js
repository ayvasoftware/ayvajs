/* eslint-disable no-new, no-await-in-loop */
import '../setup-chai.js';
import sinon from 'sinon';
import Ayva from '../../src/ayva.js';
import ClassicStroke from '../../src/behaviors/classic-stroke.js';
import { createTestConfig } from '../test-helpers.js';
import { round } from '../../src/util/util.js';

describe('Classic Stroke Tests', function () {
  let ayva;

  /**
   * Verify that the starting parameters are correct.
   */
  const verifyStart = function (stroke, bottom, top, speed, duration) {
    ayva.$.stroke.value.should.equal(0.5);

    expect(stroke.speed).to.equal(speed);
    expect(stroke.duration).to.equal(duration);
    stroke.top.should.equal(top);
    stroke.bottom.should.equal(bottom);
  };

  /**
   * Performs the specified stroke and checks that ayva.move() was called with the expected move.
   */
  const testStroke = async function (stroke, expectedMove, index = 0) {
    await stroke.perform(ayva); // Generate stroke.
    await stroke.perform(ayva); // Perform stroke.

    ayva.move.args[index][0].should.deep.equal(expectedMove);
    ayva.$.stroke.value.should.equal(expectedMove.to);
  };

  /**
   * Calls testStroke() for more than one expected move.
   */
  const testStrokes = async function (stroke, expectedMoves, index = 0) {
    for (let i = 0; i < expectedMoves.length; i++) {
      await testStroke(stroke, expectedMoves[i], i + index);
    }
  };

  /**
   * Given a classic stroke, performs 'count' down/up strokes and verifies that the ayva.move()
   * was called with the correct parameters.
   */
  const verifyStroke = async function (stroke, bottom, top, speed, ramp, count = 10) {
    const expectedDownStroke = { to: bottom, speed, value: ramp };
    const expectedUpStroke = { to: top, speed, value: ramp };

    verifyStart(stroke, bottom, top, speed);

    const expected = [];

    for (let i = 0; i < count; i++) {
      expected.push(expectedDownStroke, expectedUpStroke);
    }

    await testStrokes(stroke, expected);
  };

  beforeEach(function () {
    ayva = new Ayva(createTestConfig());
    ayva.addOutputDevice({ write: sinon.fake() });
    sinon.replace(ayva, 'sleep', sinon.fake.returns(Promise.resolve()));
    sinon.replace(ayva, 'move', sinon.fake(ayva.move));
  });

  afterEach(function () {
    sinon.restore();
  });

  describe('valid strokes', function () {
    it('should stroke with default from, to, speed, and ramp', async function () {
      const stroke = new ClassicStroke();
      await verifyStroke(stroke, 0, 1, 1, Ayva.RAMP_COS);
    });

    it('should stroke with default to, speed, and ramp', async function () {
      const stroke = new ClassicStroke(0.25);
      await verifyStroke(stroke, 0.25, 1, 1, Ayva.RAMP_COS);
    });

    it('should stroke with default speed and ramp', async function () {
      const stroke = new ClassicStroke(0.25, 0.75);
      await verifyStroke(stroke, 0.25, 0.75, 1, Ayva.RAMP_COS);
    });

    it('should stroke with default ramp', async function () {
      const stroke = new ClassicStroke(0.25, 0.75, 2);
      await verifyStroke(stroke, 0.25, 0.75, 2, Ayva.RAMP_COS);
    });

    it('should stroke with specified parameters', async function () {
      const stroke = new ClassicStroke(0.25, 0.75, 2, Ayva.RAMP_PARABOLIC);
      await verifyStroke(stroke, 0.25, 0.75, 2, Ayva.RAMP_PARABOLIC);
    });

    it('should allow passing a config object', async function () {
      const stroke = new ClassicStroke({
        bottom: 0.25,
        top: 0.75,
        speed: 2,
        shape: Ayva.RAMP_PARABOLIC,
      });
      await verifyStroke(stroke, 0.25, 0.75, 2, Ayva.RAMP_PARABOLIC);
    });

    it('should stroke to the top if the last movement was down', async function () {
      const expectedUpStroke = { to: 1, speed: 1, value: Ayva.RAMP_COS };
      ayva.$.stroke.value.should.equal(0.5);

      await ayva.$.stroke(0.25, 1).execute();
      await testStroke(new ClassicStroke(), expectedUpStroke, 1);
    });

    it('should allow providing bottom, top, and speed of stroke with functions', async function () {
      const bottomValues = [0.1, 0.2, 0.3];
      const topValues = [0.9, 0.8, 0.7];
      const speedValues = [0.5, 1, 1.5, 2, 2.5, 3];
      const bottom = (index) => bottomValues[index];
      const top = (index) => topValues[index];
      const speed = (index) => speedValues[index];
      const ramp = Ayva.RAMP_COS;

      const stroke = new ClassicStroke(bottom, top, speed);
      const expectedStrokes = [
        { to: bottomValues[0], speed: speedValues[0], value: ramp },
        { to: topValues[0], speed: speedValues[1], value: ramp },
        { to: bottomValues[1], speed: speedValues[2], value: ramp },
        { to: topValues[1], speed: speedValues[3], value: ramp },
        { to: bottomValues[2], speed: speedValues[4], value: ramp },
        { to: topValues[2], speed: speedValues[5], value: ramp },
      ];

      verifyStart(stroke, bottomValues[0], topValues[0], speedValues[0]);

      await testStrokes(stroke, expectedStrokes);
    });

    it('should allow providing bottom, top, and speed as an array', async function () {
      const bottomValues = [0.1, 0.2, 0.3];
      const topValues = [0.9, 0.8, 0.7];
      const speedValues = [0.5, 1, 1.5, 2, 2.5, 3];
      const ramp = Ayva.RAMP_COS;

      const stroke = new ClassicStroke(bottomValues, topValues, speedValues);
      const expectedStrokes = [
        { to: bottomValues[0], speed: speedValues[0], value: ramp },
        { to: topValues[0], speed: speedValues[1], value: ramp },
        { to: bottomValues[1], speed: speedValues[2], value: ramp },
        { to: topValues[1], speed: speedValues[3], value: ramp },
        { to: bottomValues[2], speed: speedValues[4], value: ramp },
        { to: topValues[2], speed: speedValues[5], value: ramp },
      ];

      verifyStart(stroke, bottomValues[0], topValues[0], speedValues[0]);

      await testStrokes(stroke, expectedStrokes);
    });

    it('should allow providing shape of stroke with array', async function () {
      const shapeValues = [Ayva.RAMP_COS, Ayva.RAMP_PARABOLIC, Ayva.RAMP_NEGATIVE_PARABOLIC, Ayva.RAMP_LINEAR];
      const top = 1;
      const speed = 1;
      const bottom = 0;
      const stroke = new ClassicStroke(bottom, top, speed, shapeValues);

      const expectedStrokes = [
        { to: 0, speed, value: shapeValues[1] },
        { to: 1, speed, value: shapeValues[2] },
        { to: 0, speed, value: shapeValues[3] },
        { to: 1, speed, value: shapeValues[0] },
      ];

      verifyStart(stroke, bottom, top, speed);

      await testStrokes(stroke, expectedStrokes);
    });

    it('should allow providing relative speeds with an array', async function () {
      const relativeSpeeds = [0.125, 0.25, 0.5, 0.75];

      const speed = 2;
      const stroke = new ClassicStroke({
        speed,
        relativeSpeeds,
      });

      const expectedStrokes = [
        { to: 0, speed: relativeSpeeds[1] * speed, value: Ayva.RAMP_COS },
        { to: 1, speed: relativeSpeeds[2] * speed, value: Ayva.RAMP_COS },
        { to: 0, speed: relativeSpeeds[3] * speed, value: Ayva.RAMP_COS },
        { to: 1, speed: relativeSpeeds[0] * speed, value: Ayva.RAMP_COS },
      ];

      verifyStart(stroke, 0, 1, speed);

      await testStrokes(stroke, expectedStrokes);
    });

    it('should map up strokes to even and down strokes to odd relative speeds', async function () {
      const relativeSpeeds = [0.125, 0.25, 0.5, 0.75];

      const speed = 2;
      const stroke = new ClassicStroke({
        speed,
        relativeSpeeds,
      });

      const expectedStrokes = [
        { to: 1, speed: relativeSpeeds[0] * speed, value: Ayva.RAMP_COS },
        { to: 0, speed: relativeSpeeds[1] * speed, value: Ayva.RAMP_COS },
        { to: 1, speed: relativeSpeeds[2] * speed, value: Ayva.RAMP_COS },
        { to: 0, speed: relativeSpeeds[3] * speed, value: Ayva.RAMP_COS },
      ];

      verifyStart(stroke, 0, 1, speed);

      await ayva.$.stroke(0.25, 1).execute();

      await testStrokes(stroke, expectedStrokes, 1);

      await ayva.$.stroke(0.25, 1).execute();

      await testStroke(stroke, expectedStrokes[1], 6); // Should skip to the next down speed appropriately
    });

    it('should map up strokes to even and down strokes to odd stroke shapes', async function () {
      const shapeValues = [Ayva.RAMP_COS, Ayva.RAMP_PARABOLIC, Ayva.RAMP_NEGATIVE_PARABOLIC, Ayva.RAMP_LINEAR];

      const top = 1;
      const speed = 1;
      const bottom = 0;
      const stroke = new ClassicStroke(bottom, top, speed, shapeValues);

      const expectedStrokes = [
        { to: 1, speed, value: shapeValues[0] },
        { to: 0, speed, value: shapeValues[1] },
        { to: 1, speed, value: shapeValues[2] },
        { to: 0, speed, value: shapeValues[3] },
      ];

      verifyStart(stroke, bottom, top, speed);

      await ayva.$.stroke(0.25, 1).execute();

      await testStrokes(stroke, [...expectedStrokes, expectedStrokes[0]], 1);

      await ayva.$.stroke(0.25, 1).execute();

      await testStroke(stroke, expectedStrokes[2], 7); // Should skip to the next up shape appropriately.
    });

    it('should not freeze up when travelling to a position its already at (up)', async function () {
      const stroke = new ClassicStroke(0.5, 0.75);

      const expectedStrokes = [
        { to: 0.75, speed: 1, value: Ayva.RAMP_COS },
        { to: 0.5, speed: 1, value: Ayva.RAMP_COS },
        { to: 0.75, speed: 1, value: Ayva.RAMP_COS },
        { to: 0.5, speed: 1, value: Ayva.RAMP_COS },
      ];

      verifyStart(stroke, 0.5, 0.75, 1);

      await testStrokes(stroke, expectedStrokes);
    });

    it('should not freeze up when travelling to a position its already at (down)', async function () {
      const stroke = new ClassicStroke(0.25, 0.5);

      const expectedStrokes = [
        { to: 0.5, speed: 1, value: Ayva.RAMP_COS },
        { to: 0.25, speed: 1, value: Ayva.RAMP_COS },
        { to: 0.5, speed: 1, value: Ayva.RAMP_COS },
        { to: 0.25, speed: 1, value: Ayva.RAMP_COS },
      ];

      verifyStart(stroke, 0.25, 0.5, 1);

      await ayva.$.stroke(0.75, 1).execute();
      await ayva.$.stroke(0.45, 1).execute();

      await testStrokes(stroke, expectedStrokes, 2);
    });

    it('should handle very small strokes', async function () {
      const stroke = new ClassicStroke(0.5, 0.51);

      const expectedStrokes = [
        { to: 0.51, speed: 1, value: Ayva.RAMP_COS },
        { to: 0.5, speed: 1, value: Ayva.RAMP_COS },
        { to: 0.51, speed: 1, value: Ayva.RAMP_COS },
        { to: 0.5, speed: 1, value: Ayva.RAMP_COS },
      ];

      verifyStart(stroke, 0.5, 0.51, 1);

      await testStrokes(stroke, expectedStrokes);
    });

    describe('with twist and pitch', async function () {
      const testAxis = async function (axis, config) {
        const stroke = new ClassicStroke({
          ...config,
          [axis]: {
            from: 0.25,
            to: 1,
          },
        });

        await stroke.perform(ayva); // Generate stroke.
        await stroke.perform(ayva); // Perform stroke.

        ayva.move.callCount.should.equal(1);
        let move = ayva.move.args[0][1];

        // When starting off axis, should just do a move towards the on-axis position.
        move.axis.should.equal(axis);
        move.to.should.equal(0.25);
        move.value.should.equal(Ayva.RAMP_COS);
        ayva.$[axis].value.should.equal(0.25);

        await stroke.perform(ayva);
        await stroke.perform(ayva);

        ayva.move.callCount.should.equal(2);
        move = ayva.move.args[1][1]; // eslint-disable-line prefer-destructuring

        move.axis.should.equal(axis);
        move.value.should.be.a('function');
        move.value.from.should.equal(0.25);
        move.value.to.should.equal(1);
        move.value.phase.should.equal(0);
        move.value.ecc.should.equal(0);
        move.value.bpm.should.equal(30);

        round(ayva.$[axis].value, 2).should.equal(1);
      };

      it('should work with speed (twist)', async function () {
        await testAxis('twist', {});
      });

      it('should work with duration (twist)', async function () {
        await testAxis('twist', { duration: 1 });
      });

      it('should work with speed (pitch)', async function () {
        await testAxis('pitch', {});
      });

      it('should work with duration (pitch)', async function () {
        await testAxis('pitch', { duration: 1 });
      });
    });

    it('should allow suck algorithm', async function () {
      const write = sinon.fake();
      ayva.addOutputDevice({ write });

      const stroke = new ClassicStroke({
        suck: 0.3,
      });

      ayva.$.suck.value.should.equal(0.5);

      await stroke.perform(ayva);

      ayva.$.suck.value.should.equal(0.3);

      write.callCount.should.equal(1);
      write.args[0][0].should.equal('A13000\n');
    });

    it('should allow specifying duration instead of speed', async function () {
      const stroke = new ClassicStroke({
        duration: 1,
      });

      const expectedStrokes = [
        { to: 0, duration: 1, value: Ayva.RAMP_COS },
        { to: 1, duration: 1, value: Ayva.RAMP_COS },
        { to: 0, duration: 1, value: Ayva.RAMP_COS },
        { to: 1, duration: 1, value: Ayva.RAMP_COS },
      ];

      verifyStart(stroke, 0, 1, undefined, 1);

      await testStrokes(stroke, expectedStrokes);
    });

    it('should allow specifying duration with array', async function () {
      const stroke = new ClassicStroke({
        duration: [0.25, 0.5, 0.75, 1],
      });

      const expectedStrokes = [
        { to: 0, duration: 0.25, value: Ayva.RAMP_COS },
        { to: 1, duration: 0.5, value: Ayva.RAMP_COS },
        { to: 0, duration: 0.75, value: Ayva.RAMP_COS },
        { to: 1, duration: 1, value: Ayva.RAMP_COS },
        { to: 0, duration: 0.25, value: Ayva.RAMP_COS },
      ];

      verifyStart(stroke, 0, 1, undefined, 0.25);

      await testStrokes(stroke, expectedStrokes);
    });

    it('should allow specifying duration with function', async function () {
      const durations = [0.25, 0.5, 0.75, 1];
      const stroke = new ClassicStroke({
        duration: (index) => durations[index % durations.length],
      });

      const expectedStrokes = [
        { to: 0, duration: 0.25, value: Ayva.RAMP_COS },
        { to: 1, duration: 0.5, value: Ayva.RAMP_COS },
        { to: 0, duration: 0.75, value: Ayva.RAMP_COS },
        { to: 1, duration: 1, value: Ayva.RAMP_COS },
        { to: 0, duration: 0.25, value: Ayva.RAMP_COS },
      ];

      verifyStart(stroke, 0, 1, undefined, 0.25);

      await testStrokes(stroke, expectedStrokes);
    });
  });

  describe('invalid strokes', function () {
    const testCreateStroke = function (...args) {
      return function () {
        new ClassicStroke(...args);
      };
    };

    it('should throw an error if parameters are invalid', function () {
      testCreateStroke(0, 0).should.throw('Invalid stroke range specified: (0, 0)');

      ['', NaN, Infinity, true, false].forEach((value) => {
        testCreateStroke(value).should.throw(`Invalid stroke bottom: ${value}`);
        testCreateStroke(0, value).should.throw(`Invalid stroke top: ${value}`);
        testCreateStroke(0, 1, value).should.throw(`Invalid stroke speed: ${value}`);
        testCreateStroke(0, 1, 1, value).should.throw(`Invalid stroke shape: ${value}`);

        ['twist', 'pitch'].forEach((axis) => {
          testCreateStroke({
            [axis]: value,
          }).should.throw(`Invalid stroke ${axis}: ${value}`);

          testCreateStroke({
            [axis]: {
              from: value,
              to: 1,
            },
          }).should.throw(`Invalid stroke ${axis} from: ${value}`);

          testCreateStroke({
            [axis]: {
              from: 1,
              to: value,
            },
          }).should.throw(`Invalid stroke ${axis} to: ${value}`);

          testCreateStroke({
            [axis]: {
              from: 1,
              to: 0,
              phase: value,
            },
          }).should.throw(`Invalid stroke ${axis} phase: ${value}`);
        });

        testCreateStroke({
          suck: value,
        }).should.throw(`Invalid stroke suck: ${value}`);

        testCreateStroke({
          relativeSpeeds: value,
        }).should.throw(`Invalid stroke relative speeds: ${value}`);

        testCreateStroke({
          relativeSpeeds: [value, value],
        }).should.throw(`Invalid stroke relative speed: ${value}`);

        testCreateStroke({
          duration: value,
        }).should.throw(`Invalid stroke duration: ${value}`);
      });

      testCreateStroke({
        twist: {},
      }).should.throw('Invalid stroke twist from: undefined');
    });

    it('should throw an error if parameters are out of bounds', function () {
      testCreateStroke(-1).should.throw('Invalid stroke bottom: -1');
      testCreateStroke(2).should.throw('Invalid stroke bottom: 2');
      testCreateStroke(0, -1).should.throw('Invalid stroke top: -1');
      testCreateStroke(0, 2).should.throw('Invalid stroke top: 2');
      testCreateStroke(0, 1, 0).should.throw('Invalid stroke speed: 0');
      testCreateStroke(0, 1, -1).should.throw('Invalid stroke speed: -1');
    });

    it('should throw an error if shape is invalid', function () {
      testCreateStroke(0, 1, 1, []).should.throw('Missing stroke shape.');
      testCreateStroke(0, 1, 1, [Ayva.RAMP_COS]).should.throw('Must specify an even number of stroke shapes.');

      ['', NaN, Infinity, true, false, {}].forEach((value) => {
        testCreateStroke(0, 1, 1, [value, value]).should.throw(`Invalid stroke shape: ${value}`);
      });
    });

    it('should throw an error if relative speeds are invalid', function () {
      testCreateStroke({
        relativeSpeeds: [1],
      }).should.throw('Must specify an even number of relative speeds.');
    });

    it('should throw error if both speed and duration are specified', function () {
      testCreateStroke({
        speed: 1,
        duration: 1,
      }).should.throw('Cannot specify both a speed and duration');
    });
  });
});
