import 'chai/register-should.js';
import sinon from 'sinon';
import Ayva from '../src/ayva.js';

/**
 * Contains all tests for Ayva's Device API.
 */
describe('Device Protocols', function () {
  let ayva;

  beforeEach(function () {
    ayva = new Ayva();
  });

  afterEach(function () {
    sinon.restore();
  });

  /**
   * Adding Devices
   */
  describe('#addOutputDevices', function () {
    it('should throw an error when invalid device is added', function () {
      const testAddDevice = function (device) {
        return function () {
          ayva.addOutputDevices(device);
        };
      };

      testAddDevice().should.throw(Error, 'Invalid device: undefined');
      testAddDevice({}).should.throw(Error, 'Invalid device: [object Object]');
      testAddDevice(42).should.throw(Error, 'Invalid device: 42');
      testAddDevice({ write: 42 }).should.throw(Error, 'Invalid device: [object Object]');

      // Happy path.
      testAddDevice({ write: function () {} }).should.not.throw(Error);
    });
  });

  /**
   * Writing Output
   */
  describe('#write', function () {
    const testWrite = function (command) {
      return function () {
        ayva.write(command);
      };
    };

    it('should throw an error when there are no output devices', function () {
      testWrite().should.throw(Error, 'No output devices have been added.');
    });

    it('should throw an error when there is an output device but an invalid command is passed', function () {
      ayva.addOutputDevices({ write: function () {} });

      // Falsey Values
      testWrite().should.throw(Error, 'Invalid command: undefined');
      testWrite(null).should.throw(Error, 'Invalid command: null');
      testWrite(0).should.throw(Error, 'Invalid command: 0');
      testWrite(false).should.throw(Error, 'Invalid command: false');

      // Truthy non-strings
      testWrite(true).should.throw(Error, 'Invalid command: true');
      testWrite(1).should.throw(Error, 'Invalid command: 1');
      testWrite({}).should.throw(Error, 'Invalid command: [object Object]');

      // Empty strings
      testWrite('').should.throw(Error, 'Cannot send a blank command.');
      testWrite(' ').should.throw(Error, 'Cannot send a blank command.');

      // Happy path
      testWrite('COMMAND').should.not.throw(Error);
    });

    it('should write valid commands to all output devices', function () {
      const COMMAND_COUNT = 5;

      const device = {
        write: sinon.fake(),
      };

      const anotherDevice = {
        write: sinon.fake(),
      };

      ayva.addOutputDevices(device, anotherDevice);

      for (let i = 1; i <= COMMAND_COUNT; i++) {
        const testCommand = `COMMAND${i}`;

        ayva.write(testCommand);

        device.write.callCount.should.equal(i);
        device.write.lastArg.should.equal(testCommand);
        anotherDevice.write.callCount.should.equal(i);
        anotherDevice.write.lastArg.should.equal(testCommand);
      }
    });
  });
});
