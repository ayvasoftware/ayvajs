/* eslint-disable no-await-in-loop, no-console */
import '../setup-chai.js';
import sinon from 'sinon';
import Ayva from '../../src/ayva.js';
import {
  createTestConfig, tickBehavior, mock, mockMove, mockSleep
} from '../test-helpers.js';

describe('Behavior API Tests', function () {
  let ayva;

  beforeEach(function () {
    ayva = new Ayva(createTestConfig());
    mockMove(ayva);
    mockSleep(ayva);
  });

  afterEach(function () {
    sinon.restore();
  });

  describe('#ayva.do()', function () {
    const behaviorTests = function (tag, generateFakeBehavior) {
      it(`should run behavior until stopped (${tag})`, async function () {
        const currentBehavior = generateFakeBehavior();
        const perform = currentBehavior.perform ?? currentBehavior;

        ayva.do(currentBehavior);

        for (let i = 1; i < 10; i++) {
          perform.callCount.should.equal(i);
          await tickBehavior();
        }

        perform.callCount.should.equal(10);
        ayva.stop();

        await tickBehavior();

        perform.callCount.should.equal(10);
      });

      it(`should stop current behavior when starting a new one (${tag})`, async function () {
        const currentBehavior = generateFakeBehavior();
        const currentPerform = currentBehavior.perform ?? currentBehavior;
        const nextBehavior = generateFakeBehavior();
        const nextPerform = nextBehavior.perform ?? nextBehavior;

        ayva.do(currentBehavior);

        for (let i = 1; i < 10; i++) {
          currentPerform.callCount.should.equal(i);
          await tickBehavior();
        }

        currentPerform.callCount.should.equal(10);

        ayva.do(nextBehavior);
        // Give current behavior time to stop.
        await tickBehavior();

        for (let i = 1; i < 10; i++) {
          nextPerform.callCount.should.equal(i);
          await tickBehavior();
        }

        ayva.stop();
        await tickBehavior();

        currentPerform.callCount.should.equal(10);
        nextPerform.callCount.should.equal(10);
      });

      it(`should stop all previous behaviors before starting a new one (${tag})`, async function () {
        const firstBehavior = generateFakeBehavior();
        const firstPerform = firstBehavior.perform ?? firstBehavior;
        const secondBehavior = generateFakeBehavior();
        const secondPerform = secondBehavior.perform ?? secondBehavior;
        const thirdBehavior = generateFakeBehavior();
        const thirdPerform = thirdBehavior.perform ?? thirdBehavior;

        ayva.do(firstBehavior);
        ayva.do(secondBehavior);
        ayva.do(thirdBehavior);

        await tickBehavior();

        firstPerform.callCount.should.equal(1);
        secondPerform.callCount.should.equal(0);

        for (let i = 1; i < 10; i++) {
          thirdPerform.callCount.should.equal(i);
          await tickBehavior();
        }

        ayva.stop();
        await tickBehavior();

        firstPerform.callCount.should.equal(1);
        secondPerform.callCount.should.equal(0);
        thirdPerform.callCount.should.equal(10);
      });
    };

    behaviorTests('object', () => ({
      perform: sinon.fake.returns(Promise.resolve()),
    }));

    behaviorTests('function', () => sinon.fake.returns(Promise.resolve()));

    it('should throw error if behavior throws error', async function () {
      mock(console, 'error');
      const error = new Error('Failed.');

      await ayva.do({
        perform () {
          throw error;
        },
      });

      console.error.callCount.should.equal(1);
      console.error.args[0][0].should.equal('Error performing behavior:');
      console.error.args[0][1].should.equal(error.stack);
    });
  });
});
