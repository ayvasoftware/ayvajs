/* eslint-disable no-unused-expressions */
import './test-util/setup-chai.js';
import sinon from 'sinon';
import Ayva from '../src/ayva.js';
import { TEST_CONFIG } from './test-util/test-util.js';

/**
 * Contains all tests for Ayva's Motion API.
 */
describe('Motion API Tests', function () {
  let ayva;
  let device;

  beforeEach(function () {
    ayva = new Ayva(TEST_CONFIG());

    // Do not actually sleep.
    sinon.replace(ayva, 'sleep', sinon.fake.returns(Promise.resolve()));

    device = {
      write: sinon.fake(),
    };

    ayva.addOutputDevice(device);
  });

  afterEach(function () {
    sinon.restore();
  });

  describe('#home()', function () {
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

  /**
   * Invalid movements.
   */
  describe('#move() (invalid movements)', function () {
    it('should throw an error if invalid movement is passed', function () {
      const invalidValues = [1, null, undefined, 'bad', '', false, true, () => {}];

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
        ayva.move({}).should.be.rejectedWith(Error, 'Must provide a \'to\' property or \'value\' function.'),
        ayva.move({ to: 0 }).should.be.rejectedWith(Error, 'At least one movement must have a speed or duration.'),
        ...testInvalidMovePromises,
      ]);
    });

    it('should throw an error if speed is provided and no target position is specified', function () {
      return ayva.move({ value: () => {}, speed: 1 }).should.be.rejectedWith(Error, 'Must provide a target position when specifying speed.');
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

    it('should throw an error if value is not a function', function () {
      const invalidValues = [null, undefined, 'bad', '', false, true, 0, 1, -1];

      const testInvalidMovePromises = invalidValues.map(
        (value) => ayva.move({ to: 0, speed: 1, value }).should.be.rejectedWith(Error, '\'value\' must be a function.')
      );

      return Promise.all(testInvalidMovePromises);
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

    it('should throw an error if speed is specified for type boolean', function () {
      const errorMessage = 'Cannot specify speed for boolean axes: lube';

      return Promise.all([
        ayva.move({ axis: 'lube', to: true, speed: 1 }).should.be.rejectedWith(Error, errorMessage),

        ayva.move({
          axis: 'lube', to: false, duration: 1,
        }).should.be.rejectedWith(Error, 'Cannot specify a duration for a boolean axis movement with constant value.'),

        // Boolean axis should allow duration if providing a value function.
        ayva.move({ axis: 'lube', value: () => {}, duration: 1 }).should.be.fulfilled,
      ]);
    });

    it('should throw an error if number passed to boolean axis', function () {
      return ayva.move({ axis: 'lube', to: 1 }).should.be.rejectedWith(Error, 'Invalid value for parameter \'to\': 1');
    });
  });

  /**
   * Valid movements (single axis)
   */
  describe('#move (valid single-axis)', function () {
    it('should send valid movements using value provider', async function () {
      const axis = ayva.getAxis('R0');
      axis.value.should.equal(0.5);

      const values = [0.475, 0.450, 0.425, 0.400, 0.375];
      const valueProvider = sinon.fake((parameters) => values[parameters.index]);

      await ayva.move({
        axis: 'R0',
        value: valueProvider,
        duration: 0.1,
      });

      device.write.callCount.should.equal(5);
      device.write.args[0][0].should.equal('R0475\n');
      device.write.args[1][0].should.equal('R0450\n');
      device.write.args[2][0].should.equal('R0425\n');
      device.write.args[3][0].should.equal('R0400\n');
      device.write.args[4][0].should.equal('R0375\n');

      ayva.getAxis('R0').value.should.equal(values[values.length - 1]);
    });

    it('should send valid movements when constant position and speed', async function () {
      const axis = ayva.getAxis('R0');

      axis.value.should.equal(0.5);

      await ayva.move({
        axis: 'R0',
        to: 0.4,
        speed: 1,
      });

      // Travelling from 0.5 to 0.4 at 1 unit per second (with 50hz = 20ms step)
      device.write.callCount.should.equal(5);
      device.write.args[0][0].should.equal('R0480\n');
      device.write.args[1][0].should.equal('R0460\n');
      device.write.args[2][0].should.equal('R0440\n');
      device.write.args[3][0].should.equal('R0420\n');
      device.write.args[4][0].should.equal('R0400\n');

      ayva.getAxis('R0').value.should.equal(0.4);
    });

    it('should send valid movements when constant position and duration', async function () {
      const axis = ayva.getAxis('R0');

      axis.value.should.equal(0.5);

      await ayva.move({
        axis: 'R0',
        to: 0.4,
        duration: 0.1,
      });

      // Travelling from 0.5 to 0.4 at 1 unit per second (with 50hz = 20ms step)
      device.write.callCount.should.equal(5);
      device.write.args[0][0].should.equal('R0480\n');
      device.write.args[1][0].should.equal('R0460\n');
      device.write.args[2][0].should.equal('R0440\n');
      device.write.args[3][0].should.equal('R0420\n');
      device.write.args[4][0].should.equal('R0400\n');

      ayva.getAxis('R0').value.should.equal(0.4);
    });

    it('should be able to omit duration if at least one other movement has an implicit duration', function () {
      return Promise.all([
        ayva.move({ to: 0, speed: 1 }, { axis: 'twist', value: () => {} }).should.be.fulfilled,
        ayva.move({ to: 0, duration: 1 }, { axis: 'twist', value: () => {} }).should.be.fulfilled,
      ]);
    });

    it('should clamp values to the range 0 - 1.', async function () {
      const axis = ayva.getAxis('R0');
      axis.value.should.equal(0.5);

      const values = [1.5];
      const valueProvider = sinon.fake((parameters) => values[parameters.index]);

      await ayva.move({
        axis: 'R0',
        value: valueProvider,
        duration: 1,
      });

      device.write.callCount.should.equal(1);
      device.write.args[0][0].should.equal('R0999\n');

      ayva.getAxis('R0').value.should.equal(1);
    });
  });

  /**
   * Valid movements (multi-axis)
   */
  describe('#move (valid multi-axis)', function () {
    it('should send valid movements using value providers', async function () {
      ayva.getAxis('L0').value.should.equal(0.5);
      ayva.getAxis('R0').value.should.equal(0.5);

      const strokeValues = [0.475, 0.450, 0.425, 0.400, 0.375];
      const twistValues = [0.480, 0.460, 0.440, 0.420, 0.400];

      const strokeValueProvider = sinon.fake((parameters) => strokeValues[parameters.index]);
      const twistValueProvider = sinon.fake((parameters) => twistValues[parameters.index]);

      await ayva.move({
        axis: 'L0',
        value: strokeValueProvider,
        duration: 0.1,
      }, {
        axis: 'R0',
        value: twistValueProvider,
        duration: 0.1,
      });

      device.write.callCount.should.equal(5);
      strokeValues.forEach((value, index) => {
        device.write.args[index][0].should.equal(`L0${value * 1000} R0${twistValues[index] * 1000}\n`);
      });

      ayva.getAxis('L0').value.should.equal(strokeValues[strokeValues.length - 1]);
      ayva.getAxis('R0').value.should.equal(twistValues[twistValues.length - 1]);
    });

    it('should complete movements that are shorter than the total duration', async function () {
      ayva.getAxis('L0').value.should.equal(0.5);
      ayva.getAxis('R0').value.should.equal(0.5);

      const strokeValues = [0.475, 0.450, 0.425, 0.400, 0.375];
      const twistValues = [0.480, 0.460, 0.440, 0.420, 0.400];

      const strokeValueProvider = sinon.fake((parameters) => strokeValues[parameters.index]);
      const twistValueProvider = sinon.fake((parameters) => twistValues[parameters.index]);

      await ayva.move({
        axis: 'L0',
        value: strokeValueProvider,
        duration: 0.1,
      }, {
        axis: 'R0',
        value: twistValueProvider,
        duration: 0.06,
      });

      device.write.callCount.should.equal(5);
      device.write.args[0][0].should.equal(`L0${strokeValues[0] * 1000} R0${twistValues[0] * 1000}\n`);
      device.write.args[1][0].should.equal(`L0${strokeValues[1] * 1000} R0${twistValues[1] * 1000}\n`);
      device.write.args[2][0].should.equal(`L0${strokeValues[2] * 1000} R0${twistValues[2] * 1000}\n`);
      device.write.args[3][0].should.equal(`L0${strokeValues[3] * 1000}\n`);
      device.write.args[4][0].should.equal(`L0${strokeValues[4] * 1000}\n`);

      ayva.getAxis('L0').value.should.equal(strokeValues[strokeValues.length - 1]);
      ayva.getAxis('R0').value.should.equal(twistValues[twistValues.length - 3]);
    });
  });
});
