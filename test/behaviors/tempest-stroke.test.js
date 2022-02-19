/* eslint-disable no-new, no-await-in-loop */
import '../setup-chai.js';
import sinon from 'sinon';
import Ayva from '../../src/ayva.js';
import TempestStroke from '../../src/behaviors/tempest-stroke.js';
import { createTestConfig } from '../test-helpers.js';
import { round } from '../../src/util/util.js';

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

  it('should allow specifying bpm as a function', async function () {
    const bpms = [30, 60, 90, 120];
    ayva.$.stroke.value.should.equal(0.5);

    const motion = new TempestStroke({
      stroke: {
        from: 0.5,
        to: 1,
      },
    }, (index) => bpms[index % bpms.length]);

    motion.bpm.should.equal(bpms[0]);

    for (let i = 0; i <= bpms.length; i++) {
      await motion.perform(ayva); // Generate
      await motion.perform(ayva); // Perform

      motion.angle.should.equal(Math.PI * (i + 1));
      motion.bpm.should.equal(bpms[(i + 1) % bpms.length]);
    }
  });

  it('should allow specifying bpm as an array', async function () {
    // Thou shalt not repeat thyself.
    const bpms = [30, 60, 90, 120];
    ayva.$.stroke.value.should.equal(0.5);

    const motion = new TempestStroke({
      stroke: {
        from: 0.5,
        to: 1,
      },
    }, bpms);

    motion.bpm.should.equal(bpms[0]);

    for (let i = 0; i <= bpms.length; i++) {
      await motion.perform(ayva); // Generate
      await motion.perform(ayva); // Perform

      motion.angle.should.equal(Math.PI * (i + 1));
      motion.bpm.should.equal(bpms[(i + 1) % bpms.length]);
    }
  });

  it('should allow performing library strokes by name', async function () {
    const strokes = Object.keys(TempestStroke.library);

    for (let i = 0; i < strokes.length; i++) {
      const motion = new TempestStroke(strokes[i]);

      await motion.perform(ayva); // Generate
      await motion.perform(ayva); // Perform

      motion.angle.should.equal(Math.PI);
      motion.bpm.should.equal(60);
    }

    (function () {
      new TempestStroke('non-existent');
    }).should.throw('No stroke named non-existent found.');
  });

  describe('transition moves', function () {
    let stroke;
    const verifyStart = () => {
      ayva.$.stroke.value.should.equal(0.5);
      ayva.$.twist.value.should.equal(0.5);
      ayva.$.roll.value.should.equal(0.5);
    };

    const verifyEnd = () => {
      ayva.$.stroke.value.should.equal(0);
      ayva.$.twist.value.should.equal(0.25);
      ayva.$.roll.value.should.equal(0.75);
    };

    beforeEach(function () {
      stroke = new TempestStroke({
        stroke: {
          from: 0,
          to: 1,
        },
        twist: {
          from: 0.25,
          to: 1,
        },
        roll: {
          from: 0.75,
          to: 1,
        },
      });
    });

    it('with default speed', async function () {
      verifyStart();
      const moves = stroke.getTransitionMoves(ayva);

      moves.forEach((move) => {
        move.speed.should.equal(1);
      });

      await ayva.move(...moves);
      verifyEnd();
    });

    it('with speed specified', async function () {
      verifyStart();
      const moves = stroke.getTransitionMoves(ayva, { speed: 2 });

      moves.forEach((move) => {
        move.speed.should.equal(2);
      });

      await ayva.move(...moves);
      verifyEnd();
    });

    it('with duration specified', async function () {
      verifyStart();
      const moves = stroke.getTransitionMoves(ayva, { duration: 2 });

      moves.forEach((move) => {
        move.duration.should.equal(2);
      });

      await ayva.move(...moves);
      verifyEnd();
    });
  });
});
