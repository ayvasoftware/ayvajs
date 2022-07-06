import '../setup-chai.js';
import sinon from 'sinon';
import Ayva from '../../src/ayva.js';
import { createFunctionBinder } from '../test-helpers.js';

/**
 * Contains all tests for Ayva's Device API.
 */
describe('Device Protocols', function () {
  let ayva;
  let testAddDevice;

  beforeEach(function () {
    ayva = new Ayva();
    testAddDevice = createFunctionBinder(ayva, 'addOutputDevices');
  });

  afterEach(function () {
    sinon.restore();
  });

  /**
   * Adding Devices
   */
  describe('#addOutputDevices', function () {
    it('should throw an error when invalid device is added', function () {
      testAddDevice(undefined).should.throw(Error, 'Invalid device: undefined');
      testAddDevice({}).should.throw(Error, 'Invalid device: [object Object]');
      testAddDevice(42).should.throw(Error, 'Invalid device: 42');
      testAddDevice({ write: 42 }).should.throw(Error, 'Invalid device: [object Object]');

      // Happy paths.
      testAddDevice({ write: function () {} }).should.not.throw(Error);
      testAddDevice(function () {}).should.not.throw(Error);
    });
  });

  it('#getOutputDevices()', function () {
    // TODO: This test is testing too many things. Break out.
    const device = { write: function () {} };
    const device2 = { write: function () {} };
    const device3 = function () {};

    ayva.addOutputDevice(device);

    let devices = ayva.getOutputDevices();

    devices.length.should.equal(1);
    devices[0].should.equal(device);

    ayva.addOutputDevice(device2);

    devices = ayva.getOutputDevices();

    devices.length.should.equal(2);
    devices[0].should.equal(device);
    devices[1].should.equal(device2);

    ayva.removeOutputDevice(device);

    devices = ayva.getOutputDevices();

    devices.length.should.equal(1);
    devices[0].should.equal(device2);

    ayva.addOutputDevice(device3);
    devices = ayva.getOutputDevices();
    devices.length.should.equal(2);
    devices[1].should.deep.equal({ write: device3 });
  });
});
