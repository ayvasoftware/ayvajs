/* eslint-disable no-await-in-loop, no-console, no-unused-expressions */
import '../setup-chai.js';
import Ayva from '../../src/ayva.js';
import GeneratorBehavior from '../../src/behaviors/generator-behavior.js';
import {
  createTestConfig, tickBehavior, spy, mockMove, mockSleep, mockOutput, restore
} from '../test-helpers.js';

/**
 * Test helper to create a GeneratorBehavior with an implementation of generate() that yields the specified results.
 */
function createGeneratorBehaviorThatYields (...yieldResults) {
  const resultBehavior = new GeneratorBehavior(function* () {
    for (const yieldResult of yieldResults) {
      yield yieldResult;
    }
  });

  return resultBehavior;
}

describe('Generator Behavior Tests', function () {
  let ayva;

  beforeEach(function () {
    ayva = new Ayva(createTestConfig());

    mockSleep(ayva);
    mockMove(ayva);
    mockOutput(ayva);
  });

  afterEach(function () {
    restore();
  });

  describe('#generate', function () {
    it('can yield a single axis move', async function () {
      const action = { to: 0, speed: 1 };
      const behavior = createGeneratorBehaviorThatYields(action);

      const result = await behavior.perform(ayva);

      expect(result).to.be.true;
      ayva.move.callCount.should.equal(1);
      expect(ayva.move.firstArg).to.deep.equal(action);
    });

    it('can yield a multi axis move', async function () {
      const action = [{
        to: 0,
        speed: 1,
      }, {
        axis: 'twist',
        to: 0,
      }];
      const behavior = createGeneratorBehaviorThatYields(action);

      const result = await behavior.perform(ayva);

      expect(result).to.be.true;
      ayva.move.callCount.should.equal(1);
      ayva.move.args[0].should.deep.equal(action);
    });

    it('can yield a move builder', async function () {
      const behavior = createGeneratorBehaviorThatYields(ayva.$.stroke(0, 1));

      const result = await behavior.perform(ayva);

      expect(result).to.be.true;
      ayva.move.callCount.should.equal(1);
      expect(ayva.move.firstArg).to.deep.equal({
        axis: 'stroke',
        to: 0,
        speed: 1,
      });
    });

    it('can yield a promise', async function () {
      const behavior = createGeneratorBehaviorThatYields(Promise.resolve('result'));

      const result = await behavior.perform(ayva);

      expect(result).to.equal('result');
    });

    it('can yield a sleep', async function () {
      const behavior = createGeneratorBehaviorThatYields(1);

      const result = await behavior.perform(ayva);

      expect(result).to.be.true;
      ayva.sleep.callCount.should.equal(2); // Call count = 2 because ayva.ready() also calls sleep.
      expect(ayva.sleep.firstArg).to.equal(1);
    });

    it('handles multiple actions', async function () {
      const behavior = createGeneratorBehaviorThatYields(
        { to: 0, speed: 1 },
        { to: 1, speed: 1 }
      );

      expect(await behavior.perform(ayva)).to.equal(true);
      expect(await behavior.perform(ayva)).to.equal(true);
      expect(await behavior.perform(ayva)).to.equal(undefined); // Restarting generation... TODO: Figure out how to remove this step.
      expect(await behavior.perform(ayva)).to.equal(true);

      ayva.move.callCount.should.equal(3);
      ayva.move.args[0][0].should.deep.equal({ to: 0, speed: 1 });
      ayva.move.args[1][0].should.deep.equal({ to: 1, speed: 1 });
      ayva.move.args[2][0].should.deep.equal({ to: 0, speed: 1 });
    });

    it('can complete behavior by setting complete property to true', async function () {
      // Arrange
      const behavior = new GeneratorBehavior(function* () {
        yield { to: 0, speed: 1 };
        yield { to: 1, speed: 1 };

        this.complete = true;
      });

      // Act
      const behaviorPromise = ayva.do(behavior);

      // Assert state while behavior is running.
      expect(ayva.performing).to.be.true;
      expect(behavior.complete).to.be.false;
      ayva.move.callCount.should.equal(1);
      ayva.move.args[0][0].should.deep.equal({ to: 0, speed: 1 });

      // Assert state after behavior completes.
      expect(await behaviorPromise).to.equal(true);
      expect(ayva.performing).to.be.false;
      expect(behavior.complete).to.be.true;
      ayva.move.callCount.should.equal(2);
      ayva.move.args[1][0].should.deep.equal({ to: 1, speed: 1 });
    });

    it('integrates with ayva.do() and ayva.stop()', async function () {
      const behavior = createGeneratorBehaviorThatYields(
        { to: 0, speed: 1 },
        { to: 1, speed: 1 }
      );

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

    it('automatically converts generator function to generator behavior when passed to ayva.do()', async function () {
      const generatorFunction = function* () {
        yield { to: 0, speed: 1 };
        yield { to: 1, speed: 1 };
        this.complete = true;
      };

      await ayva.do(generatorFunction);

      ayva.move.callCount.should.equal(2);
      ayva.move.args[0][0].should.deep.equal({ to: 0, speed: 1 });
      ayva.move.args[1][0].should.deep.equal({ to: 1, speed: 1 });
    });

    it('is iterable', async function () {
      const behavior = createGeneratorBehaviorThatYields(
        { to: 0, speed: 1 },
        { to: 1, speed: 1 }
      );
      spy(behavior, 'generate');

      const iterator = behavior[Symbol.iterator]();

      expect(iterator.next().value).to.deep.equal({ to: 0, speed: 1 });
      expect(iterator.next().value).to.deep.equal({ to: 1, speed: 1 });
    });

    it('throws an error when yielding an invalid value', async function () {
      restore();

      const behavior = new GeneratorBehavior(function* () {
        yield -1;
      });

      (() => behavior.perform(ayva)).should.throw(Error, 'Invalid movement: -1');
    });

    it('throws an error when generate() is not implemented', async function () {
      const generator = new GeneratorBehavior().generate();
      (() => generator.next()).should.throw(Error, 'generate() not implemented.');
    });

    it('throws error if constructor argument is not a generator function', function () {
      const generate = () => {};

      (() => new GeneratorBehavior(generate)).should.throw(Error, 'Not a generator function: () => {}');
    });
  });

  describe('#iterated', function () {
    it('should allow yielding child behaviors', async function () {
      const childBehavior = new GeneratorBehavior(function* () {
        yield { to: 0, speed: 1 };
        yield { to: 1, speed: 1 };
      });

      const compositeBehavior = new GeneratorBehavior(function* () {
        yield { to: 1, speed: 2 };
        yield* childBehavior.iterated(ayva, 2);
        yield { to: 0, speed: 0.5 };

        this.complete = true;
      });

      await ayva.do(compositeBehavior);

      expect(ayva.performing).to.equal(false);
      expect(compositeBehavior.complete).to.equal(true);
      ayva.move.callCount.should.equal(6);
      ayva.move.args[0][0].should.deep.equal({ to: 1, speed: 2 });
      ayva.move.args[1][0].should.deep.equal({ to: 0, speed: 1 });
      ayva.move.args[2][0].should.deep.equal({ to: 1, speed: 1 });
      ayva.move.args[3][0].should.deep.equal({ to: 0, speed: 1 });
      ayva.move.args[4][0].should.deep.equal({ to: 1, speed: 1 });
      ayva.move.args[5][0].should.deep.equal({ to: 0, speed: 0.5 });
    });
  });

  describe('#callable', function () {
    let behavior;
    const expectedResult = 42;

    beforeEach(function () {
      behavior = createGeneratorBehaviorThatYields(expectedResult);

      spy(behavior, 'iterated');
      spy(behavior, 'generate');
    });

    it('calls generate when invoking callable', function () {
      const generator = behavior();

      expect(generator.next().value).to.equal(expectedResult);
      behavior.generate.callCount.should.equal(1);
      expect(behavior.generate.firstArg).to.be.undefined;
    });

    it('calls generate when invoking callable with ayva instance', function () {
      const generator = behavior(ayva);

      expect(generator.next().value).to.equal(expectedResult);
      behavior.generate.callCount.should.equal(1);
      expect(behavior.generate.firstArg).to.deep.equal(ayva);
    });

    it('calls iterated when invoking callable with ayva instance and count', function () {
      const count = 2;

      const generator = behavior(ayva, count);

      expect(generator.next().value).to.equal(expectedResult);
      behavior.iterated.callCount.should.equal(1);
      behavior.iterated.args[0][0].should.equal(ayva);
      behavior.iterated.args[0][1].should.equal(count);
    });

    describe('#bind()', function () {
      beforeEach(function () {
        behavior = new GeneratorBehavior(function* (ayvaInstance) {
          yield ayvaInstance.$.stroke(0, 1).execute();
        });
      });

      it('auto-binds ayva instance to generate', function () {
        const result = behavior.bind(ayva);

        behavior.generate().next();

        expect(result).to.deep.equal(behavior);
        ayva.move.callCount.should.equal(1);
        ayva.move.firstArg.should.deep.equal({ axis: 'stroke', to: 0, speed: 1 });
      });

      it('auto-binds ayva instance to iterated', function () {
        const result = behavior.bind(ayva);

        behavior.iterated().next();

        expect(result).to.deep.equal(behavior);
        ayva.move.callCount.should.equal(1);
        ayva.move.firstArg.should.deep.equal({ axis: 'stroke', to: 0, speed: 1 });
      });

      it('auto-binds ayva instance to callable', function () {
        const result = behavior.bind(ayva);

        behavior().next();

        expect(result).to.deep.equal(behavior);
        ayva.move.callCount.should.equal(1);
        ayva.move.firstArg.should.deep.equal({ axis: 'stroke', to: 0, speed: 1 });
      });

      it('auto-binds ayva instance to callable for iterated', function () {
        const count = 2;
        const result = behavior.bind(ayva);
        const iteratedSpy = spy(behavior, 'iterated');

        behavior(count).next();

        expect(result).to.deep.equal(behavior);
        ayva.move.callCount.should.equal(1);
        ayva.move.firstArg.should.deep.equal({ axis: 'stroke', to: 0, speed: 1 });
        iteratedSpy.callCount.should.equal(1);
        iteratedSpy.args[0][0].should.equal(count);
      });

      it('allows changing the binding', function () {
        behavior.bind(ayva);
        behavior.unbind();

        (function () { behavior.generate().next(); }).should.throw(TypeError);
        (function () { behavior.iterated().next(); }).should.throw(TypeError);
      });

      it('binding more than once has no adverse effects', function () {
        behavior.bind(ayva);
        behavior.bind(ayva);
        behavior.unbind();

        (function () { behavior.generate().next(); }).should.throw(TypeError);
        (function () { behavior.iterated().next(); }).should.throw(TypeError);
      });
    });
  });
});
