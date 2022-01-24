import '../setup-chai.js';
import sinon from 'sinon';
import Ayva from '../../src/ayva.js';
import AyvaBehavior from '../../src/behaviors/ayva-behavior.js';
import { createTestConfig } from '../test-helpers.js';

describe('Behavior API Tests', function () {
  let ayva;
  let behavior;

  beforeEach(function () {
    ayva = new Ayva(createTestConfig());
    sinon.replace(ayva, 'move', sinon.fake());
    sinon.replace(ayva, 'sleep', sinon.fake.returns(Promise.resolve()));

    behavior = new AyvaBehavior();
  });

  afterEach(function () {
    sinon.restore();
  });

  describe('#perform (invalid)', function () {
    it('should throw an error if generateActions() is not implemented', function () {
      return behavior.perform(ayva).should.be.rejectedWith('Behavior does not implement generateActions()');
    });

    it('should throw an error if generateActions() does not create any actions', function () {
      behavior.generateActions = () => {};
      return behavior.perform(ayva).should.be.rejectedWith('Behavior did not generate any actions.');
    });

    ['insert', 'queue'].forEach(function (type) {
      it('should fail for invalid types', async function () {
        behavior.generateActions = () => {
          behavior[`${type}Sleep`](NaN);
        };

        await behavior.perform(ayva).should.be.rejectedWith('Invalid action: (sleep, NaN)');

        behavior.generateActions = () => {
          behavior[`${type}Function`](NaN);
        };

        await behavior.perform(ayva).should.be.rejectedWith('Invalid action: (function, NaN)');
      });
    });
  });

  describe('#perform (valid)', function () {
    ['insert', 'queue'].forEach(function (type) {
      it(`${type}Move()`, async function () {
        const moves = [{
          to: 0,
          speed: 1,
        }, {
          axis: 'twist',
          to: 0,
        }];

        behavior.generateActions = () => {
          behavior[`${type}Move`](...moves);
        };

        await behavior.perform(ayva);

        ayva.move.callCount.should.equal(1);
        ayva.move.args[0][0].should.deep.equal(moves[0]);
        ayva.move.args[0][1].should.deep.equal(moves[1]);
      });

      it(`${type}Sleep()`, async function () {
        const duration = 1;
        behavior.generateActions = () => {
          behavior[`${type}Sleep`](duration);
        };

        await behavior.perform(ayva);

        ayva.sleep.callCount.should.equal(1);
        ayva.sleep.args[0][0].should.deep.equal(duration);
      });

      it(`${type}Function()`, async function () {
        const testFunction = sinon.fake();

        behavior.generateActions = () => {
          behavior[`${type}Function`](testFunction);
        };

        await behavior.perform(ayva);

        testFunction.callCount.should.equal(1);
        testFunction.args[0][0].should.deep.equal(behavior);
        testFunction.args[0][1].should.deep.equal(ayva);
      });

      it(`${type}Behavior`, async function () {
        const duration = 1;
        const subBehavior = new AyvaBehavior();

        subBehavior.generateActions = () => {
          subBehavior[`${type}Sleep`](duration);
        };

        behavior.generateActions = () => {
          behavior[`${type}Behavior`](subBehavior);
        };

        await behavior.perform(ayva);

        ayva.sleep.callCount.should.equal(1);
        ayva.sleep.args[0][0].should.deep.equal(duration);
      });
    });

    it('should accept a move builder', async function () {
      const builder = ayva.$.stroke(0, 1);
      sinon.replace(builder, 'execute', sinon.fake());

      behavior.generateActions = () => {
        behavior.queueMove(builder);
      };

      await behavior.perform(ayva);

      builder.execute.callCount.should.equal(1);

      behavior.generateActions = () => {
        behavior.insertMove(builder);
      };

      await behavior.perform(ayva);

      builder.execute.callCount.should.equal(2);
    });

    it('should allow mixed operations', async function () {
      const startFunction = sinon.fake();

      const startMoves = [{
        to: 1,
        speed: 1,
      }];

      const moves = [{
        to: 0,
        speed: 1,
      }, {
        axis: 'twist',
        to: 0,
      }];

      const duration = 1;

      const testFunction = sinon.fake();

      const subMoves = [{
        to: 1,
        speed: 2,
      }];

      const subBehavior = new AyvaBehavior();

      subBehavior.generateActions = () => {
        subBehavior.queueSleep(duration);
        subBehavior.queueMove(...subMoves);
      };

      behavior.generateActions = () => {
        behavior.queueMove(...moves);
        behavior.queueSleep(duration);
        behavior.queueFunction(testFunction);
        behavior.queueBehavior(subBehavior);

        behavior.insertMove(...startMoves);
        behavior.insertFunction(startFunction);
      };

      await behavior.perform(ayva);

      startFunction.callCount.should.equal(1);
      startFunction.args[0][0].should.deep.equal(behavior);
      startFunction.args[0][1].should.deep.equal(ayva);

      await behavior.perform(ayva);

      ayva.move.callCount.should.equal(1);
      ayva.move.args[0][0].should.deep.equal(startMoves[0]);

      await behavior.perform(ayva);

      ayva.move.callCount.should.equal(2);
      ayva.move.args[1][0].should.deep.equal(moves[0]);
      ayva.move.args[1][1].should.deep.equal(moves[1]);

      await behavior.perform(ayva);

      ayva.sleep.callCount.should.equal(1);
      ayva.sleep.args[0][0].should.deep.equal(duration);

      await behavior.perform(ayva);

      testFunction.callCount.should.equal(1);
      testFunction.args[0][0].should.deep.equal(behavior);
      testFunction.args[0][1].should.deep.equal(ayva);

      await behavior.perform(ayva);

      ayva.sleep.callCount.should.equal(2);
      ayva.sleep.args[1][0].should.deep.equal(duration);

      await behavior.perform(ayva);

      ayva.move.callCount.should.equal(3);
      ayva.move.args[2][0].should.deep.equal(subMoves[0]);
    });

    it('should allow inserting new moves with function', async function () {
      const moves = [{
        to: 0,
        speed: 1,
      }, {
        axis: 'twist',
        to: 0,
      }];

      const testFunction = sinon.fake((b) => b.insertMove(...moves));

      behavior.generateActions = () => {
        behavior.insertFunction(testFunction);
      };

      await behavior.perform(ayva);

      testFunction.callCount.should.equal(1);
      testFunction.args[0][0].should.deep.equal(behavior);
      testFunction.args[0][1].should.deep.equal(ayva);

      ayva.move.callCount.should.equal(0);

      await behavior.perform(ayva);

      ayva.move.callCount.should.equal(1);
      ayva.move.args[0][0].should.deep.equal(moves[0]);
      ayva.move.args[0][1].should.deep.equal(moves[1]);
    });
  });
});
