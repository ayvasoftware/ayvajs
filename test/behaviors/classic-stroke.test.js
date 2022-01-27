/* eslint-disable no-new */
import '../setup-chai.js';
import sinon from 'sinon';
import Ayva from '../../src/ayva.js';
import ClassicStroke from '../../src/behaviors/classic-stroke.js';
import { createTestConfig } from '../test-helpers.js';

describe('Classic Stroke Tests', function () {
  let ayva;

  const verifyStroke = async function (stroke, bottom, top, speed, ramp) {
    const expectedDownStroke = { to: bottom, speed, value: ramp };
    const expectedUpStroke = { to: top, speed, value: ramp };
    ayva.$.stroke.value.should.equal(0.5);

    stroke.speed.should.equal(speed);
    stroke.top.should.equal(top);
    stroke.bottom.should.equal(bottom);

    await stroke.perform(ayva); // Generate stroke.
    await stroke.perform(ayva); // Perform stroke.

    ayva.move.callCount.should.equal(1);
    ayva.move.args[0][0].should.deep.equal(expectedDownStroke);
    ayva.$.stroke.value.should.equal(bottom);

    await stroke.perform(ayva);
    await stroke.perform(ayva);

    ayva.move.callCount.should.equal(2);
    ayva.move.args[1][0].should.deep.equal(expectedUpStroke);
    ayva.$.stroke.value.should.equal(top);

    await stroke.perform(ayva);
    await stroke.perform(ayva);

    ayva.move.callCount.should.equal(3);
    ayva.move.args[2][0].should.deep.equal(expectedDownStroke);
    ayva.$.stroke.value.should.equal(bottom);
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
      await verifyStroke(new ClassicStroke(), 0, 1, 1, Ayva.RAMP_COS);
    });

    it('should stroke with default to, speed, and ramp', async function () {
      await verifyStroke(new ClassicStroke(0.25), 0.25, 1, 1, Ayva.RAMP_COS);
    });

    it('should stroke with default speed and ramp', async function () {
      await verifyStroke(new ClassicStroke(0.25, 0.75), 0.25, 0.75, 1, Ayva.RAMP_COS);
    });

    it('should stroke with default ramp', async function () {
      await verifyStroke(new ClassicStroke(0.25, 0.75, 2), 0.25, 0.75, 2, Ayva.RAMP_COS);
    });

    it('should stroke with specified parameters', async function () {
      await verifyStroke(new ClassicStroke(0.25, 0.75, 2, Ayva.RAMP_PARABOLIC), 0.25, 0.75, 2, Ayva.RAMP_PARABOLIC);
    });

    it('should stroke to the top if the last movement was down', async function () {
      const expectedUpStroke = { to: 1, speed: 1, value: Ayva.RAMP_COS };
      ayva.$.stroke.value.should.equal(0.5);

      await ayva.$.stroke(0.25, 1).execute();

      const stroke = new ClassicStroke();

      await stroke.perform(ayva); // Generate stroke.
      await stroke.perform(ayva); // Perform stroke.

      ayva.move.callCount.should.equal(2);
      ayva.move.args[1][0].should.deep.equal(expectedUpStroke);
      ayva.$.stroke.value.should.equal(1);
    });

    // TODO: The next few tests are very similar... Thou shalt not repeat thyself?

    it('should allow providing bottom of stroke with function', async function () {
      const bottomValues = [0, 0.1, 0.2];
      const top = 1;
      const speed = 1;
      const ramp = Ayva.RAMP_COS;
      const bottom = (index) => bottomValues[index];

      const stroke = new ClassicStroke(bottom);

      const expectedDownStrokes = [
        { to: bottomValues[0], speed, value: ramp },
        { to: bottomValues[1], speed, value: ramp },
        { to: bottomValues[2], speed, value: ramp },
      ];

      const expectedUpStroke = { to: top, speed, value: ramp };
      ayva.$.stroke.value.should.equal(0.5);

      stroke.speed.should.equal(speed);
      stroke.top.should.equal(top);
      stroke.bottom.should.equal(bottomValues[0]);

      await stroke.perform(ayva); // Generate stroke.
      await stroke.perform(ayva); // Perform stroke.

      ayva.move.callCount.should.equal(1);
      ayva.move.args[0][0].should.deep.equal(expectedDownStrokes[0]);
      ayva.$.stroke.value.should.equal(bottomValues[0]);

      await stroke.perform(ayva);
      await stroke.perform(ayva);

      ayva.move.callCount.should.equal(2);
      ayva.move.args[1][0].should.deep.equal(expectedUpStroke);
      ayva.$.stroke.value.should.equal(top);

      await stroke.perform(ayva);
      await stroke.perform(ayva);

      ayva.move.callCount.should.equal(3);
      ayva.move.args[2][0].should.deep.equal(expectedDownStrokes[1]);
      ayva.$.stroke.value.should.equal(bottomValues[1]);

      await stroke.perform(ayva);
      await stroke.perform(ayva);

      ayva.move.callCount.should.equal(4);
      ayva.move.args[3][0].should.deep.equal(expectedUpStroke);
      ayva.$.stroke.value.should.equal(top);

      await stroke.perform(ayva);
      await stroke.perform(ayva);

      ayva.move.callCount.should.equal(5);
      ayva.move.args[4][0].should.deep.equal(expectedDownStrokes[2]);
      ayva.$.stroke.value.should.equal(bottomValues[2]);
    });

    it('should allow providing bottom and top of stroke with function', async function () {
      const bottomValues = [0.1, 0.2, 0.3];
      const topValues = [0.9, 0.8, 0.7];
      const top = (index) => topValues[index];
      const speed = 1;
      const ramp = Ayva.RAMP_COS;
      const bottom = (index) => bottomValues[index];

      const stroke = new ClassicStroke(bottom, top);

      const expectedDownStrokes = [
        { to: bottomValues[0], speed, value: ramp },
        { to: bottomValues[1], speed, value: ramp },
        { to: bottomValues[2], speed, value: ramp },
      ];

      const expectedUpStrokes = [
        { to: topValues[0], speed, value: ramp },
        { to: topValues[1], speed, value: ramp },
        { to: topValues[2], speed, value: ramp },
      ];

      ayva.$.stroke.value.should.equal(0.5);

      stroke.speed.should.equal(speed);
      stroke.top.should.equal(topValues[0]);
      stroke.bottom.should.equal(bottomValues[0]);

      await stroke.perform(ayva); // Generate stroke.
      await stroke.perform(ayva); // Perform stroke.

      ayva.move.callCount.should.equal(1);
      ayva.move.args[0][0].should.deep.equal(expectedDownStrokes[0]);
      ayva.$.stroke.value.should.equal(bottomValues[0]);

      await stroke.perform(ayva);
      await stroke.perform(ayva);

      ayva.move.callCount.should.equal(2);
      ayva.move.args[1][0].should.deep.equal(expectedUpStrokes[0]);
      ayva.$.stroke.value.should.equal(topValues[0]);

      await stroke.perform(ayva);
      await stroke.perform(ayva);

      ayva.move.callCount.should.equal(3);
      ayva.move.args[2][0].should.deep.equal(expectedDownStrokes[1]);
      ayva.$.stroke.value.should.equal(bottomValues[1]);

      await stroke.perform(ayva);
      await stroke.perform(ayva);

      ayva.move.callCount.should.equal(4);
      ayva.move.args[3][0].should.deep.equal(expectedUpStrokes[1]);
      ayva.$.stroke.value.should.equal(topValues[1]);

      await stroke.perform(ayva);
      await stroke.perform(ayva);

      ayva.move.callCount.should.equal(5);
      ayva.move.args[4][0].should.deep.equal(expectedDownStrokes[2]);
      ayva.$.stroke.value.should.equal(bottomValues[2]);

      await stroke.perform(ayva);
      await stroke.perform(ayva);

      ayva.move.callCount.should.equal(6);
      ayva.move.args[5][0].should.deep.equal(expectedUpStrokes[2]);
      ayva.$.stroke.value.should.equal(topValues[2]);
    });

    it('should allow providing speed with function', async function () {
      const speedValues = [0.5, 1, 1.5, 2, 2.5, 3];
      const top = 1;
      const bottom = 0;
      const speed = (index) => speedValues[index];
      const ramp = Ayva.RAMP_COS;

      const stroke = new ClassicStroke(bottom, top, speed);

      const expectedDownStrokes = [
        { to: bottom, speed: speedValues[0], value: ramp },
        { to: bottom, speed: speedValues[2], value: ramp },
        { to: bottom, speed: speedValues[4], value: ramp },
      ];

      const expectedUpStrokes = [
        { to: top, speed: speedValues[1], value: ramp },
        { to: top, speed: speedValues[3], value: ramp },
        { to: top, speed: speedValues[5], value: ramp },
      ];

      ayva.$.stroke.value.should.equal(0.5);

      stroke.speed.should.equal(speedValues[0]);
      stroke.top.should.equal(top);
      stroke.bottom.should.equal(bottom);

      await stroke.perform(ayva); // Generate stroke.
      await stroke.perform(ayva); // Perform stroke.

      ayva.move.callCount.should.equal(1);
      ayva.move.args[0][0].should.deep.equal(expectedDownStrokes[0]);
      ayva.$.stroke.value.should.equal(bottom);

      await stroke.perform(ayva);
      await stroke.perform(ayva);

      ayva.move.callCount.should.equal(2);
      ayva.move.args[1][0].should.deep.equal(expectedUpStrokes[0]);
      ayva.$.stroke.value.should.equal(top);

      await stroke.perform(ayva);
      await stroke.perform(ayva);

      ayva.move.callCount.should.equal(3);
      ayva.move.args[2][0].should.deep.equal(expectedDownStrokes[1]);
      ayva.$.stroke.value.should.equal(bottom);

      await stroke.perform(ayva);
      await stroke.perform(ayva);

      ayva.move.callCount.should.equal(4);
      ayva.move.args[3][0].should.deep.equal(expectedUpStrokes[1]);
      ayva.$.stroke.value.should.equal(top);

      await stroke.perform(ayva);
      await stroke.perform(ayva);

      ayva.move.callCount.should.equal(5);
      ayva.move.args[4][0].should.deep.equal(expectedDownStrokes[2]);
      ayva.$.stroke.value.should.equal(bottom);

      await stroke.perform(ayva);
      await stroke.perform(ayva);

      ayva.move.callCount.should.equal(6);
      ayva.move.args[5][0].should.deep.equal(expectedUpStrokes[2]);
      ayva.$.stroke.value.should.equal(top);
    });
  });

  // TODO: Implement stroke shapes array tests.

  describe('invalid strokes', function () {
    const testCreateStroke = function (...args) {
      return function () {
        new ClassicStroke(...args);
      };
    };

    it('should throw an error if parameters are invalid', function () {
      testCreateStroke(0, 0).should.throw('Invalid stroke range specified: (0, 0)');

      ['', NaN, Infinity, true, false, {}].forEach((value) => {
        testCreateStroke(value).should.throw(`Invalid stroke bottom: ${value}`);
        testCreateStroke(0, value).should.throw(`Invalid stroke top: ${value}`);
        testCreateStroke(0, 1, value).should.throw(`Invalid stroke speed: ${value}`);
        testCreateStroke(0, 1, 1, value).should.throw(`Invalid stroke shape: ${value}`);
      });
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

      ['', NaN, Infinity, true, false, {}, -1, 0].forEach((relativeSpeed) => {
        testCreateStroke(0, 1, 1, [
          { value: Ayva.RAMP_COS, relativeSpeed },
          { value: Ayva.RAMP_COS, relativeSpeed },
        ]).should.throw(`Invalid relative speed specified in stroke shape: ${relativeSpeed}`);
      });
    });
  });
});
