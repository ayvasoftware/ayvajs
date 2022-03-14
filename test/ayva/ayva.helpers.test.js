/* eslint-disable no-unused-expressions */
import '../setup-chai.js';
import Ayva from '../../src/ayva.js';

describe('Helpers Tests', function () {
  it('Ayva.map()', function () {
    // Default mapping [0, 1]
    expect(Ayva.map(-5, 0, 20)).to.equal(-0.25);
    expect(Ayva.map(0, 0, 20)).to.equal(0);
    expect(Ayva.map(5, 0, 20)).to.equal(0.25);
    expect(Ayva.map(10, 0, 20)).to.equal(0.5);
    expect(Ayva.map(15, 0, 20)).to.equal(0.75);
    expect(Ayva.map(20, 0, 20)).to.equal(1);
    expect(Ayva.map(25, 0, 20)).to.equal(1.25);

    // Custom Mapping
    expect(Ayva.map(-5, 0, 20, 0, 10)).to.equal(-2.5);
    expect(Ayva.map(0, 0, 20, 0, 10)).to.equal(0);
    expect(Ayva.map(5, 0, 20, 0, 10)).to.equal(2.5);
    expect(Ayva.map(10, 0, 20, 0, 10)).to.equal(5);
    expect(Ayva.map(15, 0, 20, 0, 10)).to.equal(7.5);
    expect(Ayva.map(20, 0, 20, 0, 10)).to.equal(10);
    expect(Ayva.map(25, 0, 20, 0, 10)).to.equal(12.5);
  });
});
