/* eslint-disable no-new, no-await-in-loop */
import '../setup-chai.js';
import sinon from 'sinon';
import Ayva from '../../src/ayva.js';
import TempestStroke from '../../src/behaviors/tempest-stroke.js';
import { createTestConfig } from '../test-helpers.js';
import { round } from '../../src/util.js';

describe('Tempest Stroke Tests', function () {
  let ayva;

  beforeEach(function () {
    ayva = new Ayva(createTestConfig());
    ayva.addOutputDevice({ write: sinon.fake() });
    sinon.replace(ayva, 'sleep', sinon.fake.returns(Promise.resolve()));
    sinon.replace(ayva, 'move', sinon.fake(ayva.move));
  });

  afterEach(function () {
    sinon.restore();
  });

  it('should make stroke parameters available on axes property', function () {
    const from = 0.25;
    const to = 0.75;
    const phase = 0.5;
    const ecc = 0.5;
    const bpm = 30;
    const shift = 1;

    const stroke = new TempestStroke({
      twist: {},
      roll: {
        from,
        to,
        phase,
        ecc,
        shift,
      },
    }, bpm);

    expect(stroke).to.have.property('axes');
    expect(stroke.axes).to.have.property('twist');
    expect(stroke.axes).to.have.property('roll');

    stroke.bpm.should.equal(30);

    stroke.axes.twist.from.should.equal(0);
    stroke.axes.twist.to.should.equal(1);
    stroke.axes.twist.phase.should.equal(0);
    stroke.axes.twist.ecc.should.equal(0);
    stroke.axes.twist.shift.should.equal(0);

    stroke.axes.roll.from.should.equal(from);
    stroke.axes.roll.to.should.equal(to);
    stroke.axes.roll.phase.should.equal(phase);
    stroke.axes.roll.ecc.should.equal(ecc);
    stroke.axes.roll.shift.should.equal(shift);
  });

  it('should perform tempest stroke in 180 degree increments', async function () {
    ayva.$.stroke.value.should.equal(0.5);
    ayva.$.twist.value.should.equal(0.5);

    const motion = new TempestStroke({
      stroke: {
        from: 0.5,
        to: 1,
      },

      twist: {
        from: 0.5,
        to: 0,
      },
    });

    await motion.perform(ayva); // Generate
    await motion.perform(ayva); // Perform

    round(ayva.$.stroke.value, 2).should.equal(1);
    round(ayva.$.twist.value, 2).should.equal(0);
    motion.angle.should.equal(Math.PI);

    await motion.perform(ayva); // Generate
    await motion.perform(ayva); // Perform

    round(ayva.$.stroke.value, 2).should.equal(0.5);
    round(ayva.$.twist.value, 2).should.equal(0.5);
    motion.angle.should.equal(Math.PI * 2);
  });
});
