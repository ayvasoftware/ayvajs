/* eslint-disable no-unused-expressions */
import '../setup-chai.js';
import sinon from 'sinon';
import Ayva from '../../src/ayva.js';
import MoveBuilder from '../../src/util/move-builder.js';
import { createTestConfig, mockMove, mockSleep } from '../test-helpers.js';

describe('Move Builder Tests', function () {
  let ayva;
  let moveBuilder;
  let write;

  beforeEach(function () {
    write = sinon.fake();
    ayva = new Ayva(createTestConfig());
    ayva.defaultRamp = Ayva.RAMP_LINEAR;
    ayva.addOutput({ write });
    mockMove(ayva);

    moveBuilder = ayva.moveBuilder();
  });

  afterEach(function () {
    sinon.restore();
  });

  describe('#constructor', function () {
    it('should create functions for each axis', function () {
      createTestConfig().axes.forEach((axis) => {
        expect(moveBuilder).to.have.property(axis.name);
        expect(moveBuilder[axis.name]).to.be.a('function');

        expect(moveBuilder).to.have.property(axis.alias);
        expect(moveBuilder[axis.alias]).to.be.a('function');
      });
    });

    it('should allow creating moveBuilder from special property $.', function () {
      createTestConfig().axes.forEach((axis) => {
        expect(ayva.$).to.have.property(axis.name);
        expect(ayva.$[axis.name]).to.be.a('function');

        expect(ayva.$).to.have.property(axis.alias);
        expect(ayva.$[axis.alias]).to.be.a('function');

        expect(ayva.$[axis.name](0) instanceof MoveBuilder).to.be.true;
        expect(ayva.$[axis.alias](0) instanceof MoveBuilder).to.be.true;
      });
    });
  });

  describe('#configureAxis', function () {
    it('should remove alias property on $ when reconfiguring axis', function () {
      expect(ayva.$).to.have.property('stroke');
      expect(ayva.$).to.not.have.property('newAlias');

      ayva.configureAxis({
        name: 'L0',
        alias: 'newAlias',
        type: 'linear',
      });

      expect(ayva.$).to.not.have.property('stroke');
      expect(ayva.$).to.have.property('newAlias');
    });
  });

  describe('#execute() (single axis)', function () {
    it('should call ayva.move() with correct parameters <to, duration, value>', function () {
      const value = function () { };
      ayva.$.stroke(0, 1, value).execute();

      ayva.move.callCount.should.equal(1);

      expect(ayva.move.args[0][0]).to.deep.equal({
        axis: 'stroke',
        to: 0,
        duration: 1,
        value,
      });
    });

    it('should call ayva.move() with correct parameters <to, duration>', function () {
      ayva.$.roll(0, 1).execute();

      ayva.move.callCount.should.equal(1);

      expect(ayva.move.args[0][0]).to.deep.equal({
        axis: 'roll',
        to: 0,
        duration: 1,
      });
    });

    it('should call ayva.move() with correct parameters <to, value>', function () {
      const value = function () { };
      ayva.$.stroke(0, value).execute();

      ayva.move.callCount.should.equal(1);

      expect(ayva.move.args[0][0]).to.deep.equal({
        axis: 'stroke',
        to: 0,
        value,
      });
    });

    it('should call ayva.move() with correct parameters <to>', function () {
      ayva.$.twist(0).execute();

      ayva.move.callCount.should.equal(1);

      expect(ayva.move.args[0][0]).to.deep.equal({
        axis: 'twist',
        to: 0,
      });
    });

    it('should call ayva.move() with correct parameters <value, duration>', function () {
      const value = function () { };
      ayva.$.sway(value, 1).execute();

      ayva.move.callCount.should.equal(1);

      expect(ayva.move.args[0][0]).to.deep.equal({
        axis: 'sway',
        value,
        duration: 1,
      });
    });

    it('should call ayva.move() with correct parameters <value>', function () {
      const value = function () { };
      ayva.$.L0(value).execute();

      ayva.move.callCount.should.equal(1);

      expect(ayva.move.args[0][0]).to.deep.equal({
        axis: 'L0',
        value,
      });
    });

    it('should call ayva.move() with correct parameters <object>', function () {
      const move = {
        to: 0,
        speed: 1,
      };
      ayva.$.stroke(move).execute();

      ayva.move.callCount.should.equal(1);

      expect(ayva.move.args[0][0]).to.deep.equal({
        axis: 'stroke',
        ...move,
      });
    });

    it('should throw error when invalid arguments', function () {
      let testInvalid = function () {
        ayva.$.stroke('invalid').execute();
      };

      testInvalid.should.throw('Invalid arguments: invalid');

      testInvalid = function () {
        ayva.$.stroke(0, 1, 'invalid').execute();
      };

      testInvalid.should.throw('Invalid arguments: 0,1,invalid');
    });

    it('should ignore axis specified when object', function () {
      const move = {
        axis: 'ignored',
        to: 0,
        speed: 1,
      };

      ayva.$.stroke(move).execute();

      ayva.move.callCount.should.equal(1);

      expect(ayva.move.args[0][0]).to.deep.equal({
        axis: 'stroke',
        to: 0,
        speed: 1,
      });
    });

    it('should allow accessing value, min, and max through builder', async function () {
      sinon.restore();
      mockSleep(ayva);

      expect(ayva.$.stroke).to.have.property('value');
      expect(ayva.$.stroke).to.have.property('max');
      expect(ayva.$.stroke).to.have.property('min');

      ayva.$.stroke.value.should.equal(0.5);
      ayva.$.stroke.lastValue.should.equal(0.5);
      ayva.$.stroke.max.should.equal(1);
      ayva.$.stroke.min.should.equal(0);

      await ayva.$.stroke(0, 1).execute();

      ayva.$.stroke.value.should.equal(0);
      ayva.$.stroke.lastValue.should.equal(0.01);

      ayva.updateLimits('stroke', 0.1, 0.9);
      ayva.$.stroke.max.should.equal(0.9);
      ayva.$.stroke.min.should.equal(0.1);
    });

    it('should allow updating value directly', function () {
      ayva.$.stroke.value.should.equal(0.5);

      ayva.$.stroke.value = 0.2;

      ayva.$.stroke.value.should.equal(0.2);
      ayva.$.stroke.lastValue.should.equal(0.5);
      write.callCount.should.equal(1);
      write.args[0][0].should.equal('L02000\n');

      ayva.$.testBooleanAxis.value.should.equal(false);

      ayva.$.testBooleanAxis.value = true;

      ayva.$.testBooleanAxis.value.should.equal(true);
      write.callCount.should.equal(2);
      write.args[1][0].should.equal('B19999\n');

      ayva.$.testBooleanAxis.value = false;

      ayva.$.testBooleanAxis.value.should.equal(false);
      write.callCount.should.equal(3);
      write.args[2][0].should.equal('B10000\n');
    });

    it('should prevent invalid values when updating value directly', function () {
      ayva.$.stroke.value.should.equal(0.5);

      [null, undefined, 'bad', '', false, true, () => {}, NaN, Infinity, -1, 2].forEach((invalidValue) => {
        (function () {
          ayva.$.stroke.value = invalidValue;
        }).should.throw(`Invalid value: ${invalidValue}`);
      });
    });

    it('should allow bulk updates of values directly', function () {
      ayva.$.stroke.value.should.equal(0.5);
      ayva.$.twist.value.should.equal(0.5);

      ayva.setValues({
        stroke: 0.2,
        twist: 0.4,
      });

      ayva.$.stroke.value.should.equal(0.2);
      ayva.$.stroke.lastValue.should.equal(0.5);
      ayva.$.twist.value.should.equal(0.4);
      ayva.$.twist.lastValue.should.equal(0.5);
      write.callCount.should.equal(1);
      write.args[0][0].should.equal('L02000 R04000\n');
    });

    it('should not allow setting invalid values', function () {
      ayva.$.stroke.value.should.equal(0.5);

      ayva.setValues({
        stroke: 0,
        twist: NaN,
      });

      ayva.$.stroke.value.should.equal(0);
      ayva.$.twist.value.should.equal(0.5);
    });
  });

  describe('#execute() (multi axis)', function () {
    it('should call ayva.move() with correct parameters (multi axis)', function () {
      const value = function () { };
      ayva.$.stroke(0, 1).twist(0).roll(value).execute();

      ayva.move.callCount.should.equal(1);

      expect(ayva.move.args[0]).to.deep.equal([{
        axis: 'stroke',
        to: 0,
        duration: 1,
      }, {
        axis: 'twist',
        to: 0,
      }, {
        axis: 'roll',
        value,
      }]);
    });
  });
});
