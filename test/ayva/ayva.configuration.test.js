/* eslint-disable no-unused-expressions */
import { Blob } from 'buffer';
import '../setup-chai.js';
import Ayva from '../../src/ayva.js';
import WorkerTimer from '../../src/util/worker-timer.js';
import OSR_CONFIG from '../../src/util/osr-config.js';
import { createTestConfig, createFunctionBinder, mockSleep } from '../test-helpers.js';

/**
 * Contains all tests for Ayva's Axis Configuration.
 */
describe('Configuration Tests', function () {
  const TEST_CONFIG = createTestConfig();

  describe('#constructor', function () {
    it('should set a valid configuration', function () {
      const ayva = new Ayva(TEST_CONFIG);

      expect(ayva.name).to.equal('OSR2');
      expect(ayva.defaultAxis).to.equal('L0');
      expect(ayva.frequency).to.equal(50);
      expect(ayva.period).to.equal(0.02);

      for (const axis of TEST_CONFIG.axes) {
        const storedAxis = ayva.getAxis(axis.name);

        expect(storedAxis).to.not.be.undefined;
        expect(storedAxis.alias).to.equal(axis.alias);
        expect(storedAxis.name).to.equal(axis.name);
        expect(storedAxis.type).to.equal(axis.type);
        expect(storedAxis.max).to.equal(1);
        expect(storedAxis.min).to.equal(0);

        expect(ayva.$[axis.name]).to.not.be.undefined;

        const $axis = ayva.$[axis.name];

        expect($axis.max).to.equal(1);
        expect($axis.min).to.equal(0);

        if (storedAxis.type === 'boolean') {
          expect($axis.value).to.equal(false);
          expect($axis.defaultValue).to.equal(false);
          expect(storedAxis.defaultValue).to.equal(false);
        } else if (storedAxis.type === 'auxiliary') {
          expect($axis.value).to.equal(0);
          expect($axis.defaultValue).to.equal(0);
          expect(storedAxis.defaultValue).to.equal(0);
        } else {
          expect($axis.value).to.equal(0.5);
          expect($axis.defaultValue).to.equal(0.5);
          expect(storedAxis.defaultValue).to.equal(0.5);
        }
      }
    });
  });

  describe('#configureAxis', function () {
    let config;
    let expectedConfig;
    let ayva;
    let testConfigureAxis;

    const invalidConfigMessage = 'Invalid configuration object';
    const invalidParametersMessage = 'Invalid configuration parameter(s)';
    const missingParametersMessage = 'Configuration is missing properties';

    beforeEach(function () {
      config = {
        name: 'L0',
        type: 'linear',
        alias: 'stroke',
        max: 1,
        min: 0,
      };

      expectedConfig = {
        ...config, value: 0.5, lastValue: 0.5, defaultValue: 0.5,
      };

      ayva = new Ayva();

      testConfigureAxis = createFunctionBinder(ayva, 'configureAxis');
    });

    it('should throw an error when invalid configuration is passed', function () {
      testConfigureAxis().should.throw(Error, `${invalidConfigMessage}: undefined`);
      testConfigureAxis(null).should.throw(Error, `${invalidConfigMessage}: null`);
      testConfigureAxis('foo').should.throw(Error, `${invalidConfigMessage}: foo`);
      testConfigureAxis(42).should.throw(Error, `${invalidConfigMessage}: 42`);
    });

    it('should throw an error when required parameters are missing', function () {
      testConfigureAxis({}).should.throw(Error, `${missingParametersMessage}: name, type`);
      testConfigureAxis({ name: null, type: null }).should.throw(Error, `${missingParametersMessage}: name, type`);
      testConfigureAxis({ name: 'L0' }).should.throw(Error, `${missingParametersMessage}: type`);
      testConfigureAxis({ type: 'linear' }).should.throw(Error, `${missingParametersMessage}: name`);
    });

    it('should throw an error when parameters are of an invalid type', function () {
      config.name = 42;
      testConfigureAxis(config).should.throw(Error, `${invalidParametersMessage}: name = 42`);

      config.type = false;
      testConfigureAxis(config).should.throw(Error, `${invalidParametersMessage}: name = 42, type = false`);

      config.alias = {};
      testConfigureAxis(config).should.throw(Error, `${invalidParametersMessage}: alias = [object Object], name = 42, type = false`);

      config.max = NaN;
      testConfigureAxis(config).should.throw(
        Error,
        `${invalidParametersMessage}: alias = [object Object], max = NaN, name = 42, type = false`
      );

      config.min = {};
      testConfigureAxis(config).should.throw(
        Error,
        `${invalidParametersMessage}: alias = [object Object], max = NaN, min = [object Object], name = 42, type = false`
      );
    });

    it('should throw an error when default value is of an invalid type', function () {
      config.defaultValue = 42;
      testConfigureAxis(config).should.throw(Error, `${invalidParametersMessage}: defaultValue = 42`);

      config.defaultValue = false;
      testConfigureAxis(config).should.throw(Error, `${invalidParametersMessage}: defaultValue = false`);

      // Boolean axis allows boolean default values, but not numerical.
      config.type = 'boolean';
      testConfigureAxis(config).should.not.throw(Error);
      config.defaultValue = 0.5;
      testConfigureAxis(config).should.throw(Error, `${invalidParametersMessage}: defaultValue = 0.5`);

      config.type = 'linear';
      config.defaultValue = {};
      testConfigureAxis(config).should.throw(Error, `${invalidParametersMessage}: defaultValue = [object Object]`);
    });

    it('should throw an error when min and max are the same', function () {
      config.min = 1;
      config.max = 1;
      testConfigureAxis(config).should.throw(Error, `${invalidParametersMessage}: max = 1, min = 1`);
    });

    it('should throw an error when name or alias is invalid', function () {
      config.name = '0L';
      testConfigureAxis(config).should.throw(Error, `${invalidParametersMessage}: name = 0L`);

      config.name = 'L-0';
      testConfigureAxis(config).should.throw(Error, `${invalidParametersMessage}: name = L-0`);

      config.name = 'L0';
      config.alias = '0L';
      testConfigureAxis(config).should.throw(Error, `${invalidParametersMessage}: alias = 0L`);

      config.alias = 'L-0';
      testConfigureAxis(config).should.throw(Error, `${invalidParametersMessage}: alias = L-0`);
    });

    it('should allow a valid configuration to be retrieved by name or alias', function () {
      ayva.configureAxis(config);
      let axis = ayva.getAxis('L0');

      expect(axis).to.not.be.null;
      expect(axis).to.not.be.undefined;
      axis.should.deep.equal(expectedConfig);

      axis = ayva.getAxis('stroke');

      expect(axis).to.not.be.null;
      expect(axis).to.not.be.undefined;
      axis.should.deep.equal(expectedConfig);
    });

    it('should not keep a reference to the config parameter', function () {
      ayva.configureAxis(config);
      const axis = ayva.getAxis('stroke');
      axis.should.deep.equal(expectedConfig);

      config.alias = 'newAlias';
      axis.alias.should.not.equal(config.alias);
    });

    it('should remove old alias when updating configuration with a new alias', function () {
      ayva.configureAxis(config);
      const axis = ayva.getAxis('stroke');
      axis.should.deep.equal(expectedConfig);

      config.alias = 'newAlias';
      expectedConfig.alias = config.alias;
      ayva.configureAxis(config);

      expect(ayva.getAxis('stroke')).to.be.undefined;
      expect(ayva.getAxis('newAlias')).to.deep.equal(expectedConfig);
    });

    it('should set default values for max and min when not present', function () {
      const configWithoutMinOrMax = {
        name: 'L0',
        type: 'linear',
      };

      ayva.configureAxis(configWithoutMinOrMax);

      const result = ayva.getAxis('L0');

      expect(result.min).to.equal(0);
      expect(result.max).to.equal(1);
    });

    it('should allow configuring default value', function () {
      const configWithDefault = {
        name: 'Z0',
        type: 'linear',
        defaultValue: 0.25,
      };

      ayva.configureAxis(configWithDefault);

      const result = ayva.getAxis('Z0');

      expect(result.defaultValue).to.equal(0.25);
      expect(result.value).to.equal(0.25);
      expect(result.lastValue).to.equal(0.25);
    });

    it('should only allow linear, rotation, auxiliary, or boolean for axis type', function () {
      const invalidConfig = {
        name: 'L0',
        type: 'badtype',
      };

      testConfigureAxis(invalidConfig).should.throw(Error, 'Invalid type. Must be linear, rotation, auxiliary, or boolean: badtype');
    });

    it('should disallow invalid limits', function () {
      config.min = 0.5;
      config.max = 0.5;

      testConfigureAxis(config).should.throw(Error, `${invalidParametersMessage}: max = 0.5, min = 0.5`);

      config.min = -1;
      testConfigureAxis(config).should.throw(Error, `${invalidParametersMessage}: min = -1`);

      config.max = 2;
      testConfigureAxis(config).should.throw(Error, `${invalidParametersMessage}: max = 2, min = -1`);

      config.max = 0.2;
      config.min = 0.3;
      testConfigureAxis(config).should.throw(Error, `${invalidParametersMessage}: max = 0.2, min = 0.3`);
    });

    it('should disallow changing configuration through object', function () {
      ayva.configureAxis(config);
      const fetchedConfig = ayva.getAxis(config.name);
      expect(fetchedConfig).to.deep.equal(expectedConfig);

      Object.keys(fetchedConfig).forEach((key) => {
        (function () { fetchedConfig[key] = 'CHANGE'; }).should.throw(Error, /Cannot assign to read only property.*/);
      });
    });

    it('should disallow alias name clashes with other axes', function () {
      const config1 = {
        name: 'L0',
        type: 'linear',
      };

      const config2 = {
        name: 'L1',
        alias: 'L0',
        type: 'linear',
      };

      ayva.configureAxis(config1);
      testConfigureAxis(config2).should.throw(Error, 'Alias already refers to another axis: L0');

      config1.alias = 'stroke';
      config2.alias = 'stroke';

      ayva.configureAxis(config1);
      testConfigureAxis(config2).should.throw(Error, 'Alias already refers to another axis: stroke');
    });

    it('should retain value after reconfiguring axis', async function () {
      mockSleep(ayva);
      ayva.addOutputDevice({ write: () => {} });

      ayva.configureAxis({
        name: 'L0',
        type: 'linear',
      });

      ayva.getAxis('L0').value.should.equal(0.5);
      await ayva.move({ axis: 'L0', to: 0, speed: 1 });
      ayva.getAxis('L0').value.should.equal(0);

      ayva.configureAxis({
        name: 'L0',
        type: 'linear',
        alias: 'newAlias',
      });

      ayva.getAxis('newAlias').value.should.equal(0);
    });
  });

  describe('#updateLimits', function () {
    it('should disallow invalid limits', function () {
      const ayva = new Ayva(TEST_CONFIG);

      ayva.getAxis('L0').min.should.equal(0);
      ayva.getAxis('L0').max.should.equal(1);

      const invalidLimits = [null, undefined, -1, 2, true, false, NaN, {}, () => {}];
      const testUpdateLimits = createFunctionBinder(ayva, 'updateLimits');

      for (const min of invalidLimits) {
        testUpdateLimits('L0', min, 1).should.throw(Error, `Invalid limits: min = ${min}, max = 1`);
      }

      for (const max of invalidLimits) {
        testUpdateLimits('L0', 0, max).should.throw(Error, `Invalid limits: min = 0, max = ${max}`);
      }

      for (let i = 0; i <= 1; i += 0.1) {
        testUpdateLimits('L0', i, i).should.throw(Error, `Invalid limits: min = ${i}, max = ${i}`);
      }

      testUpdateLimits('F0', 0, 1).should.throw(Error, 'Invalid axis: F0');
    });

    it('should allow updating valid limits', function () {
      const ayva = new Ayva(TEST_CONFIG);

      ayva.getAxis('L0').min.should.equal(0);
      ayva.getAxis('L0').max.should.equal(1);

      ayva.updateLimits('L0', 0.25, 0.75);

      ayva.getAxis('L0').min.should.equal(0.25);
      ayva.getAxis('L0').max.should.equal(0.75);

      ayva.updateLimits('L0', 0.8, 0.2);

      ayva.getAxis('L0').min.should.equal(0.2);
      ayva.getAxis('L0').max.should.equal(0.8);
    });

    it('should disallow changes through the axes property', function () {
      const ayva = new Ayva(TEST_CONFIG);

      ayva.getAxis('L0').min.should.equal(0);
      ayva.axes.L0.min.should.equal(0);

      const testAssign = function () {
        ayva.axes.L0.min = 9;
      };

      testAssign.should.throw('Cannot assign to read only property \'min\' of object \'#<Object>\'');
    });
  });

  describe('#defaultConfiguraion', function () {
    it('should allow using a default configuration', function () {
      const ayva = new Ayva().defaultConfiguration();

      expect(ayva.name).to.equal('SR6');
      expect(ayva.defaultAxis).to.equal('L0');
    });

    it('should have a default configuration static property', function () {
      expect(Ayva.defaultConfiguration).to.deep.equal(OSR_CONFIG);
    });
  });

  describe('#timers', function () {
    it('should create a worker timer if global Worker class is available.', async function () {
      global.Worker = class {};
      global.Blob = Blob;

      const ayva = new Ayva().defaultConfiguration();
      expect(ayva.getTimer() instanceof WorkerTimer).to.be.true;

      delete global.Worker;
      delete global.Blob;
    });

    it('should create an internal timer if no global Worker class is available.', function () {
      const ayva = new Ayva().defaultConfiguration();

      expect(ayva.getTimer() instanceof WorkerTimer).to.be.false;
    });
  });
});
