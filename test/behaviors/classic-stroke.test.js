/* eslint-disable no-new, no-await-in-loop */
import '../setup-chai.js';
import sinon from 'sinon';
import Ayva from '../../src/ayva.js';
import ClassicStroke from '../../src/behaviors/classic-stroke.js';
import { createTestConfig } from '../test-helpers.js';
import { round } from '../../src/util/util.js';

describe('Classic Stroke Tests', function () {
  let ayva;

  const verifyStroke = async function (index, stroke, expectedMove) {
    await stroke.perform(ayva); // Generate stroke.
    await stroke.perform(ayva); // Perform stroke.

    ayva.move.args[index][0].should.deep.equal(expectedMove);
    ayva.$.stroke.value.should.equal(expectedMove.to);
  };

  const verifyStrokes = async function (stroke, expectedMoves, indexOffset = 0) {
    for (let i = 0; i < expectedMoves.length; i++) {
      await verifyStroke(i + indexOffset, stroke, expectedMoves[i]);
    }
  };

  const verifyStrokeSequence = async function (stroke, bottom, top, speed, ramp) {
    const expectedDownStroke = { to: bottom, speed, value: ramp };
    const expectedUpStroke = { to: top, speed, value: ramp };
    ayva.$.stroke.value.should.equal(0.5);

    stroke.speed.should.equal(speed);
    stroke.top.should.equal(top);
    stroke.bottom.should.equal(bottom);

    await verifyStrokes(stroke, [
      expectedDownStroke,
      expectedUpStroke,
      expectedDownStroke,
      expectedUpStroke,
      expectedDownStroke,
      expectedUpStroke,
    ]);
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
      await verifyStrokeSequence(new ClassicStroke(), 0, 1, 1, Ayva.RAMP_COS);
    });

    it('should stroke with default to, speed, and ramp', async function () {
      await verifyStrokeSequence(new ClassicStroke(0.25), 0.25, 1, 1, Ayva.RAMP_COS);
    });

    it('should stroke with default speed and ramp', async function () {
      await verifyStrokeSequence(new ClassicStroke(0.25, 0.75), 0.25, 0.75, 1, Ayva.RAMP_COS);
    });

    it('should stroke with default ramp', async function () {
      await verifyStrokeSequence(new ClassicStroke(0.25, 0.75, 2), 0.25, 0.75, 2, Ayva.RAMP_COS);
    });

    it('should stroke with specified parameters', async function () {
      await verifyStrokeSequence(new ClassicStroke(0.25, 0.75, 2, Ayva.RAMP_PARABOLIC), 0.25, 0.75, 2, Ayva.RAMP_PARABOLIC);
    });

    it('should allow passing a config object', async function () {
      await verifyStrokeSequence(new ClassicStroke({
        bottom: 0.25,
        top: 0.75,
        speed: 2,
        shape: Ayva.RAMP_PARABOLIC,
      }), 0.25, 0.75, 2, Ayva.RAMP_PARABOLIC);
    });

    it('should stroke to the top if the last movement was down', async function () {
      const expectedUpStroke = { to: 1, speed: 1, value: Ayva.RAMP_COS };
      ayva.$.stroke.value.should.equal(0.5);

      await ayva.$.stroke(0.25, 1).execute();
      await verifyStroke(1, new ClassicStroke(), expectedUpStroke);
    });

    it('should allow providing bottom of stroke with function', async function () {
      const bottomValues = [0, 0.1, 0.2];
      const top = 1;
      const speed = 1;
      const ramp = Ayva.RAMP_COS;
      const bottom = (index) => bottomValues[index];

      const stroke = new ClassicStroke(bottom);

      const expectedUpStroke = { to: top, speed, value: ramp };

      const expectedStrokes = [
        { to: bottomValues[0], speed, value: ramp }, expectedUpStroke,
        { to: bottomValues[1], speed, value: ramp }, expectedUpStroke,
        { to: bottomValues[2], speed, value: ramp },
      ];

      ayva.$.stroke.value.should.equal(0.5);

      stroke.speed.should.equal(speed);
      stroke.top.should.equal(top);
      stroke.bottom.should.equal(bottomValues[0]);

      await verifyStrokes(stroke, expectedStrokes);
    });

    it('should allow providing bottom and top of stroke with function', async function () {
      const bottomValues = [0.1, 0.2, 0.3];
      const topValues = [0.9, 0.8, 0.7];
      const top = (index) => topValues[index];
      const speed = 1;
      const ramp = Ayva.RAMP_COS;
      const bottom = (index) => bottomValues[index];

      const stroke = new ClassicStroke(bottom, top);
      const expectedStrokes = [
        { to: bottomValues[0], speed, value: ramp },
        { to: topValues[0], speed, value: ramp },
        { to: bottomValues[1], speed, value: ramp },
        { to: topValues[1], speed, value: ramp },
        { to: bottomValues[2], speed, value: ramp },
        { to: topValues[2], speed, value: ramp },
      ];

      ayva.$.stroke.value.should.equal(0.5);

      stroke.speed.should.equal(speed);
      stroke.top.should.equal(topValues[0]);
      stroke.bottom.should.equal(bottomValues[0]);

      await verifyStrokes(stroke, expectedStrokes);
    });

    it('should allow providing speed with function', async function () {
      const speedValues = [0.5, 1, 1.5, 2, 2.5, 3];
      const top = 1;
      const bottom = 0;
      const speed = (index) => speedValues[index];
      const ramp = Ayva.RAMP_COS;

      const stroke = new ClassicStroke(bottom, top, speed);

      const expectedStrokes = [
        { to: bottom, speed: speedValues[0], value: ramp },
        { to: top, speed: speedValues[1], value: ramp },
        { to: bottom, speed: speedValues[2], value: ramp },
        { to: top, speed: speedValues[3], value: ramp },
        { to: bottom, speed: speedValues[4], value: ramp },
        { to: top, speed: speedValues[5], value: ramp },
      ];

      ayva.$.stroke.value.should.equal(0.5);

      stroke.speed.should.equal(speedValues[0]);
      stroke.top.should.equal(top);
      stroke.bottom.should.equal(bottom);

      await verifyStrokes(stroke, expectedStrokes);
    });

    it('should allow providing bottom, top, and speed as an array', async function () {
      const bottomValues = [0.1, 0.2, 0.3];
      const topValues = [0.9, 0.8];
      const speedValues = [0.5, 1, 1.5, 2, 2.5, 3];
      const ramp = Ayva.RAMP_COS;

      const stroke = new ClassicStroke(bottomValues, topValues, speedValues);
      const expectedStrokes = [
        { to: bottomValues[0], speed: speedValues[0], value: ramp },
        { to: topValues[0], speed: speedValues[1], value: ramp },
        { to: bottomValues[1], speed: speedValues[2], value: ramp },
        { to: topValues[1], speed: speedValues[3], value: ramp },
        { to: bottomValues[2], speed: speedValues[4], value: ramp },
        { to: topValues[0], speed: speedValues[5], value: ramp },
      ];

      ayva.$.stroke.value.should.equal(0.5);

      stroke.speed.should.equal(speedValues[0]);
      stroke.top.should.equal(topValues[0]);
      stroke.bottom.should.equal(bottomValues[0]);

      await verifyStrokes(stroke, expectedStrokes);
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

      ayva.$.stroke.value.should.equal(0.5);

      stroke.speed.should.equal(speed);
      stroke.top.should.equal(top);
      stroke.bottom.should.equal(bottom);

      await verifyStrokes(stroke, expectedStrokes);
    });

    it('should allow providing relative speeds with an array', async function () {
      const relativeSpeeds = [0.125, 0.25, 0.5, 0.75];

      const speed = 2;
      const stroke = new ClassicStroke({
        speed,
        relativeSpeeds,
      });

      const expectedSpeeds = [
        relativeSpeeds[1] * speed,
        relativeSpeeds[2] * speed,
        relativeSpeeds[3] * speed,
        relativeSpeeds[0] * speed,
      ];

      const expectedStrokes = [
        { to: 0, speed: expectedSpeeds[0], value: Ayva.RAMP_COS },
        { to: 1, speed: expectedSpeeds[1], value: Ayva.RAMP_COS },
        { to: 0, speed: expectedSpeeds[2], value: Ayva.RAMP_COS },
        { to: 1, speed: expectedSpeeds[3], value: Ayva.RAMP_COS },
      ];

      ayva.$.stroke.value.should.equal(0.5);

      stroke.speed.should.equal(speed);
      stroke.top.should.equal(1);
      stroke.bottom.should.equal(0);

      await verifyStrokes(stroke, expectedStrokes);
    });

    it('should map up strokes to even and down strokes to odd relative speeds', async function () {
      // TODO: Some of these tests are a little hard to follow. Cleanup.
      const relativeSpeeds = [0.125, 0.25, 0.5, 0.75];

      const speed = 2;
      const stroke = new ClassicStroke({
        speed,
        relativeSpeeds,
      });

      const expectedSpeeds = [
        relativeSpeeds[0] * speed,
        relativeSpeeds[1] * speed,
        relativeSpeeds[2] * speed,
        relativeSpeeds[3] * speed,
      ];

      const expectedStrokes = [
        { to: 1, speed: expectedSpeeds[0], value: Ayva.RAMP_COS },
        { to: 0, speed: expectedSpeeds[1], value: Ayva.RAMP_COS },
        { to: 1, speed: expectedSpeeds[2], value: Ayva.RAMP_COS },
        { to: 0, speed: expectedSpeeds[3], value: Ayva.RAMP_COS },
      ];

      ayva.$.stroke.value.should.equal(0.5);

      stroke.speed.should.equal(speed);
      stroke.top.should.equal(1);
      stroke.bottom.should.equal(0);

      await ayva.$.stroke(0.25, 1).execute();

      await verifyStrokes(stroke, expectedStrokes, 1);

      await ayva.$.stroke(0.25, 1).execute();

      await verifyStroke(6, stroke, expectedStrokes[1]); // Should skip to the next down speed appropriately
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

      ayva.$.stroke.value.should.equal(0.5);

      stroke.speed.should.equal(speed);
      stroke.top.should.equal(top);
      stroke.bottom.should.equal(bottom);

      await ayva.$.stroke(0.25, 1).execute();

      await verifyStroke(1, stroke, expectedStrokes[0]);
      await verifyStroke(2, stroke, expectedStrokes[1]);
      await verifyStroke(3, stroke, expectedStrokes[2]);
      await verifyStroke(4, stroke, expectedStrokes[3]);
      await verifyStroke(5, stroke, expectedStrokes[0]);

      await ayva.$.stroke(0.25, 1).execute();

      await verifyStroke(7, stroke, expectedStrokes[2]); // Should skip to the next up shape appropriately.
    });

    it('should not freeze up when travelling to a position its already at (up)', async function () {
      const stroke = new ClassicStroke(0.5, 0.75);

      const expectedStrokes = [
        { to: 0.75, speed: 1, value: Ayva.RAMP_COS },
        { to: 0.5, speed: 1, value: Ayva.RAMP_COS },
        { to: 0.75, speed: 1, value: Ayva.RAMP_COS },
        { to: 0.5, speed: 1, value: Ayva.RAMP_COS },
      ];

      ayva.$.stroke.value.should.equal(0.5);

      stroke.speed.should.equal(1);
      stroke.top.should.equal(0.75);
      stroke.bottom.should.equal(0.5);

      await verifyStrokes(stroke, expectedStrokes);
    });

    it('should not freeze up when travelling to a position its already at (down)', async function () {
      const stroke = new ClassicStroke(0.25, 0.5);

      const expectedStrokes = [
        { to: 0.5, speed: 1, value: Ayva.RAMP_COS },
        { to: 0.25, speed: 1, value: Ayva.RAMP_COS },
        { to: 0.5, speed: 1, value: Ayva.RAMP_COS },
        { to: 0.25, speed: 1, value: Ayva.RAMP_COS },
      ];

      ayva.$.stroke.value.should.equal(0.5);

      stroke.speed.should.equal(1);
      stroke.top.should.equal(0.5);
      stroke.bottom.should.equal(0.25);

      await ayva.$.stroke(0.75, 1).execute();
      await ayva.$.stroke(0.45, 1).execute();

      await verifyStrokes(stroke, expectedStrokes, 2);
    });

    it('should handle very small strokes', async function () {
      const stroke = new ClassicStroke(0.5, 0.51);

      const expectedStrokes = [
        { to: 0.51, speed: 1, value: Ayva.RAMP_COS },
        { to: 0.5, speed: 1, value: Ayva.RAMP_COS },
        { to: 0.51, speed: 1, value: Ayva.RAMP_COS },
        { to: 0.5, speed: 1, value: Ayva.RAMP_COS },
      ];

      ayva.$.stroke.value.should.equal(0.5);

      stroke.speed.should.equal(1);
      stroke.top.should.equal(0.51);
      stroke.bottom.should.equal(0.5);

      await verifyStrokes(stroke, expectedStrokes);
    });

    it('should allow twist', async function () {
      const stroke = new ClassicStroke({
        twist: {
          from: 0.25,
          to: 1,
        },
      });

      await stroke.perform(ayva); // Generate stroke.
      await stroke.perform(ayva); // Perform stroke.

      ayva.move.callCount.should.equal(1);
      let move = ayva.move.args[0][1];

      // When starting off axis, should just do a move towards the on-axis position.
      move.axis.should.equal('twist');
      move.to.should.equal(0.25);
      move.value.should.equal(Ayva.RAMP_COS);
      ayva.$.twist.value.should.equal(0.25);

      await stroke.perform(ayva);
      await stroke.perform(ayva);

      ayva.move.callCount.should.equal(2);
      move = ayva.move.args[1][1]; // eslint-disable-line prefer-destructuring

      move.axis.should.equal('twist');
      move.value.should.be.a('function');
      move.value.from.should.equal(0.25);
      move.value.to.should.equal(1);
      move.value.phase.should.equal(0);
      move.value.ecc.should.equal(0);
      move.value.bpm.should.equal(30);

      round(ayva.$.twist.value, 2).should.equal(1);
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
        testCreateStroke({
          twist: value,
        }).should.throw(`Invalid stroke twist: ${value}`);

        testCreateStroke({
          twist: {
            from: value,
            to: 1,
          },
        }).should.throw(`Invalid stroke twist from: ${value}`);

        testCreateStroke({
          twist: {
            from: 1,
            to: value,
          },
        }).should.throw(`Invalid stroke twist to: ${value}`);

        testCreateStroke({
          twist: {
            from: 1,
            to: 0,
            phase: value,
          },
        }).should.throw(`Invalid stroke twist phase: ${value}`);

        testCreateStroke({
          suck: value,
        }).should.throw(`Invalid stroke suck: ${value}`);

        testCreateStroke({
          relativeSpeeds: value,
        }).should.throw(`Invalid stroke relative speeds: ${value}`);

        testCreateStroke({
          relativeSpeeds: [value, value],
        }).should.throw(`Invalid stroke relative speed: ${value}`);
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
  });
});
