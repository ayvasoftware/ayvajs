/* eslint-disable no-unused-expressions */
import '../setup-chai.js';
import sinon from 'sinon';
import Ayva from '../../src/ayva.js';

/**
 * Return a simple OSR2 test configuration.
 */
const TEST_CONFIG = () => ({
  name: 'OSR2',
  defaultAxis: 'stroke',
  frequency: 50,
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
});

/**
 * Contains all tests for Ayva's Motion API.
 */
describe('Motion API Tests', function () {
  let ayva;
  let device;

  beforeEach(function () {
    ayva = new Ayva(TEST_CONFIG());

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

  describe('#move() (invalid movements)', function () {
    it('should throw an error if invalid movement is passed', function () {
      return Promise.all([
        ayva.move().should.be.rejectedWith(Error, 'Must supply at least one movement.'),
        ayva.move(1).should.be.rejectedWith(Error, 'Invalid movement: 1'),
        ayva.move(null).should.be.rejectedWith(Error, 'Invalid movement: null'),
        ayva.move('bad').should.be.rejectedWith(Error, 'Invalid movement: bad'),
        ayva.move('').should.be.rejectedWith(Error, 'Invalid movement: '),
        ayva.move(false).should.be.rejectedWith(Error, 'Invalid movement: false'),
        ayva.move(true).should.be.rejectedWith(Error, 'Invalid movement: true'),
      ]);
    });

    it('should throw an error if \'to\' parameter is missing or invalid', function () {
      const invalidError = 'Invalid parameter \'to\'';
      return Promise.all([
        ayva.move({}).should.be.rejectedWith(Error, 'Missing parameter \'to\'.'),
        ayva.move({ to: null }).should.be.rejectedWith(Error, `${invalidError}: null`),
        ayva.move({ to: 'bad' }).should.be.rejectedWith(Error, `${invalidError}: bad`),
        ayva.move({ to: '' }).should.be.rejectedWith(Error, `${invalidError}: `),
        ayva.move({ to: false }).should.be.rejectedWith(Error, `${invalidError}: false`),
        ayva.move({ to: true }).should.be.rejectedWith(Error, `${invalidError}: true`),
        ayva.move({ to: -1 }).should.be.rejectedWith(Error, `${invalidError}: -1`),
        ayva.move({ to: 2 }).should.be.rejectedWith(Error, `${invalidError}: 2`),
        ayva.move({ to: 0 }).should.be.rejectedWith(Error, 'At least one movement must have a speed or duration.'),
      ]);
    });

    it('should throw an error if \'speed\' is invalid', function () {
      const invalidError = 'Invalid parameter \'speed\'';
      return Promise.all([
        ayva.move({ to: 0, speed: null }).should.be.rejectedWith(Error, `${invalidError}: null`),
        ayva.move({ to: 0, speed: 'bad' }).should.be.rejectedWith(Error, `${invalidError}: bad`),
        ayva.move({ to: 0, speed: '' }).should.be.rejectedWith(Error, `${invalidError}: `),
        ayva.move({ to: 0, speed: false }).should.be.rejectedWith(Error, `${invalidError}: false`),
        ayva.move({ to: 0, speed: true }).should.be.rejectedWith(Error, `${invalidError}: true`),
        ayva.move({ to: 0, speed: -1 }).should.be.rejectedWith(Error, `${invalidError}: -1`),
        ayva.move({ to: 0, speed: 0 }).should.be.rejectedWith(Error, `${invalidError}: 0`),
      ]);
    });

    it('should throw an error if \'duration\' is invalid', function () {
      const invalidError = 'Invalid parameter \'duration\'';
      return Promise.all([
        ayva.move({ to: 0, duration: null }).should.be.rejectedWith(Error, `${invalidError}: null`),
        ayva.move({ to: 0, duration: 'bad' }).should.be.rejectedWith(Error, `${invalidError}: bad`),
        ayva.move({ to: 0, duration: '' }).should.be.rejectedWith(Error, `${invalidError}: `),
        ayva.move({ to: 0, duration: false }).should.be.rejectedWith(Error, `${invalidError}: false`),
        ayva.move({ to: 0, duration: true }).should.be.rejectedWith(Error, `${invalidError}: true`),
        ayva.move({ to: 0, duration: -1 }).should.be.rejectedWith(Error, `${invalidError}: -1`),
        ayva.move({ to: 0, duration: 0 }).should.be.rejectedWith(Error, `${invalidError}: 0`),
      ]);
    });

    it('should not allow specifying both speed and duration', function () {
      return ayva.move({ to: 0, duration: 1, speed: 1 }).should.be.rejectedWith(Error, 'Cannot supply both speed and duration.');
    });

    it('should throw an error if axis is not specified and there is no default axis', function () {
      const configWithoutDefault = TEST_CONFIG();
      delete configWithoutDefault.defaultAxis;

      ayva = new Ayva(configWithoutDefault);
      return ayva.move({ to: 0, speed: 1 }).should.be.rejectedWith(Error, 'No default axis configured. Must specify an axis for each movement.');
    });

    it('should throw an error if axis is invalid', function () {
      const invalidError = 'Invalid parameter \'axis\'';
      return Promise.all([
        ayva.move({ to: 0, speed: 1, axis: null }).should.be.rejectedWith(Error, `${invalidError}: null`),
        ayva.move({ to: 0, speed: 1, axis: 'bad' }).should.be.rejectedWith(Error, 'Unknown axis \'bad\'.'),
        ayva.move({ to: 0, speed: 1, axis: '' }).should.be.rejectedWith(Error, `${invalidError}: `),
        ayva.move({ to: 0, speed: 1, axis: false }).should.be.rejectedWith(Error, `${invalidError}: false`),
        ayva.move({ to: 0, speed: 1, axis: true }).should.be.rejectedWith(Error, `${invalidError}: true`),
        ayva.move({ to: 0, speed: 1, axis: 0 }).should.be.rejectedWith(Error, `${invalidError}: 0`),
        ayva.move({ to: 0, speed: 1, axis: 1 }).should.be.rejectedWith(Error, `${invalidError}: 1`),
      ]);
    });

    it('should throw an error if \'to\' is a function and no duration is explicitly passed', function () {
      return ayva.move({ to: () => {}, speed: 1 }).should.be.rejectedWith(Error, 'Must provide a duration when \'to\' is a function.');
    });

    it('should throw an error if velocity is not a function', function () {
      const invalidError = '\'velocity\' must be a function.';
      return Promise.all([
        ayva.move({ to: 0, speed: 1, velocity: null }).should.be.rejectedWith(Error, invalidError),
        ayva.move({ to: 0, speed: 1, velocity: 'bad' }).should.be.rejectedWith(Error, invalidError),
        ayva.move({ to: 0, speed: 1, velocity: '' }).should.be.rejectedWith(Error, invalidError),
        ayva.move({ to: 0, speed: 1, velocity: false }).should.be.rejectedWith(Error, invalidError),
        ayva.move({ to: 0, speed: 1, velocity: true }).should.be.rejectedWith(Error, invalidError),
        ayva.move({ to: 0, speed: 1, velocity: 0 }).should.be.rejectedWith(Error, invalidError),
        ayva.move({ to: 0, speed: 1, velocity: 1 }).should.be.rejectedWith(Error, invalidError),
      ]);
    });

    it('should throw an error if both \'to\' and \'velocity\' are functions.', function () {
      return ayva.move({ to: () => {}, duration: 1, velocity: () => {} })
        .should.be.rejectedWith(Error, 'Cannot provide both a value and velocity function.');
    });

    it('should throw an error if axis specified more than once', function () {
      return Promise.all([
        ayva.move({ to: 0, speed: 1 }, { to: 0, speed: 1 }).should.be.rejectedWith(Error, 'Duplicate axis movement: stroke'),
        ayva.move({ axis: 'roll', to: 0, speed: 1 }, { axis: 'roll', to: 0, speed: 1 })
          .should.be.rejectedWith(Error, 'Duplicate axis movement: roll'),
      ]);
    });

    // TODO: Implement 'sync' validators (datatype, combination with other properties, and cycle detection)
  });
});
