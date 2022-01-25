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
  });

  describe('invalid strokes', function () {
    it('should throw an error if parameters are invalid', function () {
      (function () {
        new ClassicStroke(0, 0);
      }).should.throw('Invalid stroke specified: (0, 0, 1)');

      ['', NaN, Infinity, true, false].forEach((value) => {
        (function () {
          new ClassicStroke(value);
        }).should.throw(`Invalid stroke specified: (${value}, 1, 1)`);

        (function () {
          new ClassicStroke(0, value);
        }).should.throw(`Invalid stroke specified: (0, ${value}, 1)`);

        (function () {
          new ClassicStroke(0, 1, value);
        }).should.throw(`Invalid stroke specified: (0, 1, ${value})`);
      });
    });
  });
});
