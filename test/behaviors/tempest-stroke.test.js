/* eslint-disable no-new, no-await-in-loop, no-unused-expressions */
import '../setup-chai.js';
import sinon from 'sinon';
import { expect } from 'chai';
import Ayva from '../../src/ayva.js';
import TempestStroke from '../../src/behaviors/tempest-stroke.js';
import {
  createTestConfig, mock, mockSleep, spyMove
} from '../test-helpers.js';
import { round } from '../../src/util/util.js';

describe('Tempest Stroke Tests', function () {
  let ayva;

  const performTempestStroke = async function (stroke) {
    for (let i = 0; i < TempestStroke.granularity; i++) {
      await stroke.perform(ayva); // Perform Slice.
    }

    await stroke.perform(ayva); // Restart.
  };

  beforeEach(function () {
    ayva = new Ayva(createTestConfig());
    ayva.addOutput({ write: sinon.fake() });
    mockSleep(ayva);
    spyMove(ayva);
    TempestStroke.granularity = 6;
  });

  afterEach(function () {
    sinon.restore();
    TempestStroke.restoreLibrary();
  });

  it('should allow updating tempest stroke library', function () {
    const orbit = TempestStroke.library['orbit-grind'];
    orbit.L0 = { from: 0, to: 0.42 };

    const originalOrbit = TempestStroke.library['orbit-grind'];
    expect(orbit).to.not.deep.equal(originalOrbit);

    TempestStroke.update('orbit-grind', orbit);

    expect(orbit).to.deep.equal(TempestStroke.library['orbit-grind']);

    // Subsequent changes do not update the library.
    orbit.L0 = { from: 0.32, to: 0.42 };
    expect(orbit).to.not.deep.equal(TempestStroke.library['orbit-grind']);
  });

  it('should allow removing strokes from library', function () {
    const orbit = TempestStroke.library['orbit-grind'];
    expect(orbit).to.deep.equal({
      L0: {
        from: 0.0, to: 0.3, phase: 0, ecc: 0.3,
      },
      L1: {
        from: 0.0, to: 0.6, phase: 0, ecc: -0.3,
      },
      L2: {
        from: 0.2, to: 0.8, phase: 1, ecc: -0.3,
      },
      R0: {
        from: 0.5, to: 0.5, phase: 0, ecc: 0.0,
      },
      R1: {
        from: 0.1, to: 0.9, phase: 1, ecc: -0.3,
      },
      R2: {
        from: 0.9, to: 0.1, phase: 0, ecc: -0.3,
      },
    });

    TempestStroke.remove('orbit-grind', orbit);

    expect(undefined).to.deep.equal(TempestStroke.library['orbit-grind']);
  });

  it('should throw error if granularity is invalid number', function () {
    (function () {
      TempestStroke.granularity = -1;
    }).should.throw('Invalid granularity: -1');
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

    await performTempestStroke(motion);

    round(ayva.$.stroke.value, 2).should.equal(1);
    round(ayva.$.twist.value, 2).should.equal(0);
    motion.angle.should.equal(Math.PI);

    await performTempestStroke(motion);

    round(ayva.$.stroke.value, 2).should.equal(0.5);
    round(ayva.$.twist.value, 2).should.equal(0.5);
    motion.angle.should.equal(Math.PI * 2);
  });

  it('should allow specifying bpm as a function', async function () {
    const bpms = [30, 60, 90, 120, 90, 60, 42];
    ayva.$.stroke.value.should.equal(0.5);

    const motion = new TempestStroke({
      stroke: {
        from: 0.5,
        to: 1,
      },
    }, (index) => bpms[index % bpms.length]);

    motion.bpm.should.equal(bpms[0]);

    await performTempestStroke(motion);

    motion.angle.should.equal(Math.PI);
    motion.bpm.should.equal(42);
  });

  it('should allow specifying bpm as an array', async function () {
    // Thou shalt not repeat thyself.
    const bpms = [30, 60, 90, 120, 90, 60, 42];
    ayva.$.stroke.value.should.equal(0.5);

    const motion = new TempestStroke({
      stroke: {
        from: 0.5,
        to: 1,
      },
    }, bpms);

    motion.bpm.should.equal(bpms[0]);

    await performTempestStroke(motion);

    motion.angle.should.equal(Math.PI);
    motion.bpm.should.equal(42);
  });

  it('should allow specifying noise as number', async function () {
    // TODO: This test depends on the underlying implementation using Math.random()... Don't.
    mock(Math, 'random', 0.5);

    ayva.$.stroke.value.should.equal(0.5);
    ayva.$.twist.value.should.equal(0.5);

    const motion = new TempestStroke({
      stroke: {
        from: 0,
        to: 1,
        noise: 1,
      },

      twist: {
        from: 1,
        to: 0,
        noise: 1,
      },
    });

    await performTempestStroke(motion);

    round(ayva.$.stroke.value, 2).should.equal(1);
    round(ayva.$.twist.value, 2).should.equal(0);
    motion.angle.should.equal(Math.PI);

    await performTempestStroke(motion);

    round(ayva.$.stroke.value, 2).should.equal(0.25);
    round(ayva.$.twist.value, 2).should.equal(0.75);
    motion.angle.should.equal(Math.PI * 2);

    await performTempestStroke(motion);

    round(ayva.$.stroke.value, 2).should.equal(0.75);
    round(ayva.$.twist.value, 2).should.equal(0.25);
    motion.angle.should.equal(Math.PI * 3);
  });

  it('should allow specifying noise as an object', async function () {
    // TODO: This test depends on the underlying implementation using Math.random()... Don't.
    mock(Math, 'random', 0.5);

    ayva.$.stroke.value.should.equal(0.5);
    ayva.$.twist.value.should.equal(0.5);

    const motion = new TempestStroke({
      stroke: {
        from: 0,
        to: 1,
        noise: {
          from: 1,
        },
      },

      twist: {
        from: 1,
        to: 0,
        noise: {
          to: 1,
        },
      },
    });

    await performTempestStroke(motion);

    round(ayva.$.stroke.value, 2).should.equal(1);
    round(ayva.$.twist.value, 2).should.equal(0);
    motion.angle.should.equal(Math.PI);

    await performTempestStroke(motion);

    round(ayva.$.stroke.value, 2).should.equal(0.25);
    round(ayva.$.twist.value, 2).should.equal(1);
    motion.angle.should.equal(Math.PI * 2);

    await performTempestStroke(motion);

    round(ayva.$.stroke.value, 2).should.equal(1);
    round(ayva.$.twist.value, 2).should.equal(0.25);
    motion.angle.should.equal(Math.PI * 3);
  });

  it('should throw an error if noise is out of range', async function () {
    const createStrokeWithNoise = (noise) => function () {
      new TempestStroke({
        stroke: {
          noise,
        },
      });
    };

    createStrokeWithNoise(4).should.throw(Error, 'Invalid noise: 4');
    createStrokeWithNoise(-1).should.throw(Error, 'Invalid noise: -1');
    createStrokeWithNoise({ from: 3 }).should.throw(Error, 'Invalid noise: 3');
    createStrokeWithNoise({ to: 2 }).should.throw(Error, 'Invalid noise: 2');
    createStrokeWithNoise({ from: -1 }).should.throw(Error, 'Invalid noise: -1');
    createStrokeWithNoise({ to: -1 }).should.throw(Error, 'Invalid noise: -1');
  });

  it('should allow performing library strokes by name', async function () {
    const strokes = Object.keys(TempestStroke.library);

    for (let i = 0; i < strokes.length; i++) {
      const motion = new TempestStroke(strokes[i]);

      await performTempestStroke(motion);

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
      const startGenerator = stroke.start(ayva);
      const moves = startGenerator.next().value;

      moves.forEach((move) => {
        if (move.axis === 'B1' || move.axis === 'B2') {
          expect(move.speed).to.be.undefined;
        } else {
          move.speed.should.equal(1);
        }
      });

      await ayva.move(...moves);
      expect(startGenerator.next().done).to.equal(true); // Honestly just for thest Test Coverage not gonna lie.
      verifyEnd();
    });

    it('with speed specified', async function () {
      verifyStart();
      const moves = stroke.start(ayva, { speed: 2 }).next().value;

      moves.forEach((move) => {
        if (move.axis === 'B1' || move.axis === 'B2') {
          expect(move.speed).to.be.undefined;
        } else {
          move.speed.should.equal(2);
        }
      });

      await ayva.move(...moves);
      verifyEnd();
    });

    it('with duration specified', async function () {
      verifyStart();
      const moves = stroke.start(ayva, { duration: 2 }).next().value;

      moves.forEach((move) => {
        if (move.axis === 'B1' || move.axis === 'B2') {
          expect(move.duration).to.be.undefined;
        } else {
          move.duration.should.equal(2);
        }
      });

      await ayva.move(...moves);
      verifyEnd();
    });
  });

  describe('transition behavior', function () {
    // TODO: Some of these tests doesn't really **test** the transition. But merely exercise it
    //       to confirm that there are no exceptions.

    it('should create a new stroke that includes a transition', async function () {
      const sourceParams = TempestStroke.library['orbit-grind'];
      const targetParams = TempestStroke.library['thrust-forward'];
      const stroke = new TempestStroke(sourceParams).bind(ayva);

      Object.keys(sourceParams).forEach((axis) => {
        expect(ayva.$[axis].value).to.equal(0.5);
      });

      await ayva.do(function* () {
        yield* stroke(2);

        const transition = stroke.transition(targetParams, 60, 1);

        yield* transition(2);
        this.complete = true;
      });
    });

    it('should allow auto-bind ayva instance to transition', function () {
      const sourceParams = TempestStroke.library['orbit-grind'];
      const targetParams = TempestStroke.library['thrust-forward'];

      const stroke = new TempestStroke(sourceParams).bind(ayva);

      const transition = stroke.transition(targetParams, 60, 10);

      expect(transition.ayva).to.deep.equal(ayva);
    });

    it('should throw error when called with no ayva instance', function () {
      const sourceParams = TempestStroke.library['orbit-grind'];
      const targetParams = TempestStroke.library['thrust-forward'];

      const stroke = new TempestStroke(sourceParams);

      const transition = stroke.transition(targetParams, 60, 10);

      expect(() => transition().next()).to.throw(Error, 'Invalid Ayva instance: undefined');
    });

    it('should handle a missing linear or rotation axis in source behavior', async function () {
      const sourceParams = TempestStroke.library['orbit-grind'];
      delete sourceParams.L0;
      const targetParams = TempestStroke.library['thrust-forward'];

      const stroke = new TempestStroke(sourceParams).bind(ayva);
      const transition = stroke.transition(targetParams, 60, 10);

      Object.keys(sourceParams).forEach((axis) => {
        expect(ayva.$[axis].value).to.equal(0.5);
      });

      await ayva.do(function* () {
        yield* transition(2);
        this.complete = true;
      });
    });

    it('should handle a missing axis auxiliary axis in source behavior', async function () {
      const sourceParams = TempestStroke.library['orbit-grind'];
      const targetParams = TempestStroke.library['thrust-forward'];
      targetParams.A0 = {
        from: 0.5, to: 0.5, phase: 0.5, ecc: 0.5,
      };

      const stroke = new TempestStroke(sourceParams).bind(ayva);
      const transition = stroke.transition(targetParams, 60, 10);

      Object.keys(sourceParams).forEach((axis) => {
        expect(ayva.$[axis].value).to.equal(0.5);
      });

      await ayva.do(function* () {
        yield* transition(2);
        this.complete = true;
      });
    });

    it('should handle a missing linear or rotation axis in target behavior', async function () {
      const sourceParams = TempestStroke.library['orbit-grind'];
      const targetParams = TempestStroke.library['thrust-forward'];
      delete targetParams.L0;

      const stroke = new TempestStroke(sourceParams).bind(ayva);
      const transition = stroke.transition(targetParams, 60, 10);

      Object.keys(sourceParams).forEach((axis) => {
        expect(ayva.$[axis].value).to.equal(0.5);
      });

      await ayva.do(function* () {
        yield* transition(2);
        this.complete = true;
      });
    });

    it('should handle a missing auxiliary axis in target behavior', async function () {
      await ayva.$.A0(0.5, 1).execute();

      const sourceParams = TempestStroke.library['orbit-grind'];
      sourceParams.A0 = {
        from: 0.5, to: 0.5, phase: 0.5, ecc: 0.5,
      };
      const targetParams = TempestStroke.library['thrust-forward'];

      const stroke = new TempestStroke(sourceParams).bind(ayva);
      const transition = stroke.transition(targetParams, 60, 10);

      Object.keys(sourceParams).forEach((axis) => {
        expect(ayva.$[axis].value).to.equal(0.5);
      });

      await ayva.do(function* () {
        yield* transition(2);
        this.complete = true;
      });
    });

    it('should allow onTransitionStart and onTransitionEnd callbacks', async function () {
      const sourceParams = TempestStroke.library['orbit-grind'];
      const targetParams = TempestStroke.library['thrust-forward'];
      const stroke = new TempestStroke(sourceParams).bind(ayva);

      Object.keys(sourceParams).forEach((axis) => {
        expect(ayva.$[axis].value).to.equal(0.5);
      });

      const onTransitionStart = sinon.fake();
      const onTransitionEnd = sinon.fake();

      await ayva.do(function* () {
        yield* stroke(2);

        const transition = stroke.transition(targetParams, 30, 1, onTransitionStart, onTransitionEnd);

        yield* transition(2);
        this.complete = true;
      });

      onTransitionStart.callCount.should.equal(1);
      onTransitionStart.args[0][0].should.equal(1);
      onTransitionStart.args[0][1].should.equal(30);

      onTransitionEnd.callCount.should.equal(1);
      onTransitionEnd.args[0][0].should.deep.equal(targetParams);
      onTransitionEnd.args[0][1].should.equal(30);
    });

    it('should create start moves that reset unused axes to default', function () {
      const stroke = new TempestStroke({
        L0: { from: 0, to: 1 },
      });

      const startMoves = stroke.start(ayva).next().value;

      const unusedMoves = ['A0', 'A1'].map((axis) => ({
        // Auxiliary axes default to 0.
        axis,
        to: 0,
        speed: 1,
      }));

      unusedMoves.push(...['B1', 'B2'].map((axis) => ({
        // Boolean axes default to false.
        axis,
        to: false,
      })));

      unusedMoves.push(...['L1', 'L2', 'R0', 'R1', 'R2'].map((axis) => ({
        // Linear and Rotation axes default to 0.5.
        axis,
        to: 0.5,
        speed: 1,
      })));

      expect(startMoves).to.deep.equal([{
        axis: 'L0',
        to: 0,
        speed: 1,
      }, ...unusedMoves]);
    });
  });
});
