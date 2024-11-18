/* eslint-disable no-new, no-await-in-loop, no-unused-expressions */
import '../setup-chai.js';
import { expect } from 'chai';
import Ayva from '../../src/ayva.js';
import TempestDanceStroke from '../../src/behaviors/tempest-dance-stroke.js';

describe.only('Tempest Dance Stroke Tests', function () {
  const timer = {
    now: () => performance.now(),
  };

  const testMeasures = [
    {
      stroke: { L0: { from: 0, to: 1 } }, release: '1/8',
    },
    {
      stroke: { L1: { from: 0, to: 1 } }, timeSignature: '8/8',
    },
  ];

  const commonTime = {
    timer,
    timeSignature: '4/4',
    tempo: 120,
  };

  const waltzTime = {
    timer,
    timeSignature: '3/4',
    tempo: 100,
    startTime: 1,
  };

  const jigTime = {
    timer,
    timeSignature: '6/8',
    tempo: 140,
    startTime: 2,
  };

  const uncommonTime = {
    timer,
    timeSignature: '7/8',
    tempo: 200,
    startTime: 3,
  };

  it('should set stroke properties (common time)', () => {
    const stroke = new TempestDanceStroke({ ...commonTime, measures: testMeasures });

    // Stroke Properties
    expect(stroke.timeSignature).to.equal('4/4');
    expect(stroke.bpm).to.equal(120);
    expect(stroke.startTime).to.equal(0);
    expect(stroke.timeSignatureBeatUnit).to.equal(4);
    expect(stroke.timer).to.deep.equal(timer);
    expect(stroke.measures).to.be.an('array');
    expect(stroke.measures.length).to.equal(2);

    // Measure Properties
    const firstMeasure = stroke.measures[0];
    expect(firstMeasure.parameters.L0).to.deep.include({ from: 0, to: 1 });
    expect(firstMeasure.noteCount).to.equal(4);
    expect(firstMeasure.noteValue).to.equal(0.25);
    expect(firstMeasure.release).to.equal(0.125);
    expect(firstMeasure.startTime).to.equal(0);
    expect(firstMeasure.totalBeatCount).to.equal(4);
    expect(firstMeasure.duration).to.be.a('number');
    expect(firstMeasure.duration).to.equal(2);
    expect(firstMeasure.measureBpm).to.equal(120);
    expect(firstMeasure.releaseDuration).to.equal(0.25);
    expect(firstMeasure.nextMeasure).to.equal(stroke.measures[1]);

    const secondMeasure = stroke.measures[1];
    expect(secondMeasure.parameters.L1).to.deep.include({ from: 0, to: 1 });
    expect(secondMeasure.noteCount).to.equal(8);
    expect(secondMeasure.noteValue).to.equal(0.125);
    expect(secondMeasure.release).to.equal(0);
    expect(secondMeasure.startTime).to.equal(2);
    expect(secondMeasure.totalBeatCount).to.equal(4);
    expect(secondMeasure.duration).to.be.a('number');
    expect(secondMeasure.duration).to.equal(2);
    expect(secondMeasure.measureBpm).to.equal(240);
    expect(secondMeasure.releaseDuration).to.equal(0);
    expect(secondMeasure.nextMeasure).to.be.undefined;
  });

  it('should set stroke properties (waltz time)', () => {
    const stroke = new TempestDanceStroke({ ...waltzTime, measures: testMeasures });

    expect(stroke.timeSignature).to.equal('3/4');
    expect(stroke.bpm).to.equal(100);
    expect(stroke.startTime).to.equal(1);
    expect(stroke.timeSignatureBeatUnit).to.equal(4); // 3/4 => beat unit is 4
    expect(stroke.timer).to.deep.equal(timer);
    expect(stroke.measures).to.be.an('array');
    expect(stroke.measures.length).to.equal(2);

    const firstMeasure = stroke.measures[0];
    expect(firstMeasure.parameters.L0).to.deep.include({ from: 0, to: 1 });
    expect(firstMeasure.noteCount).to.equal(3);
    expect(firstMeasure.noteValue).to.equal(0.25);
    expect(firstMeasure.release).to.equal(0.125);
    expect(firstMeasure.startTime).to.equal(0);
    expect(firstMeasure.totalBeatCount).to.equal(3);
    expect(firstMeasure.duration).to.be.a('number');
    expect(firstMeasure.duration).to.be.closeTo(1.8, 1 / Ayva.precision);
    expect(firstMeasure.measureBpm).to.equal(100);
    expect(firstMeasure.releaseDuration).to.equal(0.3);
    expect(firstMeasure.nextMeasure).to.equal(stroke.measures[1]);

    const secondMeasure = stroke.measures[1];
    expect(secondMeasure.parameters.L1).to.deep.include({ from: 0, to: 1 });
    expect(secondMeasure.noteCount).to.equal(8);
    expect(secondMeasure.noteValue).to.equal(0.125);
    expect(secondMeasure.release).to.equal(0);
    expect(secondMeasure.startTime).to.be.closeTo(1.8, 1 / Ayva.precision);
    expect(secondMeasure.totalBeatCount).to.equal(4);
    expect(secondMeasure.duration).to.be.a('number');
    expect(secondMeasure.duration).to.be.closeTo(2.4, 1 / Ayva.precision);
    expect(secondMeasure.measureBpm).to.equal(200);
    expect(secondMeasure.releaseDuration).to.equal(0);
    expect(secondMeasure.nextMeasure).to.be.undefined;
  });

  it('should set stroke properties (jig time)', () => {
    const stroke = new TempestDanceStroke({ ...jigTime, measures: testMeasures });

    expect(stroke.timeSignature).to.equal('6/8');
    expect(stroke.bpm).to.equal(140);
    expect(stroke.startTime).to.equal(2);
    expect(stroke.timeSignatureBeatUnit).to.equal(8); // 6/8 => beat unit is 8
    expect(stroke.timer).to.deep.equal(timer);
    expect(stroke.measures).to.be.an('array');
    expect(stroke.measures.length).to.equal(2);

    const firstMeasure = stroke.measures[0];
    expect(firstMeasure.parameters.L0).to.deep.include({ from: 0, to: 1 });
    expect(firstMeasure.noteCount).to.equal(6); // 6 notes per measure in 6/8 time
    expect(firstMeasure.noteValue).to.equal(1 / 8); // Eighth note
    expect(firstMeasure.release).to.equal(1 / 8);
    expect(firstMeasure.startTime).to.equal(0);
    expect(firstMeasure.totalBeatCount).to.equal(6);
    expect(firstMeasure.duration).to.be.a('number');
    expect(firstMeasure.duration).to.be.closeTo(2.571, 1 / Ayva.precision); // 60 / 140 * 6 beats
    expect(firstMeasure.measureBpm).to.equal(140);
    expect(firstMeasure.releaseDuration).to.be.closeTo(0.428571, 1 / Ayva.precision); // 60 / 140 * 1 beat
    expect(firstMeasure.nextMeasure).to.equal(stroke.measures[1]);

    const secondMeasure = stroke.measures[1];
    expect(secondMeasure.parameters.L1).to.deep.include({ from: 0, to: 1 });
    expect(secondMeasure.noteCount).to.equal(8);
    expect(secondMeasure.noteValue).to.equal(1 / 8);
    expect(secondMeasure.release).to.equal(0);
    expect(secondMeasure.startTime).to.be.closeTo(2.571, 1 / Ayva.precision); // Start after the first measure
    expect(secondMeasure.totalBeatCount).to.equal(8);
    expect(secondMeasure.duration).to.be.a('number');
    expect(secondMeasure.duration).to.be.closeTo(3.428571, 1 / Ayva.precision); // 60 / 140 * 4 beats
    expect(secondMeasure.measureBpm).to.equal(140); // BPM for this measure
    expect(secondMeasure.releaseDuration).to.equal(0);
    expect(secondMeasure.nextMeasure).to.be.undefined;
  });

  it('should set stroke properties (uncommon time)', () => {
    const stroke = new TempestDanceStroke({ ...uncommonTime, measures: testMeasures });

    expect(stroke.timeSignature).to.equal('7/8');
    expect(stroke.bpm).to.equal(200);
    expect(stroke.startTime).to.equal(3);
    expect(stroke.timeSignatureBeatUnit).to.equal(8); // 7/8 => beat unit is 8
    expect(stroke.timer).to.deep.equal(timer);
    expect(stroke.measures).to.be.an('array');
    expect(stroke.measures.length).to.equal(2);

    const firstMeasure = stroke.measures[0];
    expect(firstMeasure.parameters.L0).to.deep.include({ from: 0, to: 1 });
    expect(firstMeasure.noteCount).to.equal(7); // 7 notes in 7/8 time
    expect(firstMeasure.noteValue).to.equal(1 / 8); // Eighth note
    expect(firstMeasure.release).to.equal(1 / 8);
    expect(firstMeasure.startTime).to.equal(0);
    expect(firstMeasure.totalBeatCount).to.equal(7);
    expect(firstMeasure.duration).to.be.a('number');
    expect(firstMeasure.duration).to.be.closeTo(2.1, 1 / Ayva.precision); // 60 / 200 * 7 beats
    expect(firstMeasure.measureBpm).to.equal(200);
    expect(firstMeasure.releaseDuration).to.equal(0.3); // 60 / 200 * 1 beat
    expect(firstMeasure.nextMeasure).to.equal(stroke.measures[1]);

    const secondMeasure = stroke.measures[1];
    expect(secondMeasure.parameters.L1).to.deep.include({ from: 0, to: 1 });
    expect(secondMeasure.noteCount).to.equal(8);
    expect(secondMeasure.noteValue).to.equal(1 / 8);
    expect(secondMeasure.release).to.equal(0);
    expect(secondMeasure.startTime).to.be.closeTo(2.1, 1 / Ayva.precision); // Start after the first measure
    expect(secondMeasure.totalBeatCount).to.equal(8);
    expect(secondMeasure.duration).to.be.a('number');
    expect(secondMeasure.duration).to.be.closeTo(2.4, 1 / Ayva.precision); // 60 / 200 * 4 beats
    expect(secondMeasure.measureBpm).to.equal(200); // BPM for this measure
    expect(secondMeasure.releaseDuration).to.equal(0);
    expect(secondMeasure.nextMeasure).to.be.undefined;
  });

  it('should throw an error if the time signature is invalid', () => {
    expect(() => new TempestDanceStroke({ ...commonTime, timeSignature: '8', measures: testMeasures }))
      .to.throw('Invalid time signature: 8');
  });

  it('should throw an error if the time signature of a measure is invalid', () => {
    expect(() => new TempestDanceStroke({ ...commonTime, measures: [{ ...testMeasures[0], timeSignature: 'haha' }] }))
      .to.throw('Invalid time signature: haha');
  });

  it('should throw an error of the release is longer than the measure', () => {
    expect(() => new TempestDanceStroke({ ...commonTime, measures: [{ ...testMeasures[0], release: '5/4' }] }))
      .to.throw('Release cannot be longer than the measure: 2.5 > 2');
  });
});
