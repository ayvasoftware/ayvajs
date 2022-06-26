/* eslint-disable no-await-in-loop, no-console, no-unused-expressions */
import '../setup-chai.js';
import sinon from 'sinon';
import Ayva from '../../src/ayva.js';
import GeneratorBehavior from '../../src/behaviors/generator-behavior.js';
import { createTestConfig, tickBehavior } from '../test-helpers.js';

describe('Generator Behavior Tests', function () {
  let ayva;
  let behavior;

  beforeEach(function () {
    ayva = new Ayva(createTestConfig());
    sinon.replace(ayva, 'move', sinon.fake(ayva.move));
    sinon.replace(ayva, 'sleep', sinon.fake.returns(Promise.resolve(true)));

    ayva.addOutputDevice({
      write: sinon.fake(),
    });

    behavior = new GeneratorBehavior();
  });

  afterEach(function () {
    ayva.stop();
  });

  describe('#generate', function () {
    it('can yield a single axis move', async function () {
      const action = {
        to: 0,
        speed: 1,
      };

      behavior.generate = function* () {
        yield action;
      };

      const result = await behavior.perform(ayva);

      expect(result).to.be.true;
      ayva.move.callCount.should.equal(1);
      ayva.move.args[0][0].should.deep.equal(action);
    });

    it('can yield a multi axis move', async function () {
      const moves = [{
        to: 0,
        speed: 1,
      }, {
        axis: 'twist',
        to: 0,
      }];

      behavior.generate = function* () {
        yield moves;
      };

      const result = await behavior.perform(ayva);

      expect(result).to.be.true;
      ayva.move.callCount.should.equal(1);
      ayva.move.args[0].should.deep.equal(moves);
    });

    it('can yield a move builder', async function () {
      behavior.generate = function* () {
        yield ayva.$.stroke(0, 1);
      };

      const result = await behavior.perform(ayva);

      expect(result).to.be.true;
      ayva.move.callCount.should.equal(1);
      ayva.move.args[0][0].should.deep.equal({
        axis: 'stroke',
        to: 0,
        speed: 1,
      });
    });

    it('can yield a promise', async function () {
      behavior.generate = function* () {
        yield Promise.resolve('result');
      };

      const result = await behavior.perform(ayva);

      expect(result).to.equal('result');
    });

    it('can yield a sleep', async function () {
      behavior.generate = function* () {
        yield 1;
      };

      const result = await behavior.perform(ayva);

      expect(result).to.be.true;
      ayva.sleep.callCount.should.equal(1);
      ayva.sleep.args[0][0].should.equal(1);
    });

    it('handles multiple actions', async function () {
      behavior.generate = function* () {
        yield { to: 0, speed: 1 };
        yield { to: 1, speed: 1 };
      };

      expect(await behavior.perform(ayva)).to.equal(true);
      expect(await behavior.perform(ayva)).to.equal(true);
      expect(await behavior.perform(ayva)).to.equal(undefined); // Restarting generation...
      expect(await behavior.perform(ayva)).to.equal(true);

      ayva.move.callCount.should.equal(3);
      ayva.move.args[0][0].should.deep.equal({ to: 0, speed: 1 });
      ayva.move.args[1][0].should.deep.equal({ to: 1, speed: 1 });
      ayva.move.args[2][0].should.deep.equal({ to: 0, speed: 1 });
    });

    it('integrates with ayva.do()', async function () {
      sinon.restore();
      sinon.replace(ayva, 'move', sinon.fake());
      sinon.replace(ayva, 'sleep', sinon.fake.returns(Promise.resolve(true)));

      behavior.generate = function* () {
        yield { to: 0, speed: 1 };
        yield { to: 1, speed: 1 };
      };

      ayva.do(behavior); // TODO: Fix test so that if it fails it doesn't hang forever.

      expect(ayva.performing).to.be.true;
      ayva.move.callCount.should.equal(1);
      ayva.move.args[0][0].should.deep.equal({ to: 0, speed: 1 });
      await tickBehavior();

      ayva.move.callCount.should.equal(2);
      ayva.move.args[1][0].should.deep.equal({ to: 1, speed: 1 });
      await tickBehavior();
      await tickBehavior(); // Takes an extra tick to start next cycle.

      ayva.move.callCount.should.equal(3);
      ayva.move.args[2][0].should.deep.equal({ to: 0, speed: 1 });
      ayva.stop();
      await tickBehavior();

      ayva.move.callCount.should.equal(3);
      expect(ayva.performing).to.be.false;
    });

    it('can complete behavior by setting complete property to true', async function () {
      sinon.restore();
      sinon.replace(ayva, 'move', sinon.fake());
      sinon.replace(ayva, 'sleep', sinon.fake.returns(Promise.resolve(true)));

      behavior.generate = function* () {
        yield { to: 0, speed: 1 };

        this.complete = true;
      };

      ayva.do(behavior);

      expect(ayva.performing).to.be.true;
      ayva.move.callCount.should.equal(1);
      ayva.move.args[0][0].should.deep.equal({ to: 0, speed: 1 });
      await tickBehavior();

      ayva.move.callCount.should.equal(1);

      await tickBehavior();
      ayva.move.callCount.should.equal(1);
      expect(ayva.performing).to.be.false;
    });

    it('throws an error when yielding an invalid value', async function () {
      behavior.generate = function* () {
        yield -1;
      };

      return behavior.perform(ayva).should.be.rejectedWith(Error, 'Invalid movement: -1');
    });

    it('throws an error when generate() is not implemented', async function () {
      const generator = behavior.generate();
      (() => generator.next()).should.throw(Error, 'generate() not implemented.');
    });
  });

  describe('#iterate', function () {
    it('should repeat generator the specified number of times', function () {
      behavior.generate = sinon.fake(function* () {
        yield;
      });

      const generator = behavior.iterate(2, ayva);

      generator.next();
      generator.next();

      behavior.generate.callCount.should.equal(2);
    });

    it('should allow yielding child behaviors', async function () {
      const childBehavior = new GeneratorBehavior();
      childBehavior.generate = function* () {
        yield { to: 0, speed: 1 };
        yield { to: 1, speed: 1 };
      };

      const compositeBehavior = new GeneratorBehavior();
      compositeBehavior.generate = function* () {
        yield { to: 1, speed: 2 };
        yield* childBehavior.iterate(2, ayva);
        yield { to: 0, speed: 0.5 };
        this.complete = true;
      };

      await ayva.do(compositeBehavior);

      expect(ayva.performing).to.equal(false);

      ayva.move.callCount.should.equal(6);
      ayva.move.args[0][0].should.deep.equal({ to: 1, speed: 2 });
      ayva.move.args[1][0].should.deep.equal({ to: 0, speed: 1 });
      ayva.move.args[2][0].should.deep.equal({ to: 1, speed: 1 });
      ayva.move.args[3][0].should.deep.equal({ to: 0, speed: 1 });
      ayva.move.args[4][0].should.deep.equal({ to: 1, speed: 1 });
      ayva.move.args[5][0].should.deep.equal({ to: 0, speed: 0.5 });
    });
  });
});
