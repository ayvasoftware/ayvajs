/* eslint-disable no-await-in-loop, no-console, no-unused-expressions, no-new */
import '../setup-chai.js';
import Ayva from '../../src/ayva.js';
import ScriptBehavior from '../../src/behaviors/script-behavior.js';
import {
  createTestConfig, mockMove, mockSleep, mockOutput, restore
} from '../test-helpers.js';

describe('Script Behavior Tests', function () {
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

  it('can yield a single axis move', async function () {
    const behavior = new ScriptBehavior(`
      yield { to: 0, speed: 1 };
    `);

    const result = await behavior.perform(ayva);

    expect(result).to.be.true;
    ayva.move.callCount.should.equal(1);
    expect(ayva.move.firstArg).to.deep.equal({ to: 0, speed: 1 });
  });

  it('throws syntax error if invalid JavaScript', async function () {
    const behavior = new ScriptBehavior(`
      console.log(');
    `);

    (() => {
      behavior.perform(ayva);
    }).should.throw(SyntaxError, 'Invalid AyvaScript.');
  });

  it('should allow completion', async function () {
    const behavior = new ScriptBehavior(`
      yield { to: 0, speed: 1 };
      this.complete = true;
    `);

    const result = await ayva.do(behavior);

    expect(result).to.be.true;
    ayva.move.callCount.should.equal(1);
    expect(ayva.move.firstArg).to.deep.equal({ to: 0, speed: 1 });
  });
});
