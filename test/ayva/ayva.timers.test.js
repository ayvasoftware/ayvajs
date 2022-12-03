/* eslint-disable no-unused-expressions */
import '../setup-chai.js';
import sinon from 'sinon';
import { Blob } from 'buffer';
import Ayva from '../../src/ayva.js';
import WorkerTimer from '../../src/util/worker-timer.js';
import { createTestConfig, spySleep } from '../test-helpers.js';

describe('Timer Tests', function () {
  let ayva;

  beforeEach(function () {
    global.Blob = Blob;
    global.Worker = class {
      // Fake worker that resolves message immediately.
      postMessage ({ id }) {
        this.onmessage({
          data: id,
        });
      }
    };

    ayva = new Ayva(createTestConfig());

    ayva.addOutput({
      write: sinon.fake(),
    });

    spySleep(ayva);
  });

  afterEach(function () {
    delete global.Worker;
    delete global.Blob;
    sinon.restore();
  });

  it('should use worker timer to time movements', async function () {
    expect(ayva.getTimer() instanceof WorkerTimer).to.be.true;

    ayva.$.stroke.value.should.equal(0.5);
    await ayva.move({ to: 0, speed: 1 });

    ayva.$.stroke.value.should.equal(0);
  });
});
