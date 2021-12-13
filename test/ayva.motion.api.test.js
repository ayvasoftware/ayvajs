/* eslint-disable no-unused-expressions */
import 'chai/register-should.js';
import 'chai/register-expect.js';
import sinon from 'sinon';
import Ayva from '../src/ayva.js';

/**
 * A simple OSR2 test configuration.
 */
const TEST_OSR2 = {
  name: 'OSR2',
  defaultAxis: 'L0',
  axes: [
    {
      name: 'L0',
      type: 'linear',
      alias: 'stroke',
    },
    {
      name: 'R0',
      type: 'rotation',
      alias: 'twist',
    },
    {
      name: 'R1',
      type: 'rotation',
      alias: 'roll',
    },
    {
      name: 'A0',
      type: 'auxiliary',
      alias: 'valve',
    },
  ],
};

/**
 * Contains all tests for Ayva's Motion API.
 */
describe('Motion API Tests', function () {
  let ayva;
  let device;

  beforeEach(function () {
    ayva = new Ayva(TEST_OSR2);
    device = {
      write: sinon.fake(),
    };

    ayva.addOutputDevice(device);
  });

  afterEach(function () {
    sinon.restore();
  });

  describe('#home()', function () {
    it('should throw an error when called with invalid values', function () {
      const testHome = function (value) {
        return function () {
          return ayva.home(value);
        };
      };

      testHome(null).should.throw(Error, 'Invalid value: null');
      testHome(false).should.throw(Error, 'Invalid value: false');
      testHome(true).should.throw(Error, 'Invalid value: true');
      testHome('').should.throw(Error, 'Invalid value: ');
      testHome({}).should.throw(Error, 'Invalid value: [object Object]');
    });

    it('should call move() with each axis with a default position', async function () {
      const move = sinon.replace(ayva, 'move', sinon.fake.returns(Promise.resolve()));

      ayva.home();

      move.callCount.should.equal(1);

      const { args } = move.getCall(0);
      const expectedParams = { to: 0.5, speed: 0.5 };

      args.length.should.equal(3);
      args[0].should.deep.equal({ axis: 'L0', ...expectedParams });
      args[1].should.deep.equal({ axis: 'R0', ...expectedParams });
      args[2].should.deep.equal({ axis: 'R1', ...expectedParams });
    });
  });

  // describe('#move (single-axis)', function () {

  // });
});
