/* eslint-disable no-unused-expressions */
import '../setup-chai.js';
import sinon from 'sinon';
import Ayva from '../../src/ayva.js';
import { TEST_CONFIG } from '../test-helpers.js';

describe('Move Builder Tests', function () {
  let ayva;
  let moveBuilder;

  beforeEach(function () {
    ayva = new Ayva(TEST_CONFIG());
    sinon.replace(ayva, 'move', sinon.fake());

    moveBuilder = ayva.moveBuilder();
  });

  afterEach(function () {
    sinon.restore();
  });

  describe('#constructor', function () {
    it('should create functions for each axis', function () {
      TEST_CONFIG().axes.forEach((axis) => {
        expect(moveBuilder).to.have.property(axis.name);
        expect(moveBuilder[axis.name]).to.be.a('function');

        expect(moveBuilder).to.have.property(axis.alias);
        expect(moveBuilder[axis.alias]).to.be.a('function');
      });
    });
  });

  describe('#execute() (single axis', function () {
    it('should call ayva.move() with correct parameters <to, speed, value>', function () {
      const value = function () { };
      moveBuilder.stroke(0, 1, value).execute();

      ayva.move.callCount.should.equal(1);

      expect(ayva.move.args[0][0]).to.deep.equal({
        axis: 'stroke',
        to: 0,
        speed: 1,
        value,
      });
    });

    it('should call ayva.move() with correct parameters <to, speed>', function () {
      moveBuilder.roll(0, 1).execute();

      ayva.move.callCount.should.equal(1);

      expect(ayva.move.args[0][0]).to.deep.equal({
        axis: 'roll',
        to: 0,
        speed: 1,
      });
    });

    it('should call ayva.move() with correct parameters <to, value>', function () {
      const value = function () { };
      moveBuilder.stroke(0, value).execute();

      ayva.move.callCount.should.equal(1);

      expect(ayva.move.args[0][0]).to.deep.equal({
        axis: 'stroke',
        to: 0,
        value,
      });
    });

    it('should call ayva.move() with correct parameters <to>', function () {
      moveBuilder.twist(0).execute();

      ayva.move.callCount.should.equal(1);

      expect(ayva.move.args[0][0]).to.deep.equal({
        axis: 'twist',
        to: 0,
      });
    });

    it('should call ayva.move() with correct parameters <value, duration>', function () {
      const value = function () { };
      moveBuilder.left(value, 1).execute();

      ayva.move.callCount.should.equal(1);

      expect(ayva.move.args[0][0]).to.deep.equal({
        axis: 'left',
        value,
        duration: 1,
      });
    });

    it('should call ayva.move() with correct parameters <value>', function () {
      const value = function () { };
      moveBuilder.L0(value).execute();

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
      moveBuilder.stroke(move).execute();

      ayva.move.callCount.should.equal(1);

      expect(ayva.move.args[0][0]).to.deep.equal({
        axis: 'stroke',
        ...move,
      });
    });

    it('should throw error when invalid arguments', function () {
      let testInvalid = function () {
        moveBuilder.stroke('invalid').execute();
      };

      testInvalid.should.throw('Invalid arguments: invalid');

      testInvalid = function () {
        moveBuilder.stroke(0, 1, 'invalid').execute();
      };

      testInvalid.should.throw('Invalid arguments: 0,1,invalid');
    });

    it('should ignore axis specified when object', function () {
      const move = {
        axis: 'ignored',
        to: 0,
        speed: 1,
      };

      moveBuilder.stroke(move).execute();

      ayva.move.callCount.should.equal(1);

      expect(ayva.move.args[0][0]).to.deep.equal({
        axis: 'stroke',
        to: 0,
        speed: 1,
      });
    });
  });

  describe('#execute() (multi axis)', function () {
    it('should call ayva.move() with correct parameters (multi axis)', function () {
      const value = function () { };
      moveBuilder.stroke(0, 1).twist(0).roll(value).execute();

      ayva.move.callCount.should.equal(1);

      expect(ayva.move.args[0]).to.deep.equal([{
        axis: 'stroke',
        to: 0,
        speed: 1,
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
