/* eslint-disable no-unused-expressions */
import '../setup-chai.js';
import sinon from 'sinon';
import Ayva from '../../src/ayva.js';
import {
  createTestConfig, mock, spy, mockMove, mockSleep
} from '../test-helpers.js';
import { round } from '../../src/util/util.js';

/**
 * Contains all tests for Ayva's Motion API.
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

  /**
   * Helper to check that a fake provider function was called with appropriate values.
   */
  const validateProviderParameters = function (provider, parameters, currentValues) {
    provider.callCount.should.equal(currentValues.length);

    currentValues.forEach((currentValue, index) => {
      const expectedParameters = {
        currentValue,
        index,
        time: ayva.period * index,
        x: (index + 1) / currentValues.length,
        ...parameters,
      };

      provider.args[index][0].should.deep.equal(expectedParameters);
    });
  };

  beforeEach(function () {
    ayva = new Ayva(createTestConfig());
    ayva.defaultRamp = Ayva.RAMP_LINEAR;

    mockSleep(ayva);
    warn = mock(console, 'warn');

    device = {
      write: sinon.fake(),
    };

    ayva.addOutput(device);
  });

  afterEach(function () {
    sinon.restore();
  });

  describe('#home()', function () {
    it('should call move() with each axis with a default position', function () {
      const move = mockMove(ayva);

      ayva.home();

      move.callCount.should.equal(1);

      const { args } = move.getCall(0);
      const expectedArgs = ['L0', 'L1', 'L2', 'R0', 'R1', 'R2'].map((axis) => ({
        // Linear and Rotation axes default to 0.5.
        axis,
        to: 0.5,
        speed: 0.5,
      }));

      expectedArgs.unshift(...['B1', 'B2'].map((axis) => ({
        // Boolean axes default to false.
        axis,
        to: false,
      })));

      expectedArgs.unshift(...['A0', 'A1'].map((axis) => ({
        // Auxiliary axes default to 0.
        axis,
        to: 0,
        speed: 0.5,
      })));

      args.should.deep.equal(expectedArgs);
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
      spy(global, 'setTimeout');
      await ayva.sleep(0.02).should.become(true);

      setTimeout.callCount.should.equal(1);
      setTimeout.args[0][0].should.be.a('function');
      setTimeout.args[0][1].should.equal(20);
    });

    it('should cancel sleep when calling ayva.stop()', async function () {
      sinon.restore(); // So we can test actual sleep function.
      spy(global, 'setTimeout');

      setTimeout(() => ayva.stop()); // Perform stop in timeout to ensure it happens after sleep()
      await ayva.sleep(1).should.become(false);
    });
  });

  describe('#ready', function () {
    it('should resolve when there are no actions queued', async function () {
      await ayva.ready().should.be.fulfilled;
    });

    it('should resolve when move is finished', async function () {
      ayva.move({ to: 0, speed: 1 });

      await ayva.ready().should.be.fulfilled;

      expect(ayva.$.stroke.value).to.equal(0);
    });

    it('should resolve when multiple moves are finished', async function () {
      ayva.move({ to: 0, speed: 1 });
      ayva.move({ to: 0.75, speed: 1 });

      await ayva.ready().should.be.fulfilled;

      expect(ayva.$.stroke.value).to.equal(0.75);
    });

    it('should resolve only when queued actions are finished', async function () {
      // TODO: Checking that the time has elapsed might not be the best way to do this...
      sinon.restore(); // So we can test actual sleep function.
      spy(global, 'setTimeout');

      const startTime = performance.now();
      ayva.sleep(0.02);
      await ayva.ready().should.be.fulfilled;

      expect(performance.now() - startTime).to.be.above(20); // Should have waited at least 20ms.
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
      const configWithoutDefault = createTestConfig();
      delete configWithoutDefault.defaultAxis;

      ayva = new Ayva(configWithoutDefault);
      ayva.addOutput(device);
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
          .should.be.rejectedWith(Error, 'Duplicate axis movement: L0'),
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
          { axis: 'roll', to: 0, sync: 'sway' },
          { axis: 'sway', to: 0, sync: 'twist' },
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
        ayva.move({ axis: 'testBooleanAxis', to: true }).should.be.fulfilled,
        ayva.move({ axis: 'testBooleanAxis', to: false }).should.be.fulfilled,
      ]);
    });

    it('should throw an error if speed is specified for type boolean', function () {
      const errorMessage = 'Cannot specify speed for boolean axes: testBooleanAxis';

      return Promise.all([
        ayva.move({ axis: 'testBooleanAxis', to: true, speed: 1 }).should.be.rejectedWith(Error, errorMessage),

        ayva.move({
          axis: 'testBooleanAxis', to: false, duration: 1,
        }).should.be.rejectedWith(Error, 'Cannot specify a duration for a boolean axis movement with constant value.'),

        // Boolean axis should allow duration if providing a value function.
        ayva.move({ axis: 'testBooleanAxis', value: () => {}, duration: 1 }).should.be.fulfilled,
      ]);
    });

    it('should throw an error if number passed to boolean axis', function () {
      return ayva.move({ axis: 'testBooleanAxis', to: 1 }).should.be.rejectedWith(Error, 'Invalid value for parameter \'to\': 1');
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

    it('should throw an error if there are no output devices added', function () {
      ayva = new Ayva(createTestConfig());
      const errorMessage = 'No output devices have been added.';

      return ayva.move({
        to: 0,
        duration: 1,
      }).should.be.rejectedWith(errorMessage);
    });

    it('should throw an error for invalid tempest motion', function () {
      (function () {
        Ayva.tempestMotion(NaN, 1);
      }).should.throw('One or more motion parameters are invalid (NaN, 1, 0, 0, 60, 0)');
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

      const expectedCurrentValues = [0.5, ...values.slice(0, values.length - 1)];

      validateProviderParameters(valueProvider, {
        axis: 'R0',
        frequency: 50,
        period: 0.02,
        from: 0.5,
        stepCount: 5,
        duration: 0.1,
      }, expectedCurrentValues);

      validateWriteOutput('R04750', 'R04500', 'R04250', 'R04000', 'R03750');
      ayva.getAxis('R0').value.should.equal(values[values.length - 1]);
    });

    it('should call value provider with \'to\', \'speed\', and \'direction\' properties when \'to\' is specified', async function () {
      ayva.getAxis('R0').value.should.equal(0.5);

      const values = [0.400, 0.300, 0.200, 0.100, 0];
      const valueProvider = sinon.fake((parameters) => values[parameters.index]);

      const result = await ayva.move({
        axis: 'R0',
        to: 0,
        duration: 0.1,
        value: valueProvider,
      });

      expect(result).to.be.true;

      const expectedCurrentValues = [0.5, ...values.slice(0, values.length - 1)];

      validateProviderParameters(valueProvider, {
        axis: 'R0',
        frequency: 50,
        period: 0.02,
        to: 0,
        from: 0.5,
        direction: -1,
        speed: 5,
        stepCount: 5,
        duration: 0.1,
      }, expectedCurrentValues);

      validateWriteOutput('R04000', 'R03000', 'R02000', 'R01000', 'R00000');
      ayva.getAxis('R0').value.should.equal(0);
    });

    it('should call value provider with \'to\', \'speed\', and \'direction\' properties when \'to\' is specified (positive direction)', async function () { // eslint-disable-line max-len
      ayva.getAxis('R0').value.should.equal(0.5);

      const values = [0.600, 0.700, 0.800, 0.900, 1];
      const valueProvider = sinon.fake((parameters) => values[parameters.index]);

      const result = await ayva.move({
        axis: 'R0',
        to: 1,
        duration: 0.1,
        value: valueProvider,
      });

      expect(result).to.be.true;

      const expectedCurrentValues = [0.5, ...values.slice(0, values.length - 1)];

      validateProviderParameters(valueProvider, {
        axis: 'R0',
        frequency: 50,
        period: 0.02,
        to: 1,
        from: 0.5,
        direction: 1,
        speed: 5,
        stepCount: 5,
        duration: 0.1,
      }, expectedCurrentValues);

      validateWriteOutput('R05999', 'R06999', 'R07999', 'R08999', 'R09999'); // Because normalization
      ayva.getAxis('R0').value.should.equal(1);
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
      ayva.getAxis('testBooleanAxis').value.should.equal(false);

      const result = await ayva.move({
        axis: 'testBooleanAxis',
        to: true,
      });

      expect(result).to.be.true;

      validateWriteOutput('B19999');
      ayva.getAxis('testBooleanAxis').value.should.equal(true);
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
        duration: 0.02,
      });

      expect(result).to.be.true;

      validateProviderParameters(valueProvider, {
        axis: 'R0',
        frequency: 50,
        period: 0.02,
        from: 0.5,
        stepCount: 1,
        duration: 0.02,
      }, [0.5]);

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

      const expectedCurrentValues = [0.5, ...values.slice(0, values.length - 1)];

      validateProviderParameters(valueProvider, {
        axis: 'R0',
        frequency: 50,
        period: 0.02,
        from: 0.5,
        stepCount: 5,
        duration: 0.1,
      }, expectedCurrentValues);

      validateWriteOutput('R04200', 'R03400', 'R02600', 'R01800', 'R01000');
      ayva.getAxis('R0').value.should.equal(0);
    });

    it('should not scale speed to limit range', async function () {
      ayva.updateLimits('R0', 0.1, 0.9);
      ayva.getAxis('R0').value.should.equal(0.5);

      const result = await ayva.move({
        axis: 'R0',
        speed: 5,
        to: 0,
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

    it('should send output to all connected devices', async function () {
      const secondDevice = {
        write: sinon.fake(),
      };

      ayva.addOutput(secondDevice);

      ayva.getAxis('R0').value.should.equal(0.5);

      const result = await ayva.move({
        axis: 'R0',
        to: 0.4,
        speed: 1,
      });

      expect(result).to.be.true;

      const expected = ['R04800', 'R04600', 'R04400', 'R04200', 'R04000'];

      validateWriteOutput(...expected);

      secondDevice.write.callCount.should.equal(expected.length);
      expected.forEach((tcode, index) => {
        secondDevice.write.args[index][0].should.equal(`${tcode}\n`);
      });

      ayva.getAxis('R0').value.should.equal(0.4);
    });

    it('should allow standard ramp functions', async function () {
      ayva.getAxis('stroke').value.should.equal(0.5);

      await ayva.move({ to: 0, duration: 1, value: Ayva.RAMP_COS });
      ayva.getAxis('stroke').value.should.equal(0);

      await ayva.move({ to: 1, duration: 1, value: Ayva.RAMP_LINEAR });
      ayva.getAxis('stroke').value.should.equal(1);

      await ayva.move({ to: 0.5, duration: 1, value: Ayva.RAMP_PARABOLIC });
      ayva.getAxis('stroke').value.should.equal(0.5);

      await ayva.move({ to: 0, duration: 1, value: Ayva.RAMP_NEGATIVE_PARABOLIC });
      ayva.getAxis('stroke').value.should.equal(0);
    });

    it('should allow tempest motion', async function () {
      // TODO: This doesn't actually test that tempest motion "works".
      //       Feels like somewhat of a code coverage filler. Just tests that there aren't errors.
      ayva.getAxis('stroke').value.should.equal(0.5);

      const value = Ayva.tempestMotion(0.5, 1, 0, 0);

      expect(value.from).to.equal(0.5);
      expect(value.to).to.equal(1);
      expect(value.phase).to.equal(0);
      expect(value.ecc).to.equal(0);

      await ayva.move({ value, duration: 1 });

      round(ayva.getAxis('stroke').value, 2).should.equal(0.5); // One cycle of tempest motion should take me back to start.
    });

    it('should allow tempest motion specified with object', async function () {
      // TODO: This doesn't actually test that tempest motion "works".
      //       Feels like somewhat of a code coverage filler. Just tests that there aren't errors.
      ayva.getAxis('stroke').value.should.equal(0.5);

      const value = Ayva.tempestMotion({ from: 0.5, to: 1 });

      expect(value.from).to.equal(0.5);
      expect(value.to).to.equal(1);
      expect(value.phase).to.equal(0);
      expect(value.ecc).to.equal(0);

      await ayva.move({ value, duration: 1 });

      round(ayva.getAxis('stroke').value, 2).should.equal(0.5); // One cycle of tempest motion should take me back to start.
    });

    it('should allow parabolic motion', async function () {
      // TODO: This doesn't actually test that parabolic motion truly "works".
      //       Feels like somewhat of a code coverage filler. Just tests that there aren't errors.
      ayva.getAxis('stroke').value.should.equal(0.5);

      const value = Ayva.parabolicMotion(0.5, 1, 0, 0);

      expect(value.from).to.equal(0.5);
      expect(value.to).to.equal(1);
      expect(value.phase).to.equal(0);
      expect(value.ecc).to.equal(0);

      await ayva.move({ value, duration: 1 });

      round(ayva.getAxis('stroke').value, 2).should.equal(0.5); // One cycle of tempest motion should take me back to start.
    });

    it('should allow parabolic motion specified with object', async function () {
      // TODO: This doesn't actually test that parabolic motion truly "works".
      //       Feels like somewhat of a code coverage filler. Just tests that there aren't errors.
      ayva.getAxis('stroke').value.should.equal(0.5);

      const value = Ayva.parabolicMotion({ from: 0.5, to: 1 });

      expect(value.from).to.equal(0.5);
      expect(value.to).to.equal(1);
      expect(value.phase).to.equal(0);
      expect(value.ecc).to.equal(0);

      await ayva.move({ value, duration: 1 });

      round(ayva.getAxis('stroke').value, 2).should.equal(0.5); // One cycle of tempest motion should take me back to start.
    });

    it('should allow linear motion', async function () {
      // TODO: This doesn't actually test that linear motion truly "works".
      //       Feels like somewhat of a code coverage filler. Just tests that there aren't errors.
      ayva.getAxis('stroke').value.should.equal(0.5);

      const value = Ayva.linearMotion(0.5, 1, 0, 0);

      expect(value.from).to.equal(0.5);
      expect(value.to).to.equal(1);
      expect(value.phase).to.equal(0);
      expect(value.ecc).to.equal(0);

      await ayva.move({ value, duration: 1 });

      round(ayva.getAxis('stroke').value, 2).should.equal(0.5); // One cycle of tempest motion should take me back to start.
    });

    it('should allow linear motion specified with object', async function () {
      // TODO: This doesn't actually test that linear motion truly "works".
      //       Feels like somewhat of a code coverage filler. Just tests that there aren't errors.
      ayva.getAxis('stroke').value.should.equal(0.5);

      const value = Ayva.linearMotion({ from: 0.5, to: 1 });

      expect(value.from).to.equal(0.5);
      expect(value.to).to.equal(1);
      expect(value.phase).to.equal(0);
      expect(value.ecc).to.equal(0);

      await ayva.move({ value, duration: 1 });

      round(ayva.getAxis('stroke').value, 2).should.equal(0.5); // One cycle of tempest motion should take me back to start.
    });

    it('should allow blending motion', async function () {
      const values1 = [0.0, 0.1, 0.2, 0.3, 0.4];
      const values2 = [0.2, 0.3, 0.4, 0.5, 0.6];

      const provider1 = ({ index }) => values1[index];
      const provider2 = ({ index }) => values2[index];

      const blended = Ayva.blendMotion(provider1, provider2, 0.5);

      expect(blended({ index: 0 })).to.equal(0.1);
      expect(blended({ index: 1 })).to.equal(0.2);
      expect(blended({ index: 2 })).to.equal(0.3);
      expect(blended({ index: 3 })).to.equal(0.4);
      expect(blended({ index: 4 })).to.equal(0.5);
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
      // Thou shalt not repeat thyself?
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

    it('should synchronize movements using the sync property (while using max duration)', async function () {
      ayva.getAxis('L0').value.should.equal(0.5);
      ayva.getAxis('R0').value.should.equal(0.5);
      ayva.getAxis('R1').value.should.equal(0.5);

      const strokeValues = [0.475, 0.450, 0.425];
      const twistValues = [0.480, 0.460, 0.440, 0, 0];
      const rollValues = [0.485, 0.465, 0.445, 0, 0];

      const strokeValueProvider = sinon.fake((parameters) => strokeValues[parameters.index]);
      const twistValueProvider = sinon.fake((parameters) => twistValues[parameters.index]);
      const rollValueProvider = sinon.fake((parameters) => rollValues[parameters.index]);

      const result = await ayva.move({
        axis: 'L0',
        value: strokeValueProvider,
        duration: 0.06,
      }, {
        axis: 'R1',
        value: rollValueProvider,
        sync: 'R0',
      }, {
        axis: 'R0',
        value: twistValueProvider,
      });

      expect(result).to.be.true;

      validateWriteOutput(
        'L04750 R14850 R04800',
        'L04500 R14650 R04600',
        'L04250 R14450 R04400',
      );

      ayva.getAxis('L0').value.should.equal(0.4250);
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
      ayva.getAxis('testBooleanAxis').value.should.equal(false);
      ayva.getAxis('testBooleanAxis2').value.should.equal(false);

      const result = await ayva.move({
        axis: 'testBooleanAxis',
        to: true,
      }, {
        axis: 'testBooleanAxis2',
        to: true,
      });

      expect(result).to.be.true;

      validateWriteOutput('B19999 B29999');

      ayva.getAxis('testBooleanAxis').value.should.equal(true);
      ayva.getAxis('testBooleanAxis2').value.should.equal(true);
    });

    it('should send valid movements in correct order for multiple calls to move()', async function () {
      ayva.getAxis('L0').value.should.equal(0.5);
      ayva.getAxis('R0').value.should.equal(0.5);
      ayva.getAxis('A0').value.should.equal(0);

      const result = await Promise.all([
        ayva.move({ axis: 'L0', to: 0, duration: 0.1 }),
        ayva.move({ axis: 'R0', to: 0, duration: 0.1 }),
        ayva.move({ axis: 'A0', to: 0.5, duration: 0.1 }),
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
        'A01000',
        'A02000',
        'A03000',
        'A04000',
        'A05000'
      );

      ayva.getAxis('L0').value.should.equal(0.0);
      ayva.getAxis('R0').value.should.equal(0.0);
      ayva.getAxis('A0').value.should.equal(0.5);
    });
  });

  describe('#stop()', function () {
    it('should cancel all movements', async function () {
      ayva.getAxis('L0').value.should.equal(0.5);
      ayva.getAxis('R0').value.should.equal(0.5);
      ayva.getAxis('A0').value.should.equal(0);

      const promise = Promise.all([
        ayva.move({ axis: 'L0', to: 0, duration: 0.1 }),
        ayva.move({ axis: 'R0', to: 0, duration: 0.1 }),
        ayva.move({ axis: 'A0', to: 0.5, duration: 0.1 }),
      ]);

      ayva.stop();

      const result = await promise;

      expect(result).to.deep.equal([false, false, false]);

      // The first move should have only had time to complete one step.
      // The rest of the moves should have been cancelled before even starting.
      validateWriteOutput('L04000');

      ayva.getAxis('L0').value.should.equal(0.400);
      ayva.getAxis('R0').value.should.equal(0.500);
      ayva.getAxis('A0').value.should.equal(0.000);

      // Make sure a call to stop() does not prevent additional moves.
      const retry = await ayva.move({ axis: 'L0', to: 0, duration: 0.1 });
      expect(retry).to.equal(true);
      ayva.getAxis('L0').value.should.equal(0.0);
    });

    it('should cancel pending movements', async function () {
      ayva.getAxis('L0').value.should.equal(0.5);
      ayva.getAxis('R0').value.should.equal(0.5);
      ayva.getAxis('A0').value.should.equal(0);

      const promise = Promise.all([
        ayva.move({ axis: 'L0', to: 0, duration: 0.1 }),
        ayva.move({
          axis: 'R0',
          value: () => {
            ayva.stop();
          },
          duration: 0.1,
        }),
        ayva.move({ axis: 'A0', to: 0.5, duration: 0.1 }),
      ]);

      const result = await promise;

      expect(result).to.deep.equal([true, false, false]);

      // The first move should have completed successfully, while the rest should have been cancelled.
      validateWriteOutput('L04000', 'L03000', 'L02000', 'L01000', 'L00000');

      ayva.getAxis('L0').value.should.equal(0.0);
      ayva.getAxis('R0').value.should.equal(0.500);
      ayva.getAxis('A0').value.should.equal(0.000);
    });

    it('should reset axes configured with resetOnStop = true', async function () {
      ayva.configureAxis({
        name: 'V0',
        type: 'auxiliary',
        alias: 'vibe0',
        resetOnStop: true,
      });

      ayva.getAxis('L0').value.should.equal(0.5);
      ayva.getAxis('V0').value.should.equal(0);

      const promise = ayva.move(
        { axis: 'L0', to: 0, duration: 0.1 },
        { axis: 'V0', to: 0.5 }
      );

      ayva.stop();

      const result = await promise;

      expect(result).to.equal(false);

      validateWriteOutput('L04000 V01000', 'V00000');

      ayva.getAxis('L0').value.should.equal(0.4);
      ayva.getAxis('V0').value.should.equal(0);
    });
  });
});
