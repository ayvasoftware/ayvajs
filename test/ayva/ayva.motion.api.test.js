/* eslint-disable no-unused-expressions */
import '../setup-chai.js';
import sinon from 'sinon';
import Ayva from '../../src/ayva.js';
import { TEST_CONFIG } from '../test-helpers.js';

/**
 * Contains all tests for Ayva's Motion API.
 * TODO: Add some validation of parameters passed to value providers.
 */
describe('Motion API Tests', function () {
  let ayva;
  let device;
  let warn; // console.warn

  /**
   * Helper to check that the specified tcodes were written to the output device.
   */
  const validateWriteOutput = (...tcodes) => {
    device.write.callCount.should.equal(tcodes.length);

    tcodes.forEach((tcode, index) => {
      device.write.args[index][0].should.equal(`${tcode}\n`);
    });
  };

  beforeEach(function () {
    ayva = new Ayva(TEST_CONFIG());

    sinon.replace(ayva, 'sleep', sinon.fake.returns(Promise.resolve())); // Do not actually sleep.
    warn = sinon.replace(console, 'warn', sinon.fake());

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
      const expectedAxes = ['L0', 'L1', 'R0', 'R1'];

      args.length.should.equal(expectedAxes.length);
      expectedAxes.forEach((axis, index) => {
        args[index].should.deep.equal({ axis, ...expectedParams });
      });
    });

    it('should emit a warning when no linear or rotation axes are configured', function () {
      ayva = new Ayva();
      ayva.home();

      warn.callCount.should.equal(1);
      warn.getCall(0).args[0].should.equal('No linear or rotation axes configured.');
    });
  });

  describe('#sleep', function () {
    it('should fulfill promise after number of seconds specified', async function () {
      sinon.restore(); // So we can test actual sleep function.
      const startTime = performance.now();
      await ayva.sleep(0.02).should.be.fulfilled;
      const elapsed = performance.now() - startTime;
      expect(Math.round(elapsed)).to.be.at.least(20); // TODO: This is flaky.
      expect(elapsed).to.be.at.most(30);
    });
  });

  /**
   * Invalid movements.
   */
  describe('#move() (invalid movements)', function () {
    const invalidNumericValues = [null, undefined, 'bad', '', false, true, () => {}, NaN, Infinity];

    it('should throw an error if invalid movement is passed', function () {
      const testInvalidMovePromises = [...invalidNumericValues, -1, 0, 1].map((
        value
      ) => ayva.move(value).should.be.rejectedWith(Error, `Invalid movement: ${value}`));

      return Promise.all([
        ayva.move().should.be.rejectedWith(Error, 'Must supply at least one movement.'),
        ...testInvalidMovePromises,
      ]);
    });

    it('should throw an error if \'to\' parameter is missing or invalid', function () {
      // 0 <= to <= 1
      const testInvalidMovePromises = [...invalidNumericValues, -1, 2].map(
        (value) => ayva.move({ to: value }).should.be.rejectedWith(Error, `Invalid value for parameter 'to': ${value}`)
      );

      return Promise.all([
        ayva.move({}).should.be.rejectedWith(Error, 'Must provide a \'to\' property or \'value\' function.'),
        ayva.move({ to: 0 }).should.be.rejectedWith(Error, 'At least one movement must have a speed or duration.'),
        ...testInvalidMovePromises,
      ]);
    });

    it('should throw an error if \'speed\' is invalid', function () {
      // speed > 0
      return Promise.all([...invalidNumericValues, -1, 0].map(
        (value) => ayva.move({ to: 0, speed: value }).should.be.rejectedWith(Error, `Invalid value for parameter 'speed': ${value}`)
      ));
    });

    it('should throw an error if \'duration\' is invalid', function () {
      // duration > 0
      return Promise.all([...invalidNumericValues, -1, 0].map(
        (value) => ayva.move({ to: 0, duration: value }).should.be.rejectedWith(Error, `Invalid value for parameter 'duration': ${value}`)
      ));
    });

    it('should throw an error if speed is provided and no target position is specified', function () {
      return ayva.move({ value: () => {}, speed: 1 }).should.be.rejectedWith(Error, 'Must provide a target position when specifying speed.');
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
      return Promise.all([...invalidNumericValues, 'non-existent', 0, 1, -1].map(
        (value) => ayva.move({ to: 0, speed: 1, axis: value }).should.be.rejectedWith(Error, `Invalid value for parameter 'axis': ${value}`)
      ));
    });

    it('should throw an error if value is not a function', function () {
      const testInvalidMovePromises = [...invalidNumericValues, 0, 1, -1].filter((v) => !(v instanceof Function)).map(
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
      const invalidValues = [null, undefined, '', ' ', false, true, () => {}, NaN, Infinity, 0, 1, -1];

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
        ).should.be.rejectedWith(Error, syncCycleError),
      ]);
    });

    it('should throw an error if the sync property is specified with a speed or duration', function () {
      return Promise.all([
        ayva.move({ to: 0, speed: 1 }, {
          axis: 'twist', to: 0, speed: 1, sync: 'stroke',
        }).should.be.rejectedWith(Error, 'Cannot specify a speed or duration when sync property is present: twist'),

        ayva.move({ to: 0, speed: 1 }, {
          axis: 'roll', to: 0, duration: 1, sync: 'stroke',
        }).should.be.rejectedWith(Error, 'Cannot specify a speed or duration when sync property is present: roll'),
      ]);
    });

    it('should allow boolean values for axis type boolean', function () {
      return Promise.all([
        ayva.move({ axis: 'test-boolean-axis', to: true }).should.be.fulfilled,
        ayva.move({ axis: 'test-boolean-axis', to: false }).should.be.fulfilled,
      ]);
    });

    it('should throw an error if speed is specified for type boolean', function () {
      const errorMessage = 'Cannot specify speed for boolean axes: test-boolean-axis';

      return Promise.all([
        ayva.move({ axis: 'test-boolean-axis', to: true, speed: 1 }).should.be.rejectedWith(Error, errorMessage),

        ayva.move({
          axis: 'test-boolean-axis', to: false, duration: 1,
        }).should.be.rejectedWith(Error, 'Cannot specify a duration for a boolean axis movement with constant value.'),

        // Boolean axis should allow duration if providing a value function.
        ayva.move({ axis: 'test-boolean-axis', value: () => {}, duration: 1 }).should.be.fulfilled,
      ]);
    });

    it('should throw an error if number passed to boolean axis', function () {
      return ayva.move({ axis: 'test-boolean-axis', to: 1 }).should.be.rejectedWith(Error, 'Invalid value for parameter \'to\': 1');
    });

    it('should emit a warning when value provider gives invalid values', async function () {
      await ayva.move({ value: () => ({}), duration: 1 }).should.be.fulfilled;
      await ayva.move({ value: () => NaN, duration: 1 }).should.be.fulfilled;

      warn.callCount.should.equal(ayva.frequency * 2);
      warn.getCall(0).args[0].should.equal('Invalid value provided: [object Object]');
      warn.getCall(ayva.frequency).args[0].should.equal('Invalid value provided: NaN');
    });

    it('should reject movement if value provider throws error', function () {
      const errorMessage = 'All ur cock r belong to us.';

      return ayva.move({
        value: () => {
          throw new Error(errorMessage);
        },
        duration: 1,
      }).should.be.rejectedWith(errorMessage);
    });
  });

  /**
   * Valid movements (single axis)
   */
  describe('#move (valid single-axis)', function () {
    it('should send valid movements using value provider', async function () {
      ayva.getAxis('R0').value.should.equal(0.5);

      const values = [0.475, 0.450, 0.425, 0.400, 0.375];
      const valueProvider = sinon.fake((parameters) => values[parameters.index]);

      const result = await ayva.move({
        axis: 'R0',
        value: valueProvider,
        duration: 0.1,
      });

      expect(result).to.be.true;

      validateWriteOutput('R04750', 'R04500', 'R04250', 'R04000', 'R03750');
      ayva.getAxis('R0').value.should.equal(values[values.length - 1]);
    });

    it('should send valid movements when constant value and speed', async function () {
      ayva.getAxis('R0').value.should.equal(0.5);

      const result = await ayva.move({
        axis: 'R0',
        to: 0.4,
        speed: 1,
      });

      expect(result).to.be.true;

      validateWriteOutput('R04800', 'R04600', 'R04400', 'R04200', 'R04000');
      ayva.getAxis('R0').value.should.equal(0.4);
    });

    it('should send valid movements when constant value and duration', async function () {
      ayva.getAxis('R0').value.should.equal(0.5);

      const result = await ayva.move({
        axis: 'R0',
        to: 0.4,
        duration: 0.1,
      });

      expect(result).to.be.true;

      validateWriteOutput('R04800', 'R04600', 'R04400', 'R04200', 'R04000');
      ayva.getAxis('R0').value.should.equal(0.4);
    });

    it('should allow sending boolean updates with no duration', async function () {
      ayva.getAxis('test-boolean-axis').value.should.equal(false);

      const result = await ayva.move({
        axis: 'test-boolean-axis',
        to: true,
      });

      expect(result).to.be.true;

      validateWriteOutput('A19999');
      ayva.getAxis('test-boolean-axis').value.should.equal(true);
    });

    it('should be able to omit duration if at least one other movement has an implicit duration', function () {
      return Promise.all([
        ayva.move({ to: 0, speed: 1 }, { axis: 'twist', value: () => {} }).should.be.fulfilled,
        ayva.move({ to: 0, duration: 1 }, { axis: 'twist', value: () => {} }).should.be.fulfilled,
      ]);
    });

    it('should clamp values to the range 0 - 1.', async function () {
      ayva.getAxis('R0').value.should.equal(0.5);

      const values = [1.5];
      const valueProvider = sinon.fake((parameters) => values[parameters.index]);

      const result = await ayva.move({
        axis: 'R0',
        value: valueProvider,
        duration: 1,
      });

      expect(result).to.be.true;

      validateWriteOutput('R09999');
      ayva.getAxis('R0').value.should.equal(1);
    });

    it('should scale values to limit range', async function () {
      ayva.updateLimits('R0', 0.1, 0.9);
      ayva.getAxis('R0').value.should.equal(0.5);

      const values = [0.400, 0.300, 0.200, 0.100, 0];
      const valueProvider = sinon.fake((parameters) => values[parameters.index]);

      const result = await ayva.move({
        axis: 'R0',
        value: valueProvider,
        duration: 0.1,
      });

      expect(result).to.be.true;

      validateWriteOutput('R04200', 'R03400', 'R02600', 'R01800', 'R01000');
      ayva.getAxis('R0').value.should.equal(0);
    });

    it('should not write output when moving to current position', async function () {
      ayva.getAxis('stroke').value.should.equal(0.5);

      await ayva.move({ to: 0.5, speed: 1 });

      validateWriteOutput();
    });

    it('should convert extremely fast speeds to immediate moves', async function () {
      const speed = 1000;

      ayva.getAxis('stroke').value.should.equal(0.5);
      const result = await ayva.move({ to: 0, speed });

      expect(result).to.be.true;

      validateWriteOutput('L00000');
      ayva.getAxis('stroke').value.should.equal(0);
    });

    it('should convert extremely short durations to immediate moves', async function () {
      const duration = 0.001;

      ayva.getAxis('stroke').value.should.equal(0.5);
      await ayva.move({ to: 0, duration });

      validateWriteOutput('L00000');
      ayva.getAxis('stroke').value.should.equal(0);
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

      const result = await ayva.move({
        axis: 'L0',
        value: strokeValueProvider,
        duration: 0.1,
      }, {
        axis: 'R0',
        value: twistValueProvider,
        duration: 0.1,
      });

      expect(result).to.be.true;

      validateWriteOutput(
        'L04750 R04800',
        'L04500 R04600',
        'L04250 R04400',
        'L04000 R04200',
        'L03750 R04000',
      );

      ayva.getAxis('L0').value.should.equal(0.375);
      ayva.getAxis('R0').value.should.equal(0.4);
    });

    it('should complete movements that are shorter than the total duration', async function () {
      ayva.getAxis('L0').value.should.equal(0.5);
      ayva.getAxis('R0').value.should.equal(0.5);

      const strokeValues = [0.475, 0.450, 0.425, 0.400, 0.375];
      const twistValues = [0.480, 0.460, 0.440, 0.420, 0.400];

      const strokeValueProvider = sinon.fake((parameters) => strokeValues[parameters.index]);
      const twistValueProvider = sinon.fake((parameters) => twistValues[parameters.index]);

      const result = await ayva.move({
        axis: 'L0',
        value: strokeValueProvider,
        duration: 0.1,
      }, {
        axis: 'R0',
        value: twistValueProvider,
        duration: 0.06,
      });

      expect(result).to.be.true;

      validateWriteOutput(
        'L04750 R04800',
        'L04500 R04600',
        'L04250 R04400',
        'L04000',
        'L03750',
      );

      ayva.getAxis('L0').value.should.equal(0.375);
      ayva.getAxis('R0').value.should.equal(0.44);
    });

    it('should synchronize movements using the sync property', async function () {
      ayva.getAxis('L0').value.should.equal(0.5);
      ayva.getAxis('R0').value.should.equal(0.5);
      ayva.getAxis('R1').value.should.equal(0.5);

      const strokeValues = [0.475, 0.450, 0.425, 0.400, 0.375];
      const twistValues = [0.480, 0.460, 0.440, 0.420, 0.400];
      const rollValues = [0.485, 0.465, 0.445, 0, 0];

      const strokeValueProvider = sinon.fake((parameters) => strokeValues[parameters.index]);
      const twistValueProvider = sinon.fake((parameters) => twistValues[parameters.index]);
      const rollValueProvider = sinon.fake((parameters) => rollValues[parameters.index]);

      const result = await ayva.move({
        axis: 'L0',
        value: strokeValueProvider,
        duration: 0.1,
      }, {
        axis: 'R0',
        value: twistValueProvider,
        duration: 0.06,
      }, {
        axis: 'R1',
        value: rollValueProvider,
        sync: 'R0',
      });

      expect(result).to.be.true;

      validateWriteOutput(
        'L04750 R04800 R14850',
        'L04500 R04600 R14650',
        'L04250 R04400 R14450',
        'L04000',
        'L03750',
      );

      ayva.getAxis('L0').value.should.equal(0.375);
      ayva.getAxis('R0').value.should.equal(0.44);
      ayva.getAxis('R1').value.should.equal(0.445);
    });

    it('should synchronize movements using the sync property (alias)', async function () {
      // TODO: This test is virtually identical to the previous test. Thou shalt not repeat thyself.
      ayva.getAxis('L0').value.should.equal(0.5);
      ayva.getAxis('R0').value.should.equal(0.5);
      ayva.getAxis('R1').value.should.equal(0.5);

      const strokeValues = [0.475, 0.450, 0.425, 0.400, 0.375];
      const twistValues = [0.480, 0.460, 0.440, 0.420, 0.400];
      const rollValues = [0.485, 0.465, 0.445, 0, 0];

      const strokeValueProvider = sinon.fake((parameters) => strokeValues[parameters.index]);
      const twistValueProvider = sinon.fake((parameters) => twistValues[parameters.index]);
      const rollValueProvider = sinon.fake((parameters) => rollValues[parameters.index]);

      const result = await ayva.move({
        axis: 'L0',
        value: strokeValueProvider,
        duration: 0.1,
      }, {
        axis: 'R0',
        value: twistValueProvider,
        duration: 0.06,
      }, {
        axis: 'R1',
        value: rollValueProvider,
        sync: 'twist',
      });

      expect(result).to.be.true;

      validateWriteOutput(
        'L04750 R04800 R14850',
        'L04500 R04600 R14650',
        'L04250 R04400 R14450',
        'L04000',
        'L03750',
      );

      ayva.getAxis('L0').value.should.equal(0.375);
      ayva.getAxis('R0').value.should.equal(0.44);
      ayva.getAxis('R1').value.should.equal(0.445);
    });

    it('should compute speed when synchronizing movements using the sync property', async function () {
      ayva.getAxis('L0').value.should.equal(0.5);
      ayva.getAxis('R0').value.should.equal(0.5);
      ayva.getAxis('R1').value.should.equal(0.5);

      const strokeValues = [0.475, 0.450, 0.425, 0.400, 0.375];
      const rollValues = [0.470, 0.440, 0.410];

      const strokeValueProvider = sinon.fake((parameters) => strokeValues[parameters.index]);
      const rollValueProvider = sinon.fake((parameters) => rollValues[parameters.index]);

      const result = await ayva.move({
        axis: 'L0',
        value: strokeValueProvider,
        duration: 0.1,
      }, {
        axis: 'R0',
        to: 0.440,
        duration: 0.06,
      }, {
        axis: 'R1',
        to: 0.410,
        value: rollValueProvider,
        sync: 'R0',
      });

      expect(result).to.be.true;

      rollValueProvider.callCount.should.equal(3);
      expect(rollValueProvider.args[0][0].speed).to.equal(1.5);
      expect(rollValueProvider.args[1][0].speed).to.equal(1.5);
      expect(rollValueProvider.args[2][0].speed).to.equal(1.5);
      expect(rollValueProvider.args[2][0].duration).to.equal(0.06);

      validateWriteOutput(
        'L04750 R04800 R14700',
        'L04500 R04600 R14400',
        'L04250 R04400 R14100',
        'L04000',
        'L03750',
      );

      ayva.getAxis('L0').value.should.equal(0.375);
      ayva.getAxis('R0').value.should.equal(0.44);
      ayva.getAxis('R1').value.should.equal(0.41);
    });

    it('should allow sending multiple boolean updates with no duration', async function () {
      ayva.getAxis('test-boolean-axis').value.should.equal(false);
      ayva.getAxis('test-boolean-axis-2').value.should.equal(false);

      const result = await ayva.move({
        axis: 'test-boolean-axis',
        to: true,
      }, {
        axis: 'test-boolean-axis-2',
        to: true,
      });

      expect(result).to.be.true;

      validateWriteOutput('A19999 A29999');

      ayva.getAxis('test-boolean-axis').value.should.equal(true);
      ayva.getAxis('test-boolean-axis-2').value.should.equal(true);
    });

    it('should send valid movements in correct order for multiple calls to move()', async function () {
      ayva.getAxis('L0').value.should.equal(0.5);
      ayva.getAxis('R0').value.should.equal(0.5);
      ayva.getAxis('A0').value.should.equal(0.5);

      const result = await Promise.all([
        ayva.move({ axis: 'L0', to: 0, duration: 0.1 }),
        ayva.move({ axis: 'R0', to: 0, duration: 0.1 }),
        ayva.move({ axis: 'A0', to: 0, duration: 0.1 }),
      ]);

      expect(result).to.deep.equal([true, true, true]);

      validateWriteOutput(
        'L04000',
        'L03000',
        'L02000',
        'L01000',
        'L00000',
        'R04000',
        'R03000',
        'R02000',
        'R01000',
        'R00000',
        'A04000',
        'A03000',
        'A02000',
        'A01000',
        'A00000'
      );

      ayva.getAxis('L0').value.should.equal(0.0);
      ayva.getAxis('R0').value.should.equal(0.0);
      ayva.getAxis('A0').value.should.equal(0.0);
    });
  });

  describe('#stop()', function () {
    it('should cancel all movements', async function () {
      ayva.getAxis('L0').value.should.equal(0.5);
      ayva.getAxis('R0').value.should.equal(0.5);
      ayva.getAxis('A0').value.should.equal(0.5);

      const promise = Promise.all([
        ayva.move({ axis: 'L0', to: 0, duration: 0.1 }),
        ayva.move({ axis: 'R0', to: 0, duration: 0.1 }),
        ayva.move({ axis: 'A0', to: 0, duration: 0.1 }),
      ]);

      ayva.stop();

      const result = await promise;

      expect(result).to.deep.equal([false, false, false]);

      // The first move should have only had time to complete one step.
      // The rest of the moves should have been cancelled before even starting.
      validateWriteOutput('L04000');

      ayva.getAxis('L0').value.should.equal(0.400);
      ayva.getAxis('R0').value.should.equal(0.500);
      ayva.getAxis('A0').value.should.equal(0.500);

      // Make sure a call to stop() does not prevent additional moves.
      const retry = await ayva.move({ axis: 'L0', to: 0, duration: 0.1 });
      expect(retry).to.equal(true);
      ayva.getAxis('L0').value.should.equal(0.0);
    });

    it('should cancel pending movements', async function () {
      ayva.getAxis('L0').value.should.equal(0.5);
      ayva.getAxis('R0').value.should.equal(0.5);
      ayva.getAxis('A0').value.should.equal(0.5);

      const promise = Promise.all([
        ayva.move({ axis: 'L0', to: 0, duration: 0.1 }),
        ayva.move({
          axis: 'R0',
          value: () => {
            ayva.stop();
          },
          duration: 0.1,
        }),
        ayva.move({ axis: 'A0', to: 0, duration: 0.1 }),
      ]);

      const result = await promise;

      expect(result).to.deep.equal([true, false, false]);

      // The first move should have completed successfully, while the rest should have been cancelled.
      validateWriteOutput('L04000', 'L03000', 'L02000', 'L01000', 'L00000');

      ayva.getAxis('L0').value.should.equal(0.0);
      ayva.getAxis('R0').value.should.equal(0.500);
      ayva.getAxis('A0').value.should.equal(0.500);
    });
  });
});
