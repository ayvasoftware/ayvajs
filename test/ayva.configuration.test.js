/* eslint-disable no-unused-expressions */
import 'chai/register-should.js';
import 'chai/register-expect.js';
import Ayva from '../src/ayva.js';
import { OSR2 } from '../src/ayva-configs.js';

/**
 * Contains all tests for Ayva's Axis Configuration.
 */
describe('Configuration Tests', function () {
  const DEFAULT_VALUE = 0.5; // The default value for linear, auxiliary, and rotation axes.

  describe('#constructor', function () {
    it('should set a valid configuration', function () {
      const ayva = new Ayva(OSR2);

      expect(ayva.name).to.equal('OSR2');
      expect(ayva.defaultAxis).to.equal('L0');
      expect(ayva.getFrequency()).to.equal(50);

      for (const axis of OSR2.axes) {
        const storedAxis = ayva.getAxis(axis.name);

        expect(storedAxis).to.not.be.undefined;
        expect(storedAxis.alias).to.equal(axis.alias);
        expect(storedAxis.name).to.equal(axis.name);
        expect(storedAxis.type).to.equal(axis.type);
        expect(storedAxis.max).to.equal(1);
        expect(storedAxis.min).to.equal(0);
      }
    });
  });

  describe('#configureAxis', function () {
    let config;
    let expectedConfig;
    let ayva;

    const invalidConfigMessage = 'Invalid configuration object';
    const invalidParametersMessage = 'Invalid configuration parameter(s)';
    const missingParametersMessage = 'Configuration is missing properties';

    const testConfigureAxis = function (c) {
      return function () {
        ayva.configureAxis(c);
      };
    };

    beforeEach(function () {
      config = {
        name: 'L0',
        type: 'linear',
        alias: 'stroke',
        max: 1,
        min: 0,
      };

      expectedConfig = { ...config, value: DEFAULT_VALUE };

      ayva = new Ayva();
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

      config.max = 'not a number';
      testConfigureAxis(config).should.throw(
        Error,
        `${invalidParametersMessage}: alias = [object Object], max = not a number, name = 42, type = false`
      );

      config.min = {};
      testConfigureAxis(config).should.throw(
        Error,
        `${invalidParametersMessage}: alias = [object Object], max = not a number, min = [object Object], name = 42, type = false`
      );
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
  });
});
