import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';

global.expect = chai.expect;
global.assert = chai.assert;
chai.use(chaiAsPromised);
chai.should();
