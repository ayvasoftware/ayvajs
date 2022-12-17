import '../setup-chai.js';
import { cloneDeep } from '../../src/util/util.js';

describe('cloneDeep() tests', function () {
  it('clones deep', function () {
    const object = {
      x: 23,
      y: {
        universe: 42,
      },
    };

    const clone = cloneDeep(object);

    clone.should.deep.equal(object);
  });
});
