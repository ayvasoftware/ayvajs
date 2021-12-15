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
      name: 'L1',
      type: 'linear',
      alias: 'left',
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
    {
      name: 'A1',
      type: 'boolean',
      alias: 'lube',
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

    it('should call move() with each axis with a default position', function () {
      const move = sinon.replace(ayva, 'move', sinon.fake.returns(Promise.resolve()));

      ayva.home();

      move.callCount.should.equal(1);

      const { args } = move.getCall(0);
      const expectedParams = { to: 0.5, speed: 0.5 };

      args.length.should.equal(4);
      args[0].should.deep.equal({ axis: 'L0', ...expectedParams });
      args[1].should.deep.equal({ axis: 'L1', ...expectedParams });
      args[2].should.deep.equal({ axis: 'R0', ...expectedParams });
      args[3].should.deep.equal({ axis: 'R1', ...expectedParams });
    });
  });

  describe('#move() (invalid movements)', function () {
    it('should throw an error if invalid movement is passed', function () {
      const invalidValues = [1, null, undefined, 'bad', '', false, true];

      const testInvalidMovePromises = invalidValues.map((
        value
      ) => ayva.move(value).should.be.rejectedWith(Error, `Invalid movement: ${value}`));

      return Promise.all([
        ayva.move().should.be.rejectedWith(Error, 'Must supply at least one movement.'),
        ...testInvalidMovePromises,
      ]);
    });

    it('should throw an error if \'to\' parameter is missing or invalid', function () {
      const invalidValues = [null, undefined, 'bad', '', false, true, -1, 2];

      const testInvalidMovePromises = invalidValues.map(
        (value) => ayva.move({ to: value }).should.be.rejectedWith(Error, `Invalid value for parameter 'to': ${value}`)
      );

      return Promise.all([
        ayva.move({}).should.be.rejectedWith(Error, 'Invalid value for parameter \'to\': undefined'),
        ayva.move({ to: 0 }).should.be.rejectedWith(Error, 'At least one movement must have a speed or duration.'),
        ...testInvalidMovePromises,
      ]);
    });

    it('should throw an error if \'to\' is a function and no duration is explicitly passed', function () {
      return ayva.move({ to: () => {}, speed: 1 }).should.be.rejectedWith(Error, 'Must provide a duration when \'to\' is a function.');
    });

    it('should throw an error if \'speed\' is invalid', function () {
      const invalidValues = [null, undefined, 'bad', '', false, true, -1, 0];

      const testInvalidMovePromises = invalidValues.map(
        (value) => ayva.move({ to: 0, speed: value }).should.be.rejectedWith(Error, `Invalid value for parameter 'speed': ${value}`)
      );

      return Promise.all(testInvalidMovePromises);
    });

    it('should throw an error if \'duration\' is invalid', function () {
      const invalidValues = [null, undefined, 'bad', '', false, true, -1, 0];

      const testInvalidMovePromises = invalidValues.map(
        (value) => ayva.move({ to: 0, duration: value }).should.be.rejectedWith(Error, `Invalid value for parameter 'duration': ${value}`)
      );

      return Promise.all(testInvalidMovePromises);
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
      const invalidValues = [null, undefined, 'bad', '', '  ', false, true, 0, 1, -1];

      const testInvalidMovePromises = invalidValues.map(
        (value) => ayva.move({ to: 0, speed: 1, axis: value }).should.be.rejectedWith(Error, `Invalid value for parameter 'axis': ${value}`)
      );

      return Promise.all([
        ...testInvalidMovePromises,
      ]);
    });

    it('should throw an error if velocity is not a function', function () {
      const invalidValues = [null, undefined, 'bad', '', false, true, 0, 1, -1];

      const testInvalidMovePromises = invalidValues.map(
        (value) => ayva.move({ to: 0, speed: 1, velocity: value }).should.be.rejectedWith(Error, '\'velocity\' must be a function.')
      );

      return Promise.all(testInvalidMovePromises);
    });

    it('should throw an error if both \'to\' and \'velocity\' are functions.', function () {
      return ayva.move({ to: () => {}, duration: 1, velocity: () => {} })
        .should.be.rejectedWith(Error, 'Cannot provide both a value and velocity function.');
    });

    it('should throw an error if axis specified more than once', function () {
      return Promise.all([
        ayva.move({ to: 0, speed: 1 }, { to: 0, speed: 1 })
          .should.be.rejectedWith(Error, 'Duplicate axis movement: stroke'),
        ayva.move({ axis: 'roll', to: 0, speed: 1 }, { axis: 'roll', to: 0, speed: 1 })
          .should.be.rejectedWith(Error, 'Duplicate axis movement: roll'),
      ]);
    });

    it('should throw an error if the sync property is invalid data type', function () {
      const invalidValues = [null, undefined, '  ', '', false, true, 0, 1, -1];

      const testInvalidMovePromises = invalidValues.map(
        (value) => ayva.move({ to: 0, speed: 1 }, { axis: 'twist', to: 0, sync: value })
          .should.be.rejectedWith(Error, `Invalid value for parameter 'sync': ${value}`)
      );

      return Promise.all(testInvalidMovePromises);
    });

    it('should throw an error if the sync property is invalid', function () {
      const syncCycleError = 'Sync axes cannot form a cycle.';
      return Promise.all([
        // Sync with non-existent axis.
        ayva.move({ to: 0, speed: 1 }, { axis: 'twist', to: 0, sync: 'roll' })
          .should.be.rejectedWith(Error, 'Cannot sync with axis not specified in movement: twist -> roll'),

        // Sync with self.
        ayva.move({ to: 0, speed: 1 }, { axis: 'twist', to: 0, sync: 'twist' })
          .should.be.rejectedWith(Error, syncCycleError),

        // Sync cycle (2)
        ayva.move({ to: 0, speed: 1 }, { axis: 'twist', to: 0, sync: 'roll' }, { axis: 'roll', to: 0, sync: 'twist' })
          .should.be.rejectedWith(Error, syncCycleError),

        // Sync cycle (3)
        ayva.move(
          { to: 0, speed: 1 },
          { axis: 'twist', to: 0, sync: 'roll' },
          { axis: 'roll', to: 0, sync: 'left' },
          { axis: 'left', to: 0, sync: 'twist' },
        )
          .should.be.rejectedWith(Error, syncCycleError),

      ]);
    });

    it('should throw an error if the sync property is specified with a speed or duration', function () {
      return Promise.all([
        ayva.move({ to: 0, speed: 1 }, {
          axis: 'twist', to: 0, speed: 1, sync: 'stroke',
        })
          .should.be.rejectedWith(Error, 'Cannot specify a speed or duration when sync property is present: twist'),
        ayva.move({ to: 0, speed: 1 }, {
          axis: 'roll', to: 0, duration: 1, sync: 'stroke',
        })
          .should.be.rejectedWith(Error, 'Cannot specify a speed or duration when sync property is present: roll'),
      ]);
    });

    it('should allow boolean values for axis type boolean', function () {
      return Promise.all([
        ayva.move({ axis: 'lube', to: true }).should.be.fulfilled,
        ayva.move({ axis: 'lube', to: false }).should.be.fulfilled,
      ]);
    });

    it('should throw an error if speed or velocity are specified for type boolean', function () {
      const errorMessage = 'Cannot specify speed or velocity for boolean axes: lube';

      return Promise.all([
        ayva.move({ axis: 'lube', to: true, speed: 1 }).should.be.rejectedWith(Error, errorMessage),

        ayva.move({
          axis: 'lube', to: false, duration: 1, velocity: () => {},
        }).should.be.rejectedWith(Error, errorMessage),

        ayva.move({
          axis: 'lube', to: false, duration: 1,
        }).should.be.rejectedWith(Error, 'Cannot specify a duration for a boolean axis movement with constant value.'),

        // Boolean axis should allow duration if a function.
        ayva.move({ axis: 'lube', to: () => {}, duration: 1 }).should.be.fulfilled,
      ]);
    });

    it('should throw an error if number passed to boolean axis', function () {
      return ayva.move({ axis: 'lube', to: 1 }).should.be.rejectedWith(Error, 'Invalid value for parameter \'to\': 1');
    });
  });

  describe('#move (valid single-axis)', function () {
    it('should be able to omit duration if at least one other movement has an implicit duration', function () {
      return Promise.all([
        ayva.move({ to: 0, speed: 1 }, { axis: 'twist', to: () => {} }).should.be.fulfilled,
        ayva.move({ to: 0, duration: 1 }, { axis: 'twist', to: () => {} }).should.be.fulfilled,
      ]);
    });

    // it('should send valid movements using value provider', async function () {
    //   const axis = ayva.getAxis('R0');
    //   axis.value.should.equal(0.5);

    //   const values = [475, 450, 425, 400, 375];
    //   const valueProvider = sinon.fake((parameters) => values[parameters.index]);

    //   await ayva.move({
    //     axis: 'R0',
    //     to: valueProvider,
    //     duration: 0.1,
    //   });

    //   // Travelling for 0.1 seconds with 50hz means five steps (0.02s, or 20ms per step)
    //   device.write.callCount.should.equal(5);
    //   valueProvider.callCount.should.equal(5);

    //   for (let i = 0; i < value.length; i++) {
    //     device.write.args[i][0].should.equal(`R0${values}`);
    //   }

    //   ayva.getAxis(testAxis).value.should.equal(values[values.length - 1]);
    // });

    // it('should send valid movements when constant position and speed', async function () {
    //   const axis = ayva.getAxis('R0');

    //   axis.value.should.equal(0.5);

    //   await ayva.move({
    //     axis: 'R0',
    //     to: 0.4,
    //     speed: 1,
    //   });

    //   // Travelling from 0.5 to 0.4 at 1 unit per second (with 50hz = 20ms step)
    //   device.write.callCount.should.equal(5);
    //   device.write.args[0][0].should.equal('R0480\n');
    //   device.write.args[1][0].should.equal('R0460\n');
    //   device.write.args[2][0].should.equal('R0440\n');
    //   device.write.args[3][0].should.equal('R0420\n');
    //   device.write.args[4][0].should.equal('R0400\n');

    //   ayva.getAxis(testAxis).value.should.equal(0.4);
    // });
  });
});
