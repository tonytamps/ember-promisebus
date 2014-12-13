var Bluebird = require('bluebird');
var chai = require('chai');

chai.use(require('sinon-chai'));
chai.use(require('chai-as-promised'));
require('sinon-as-promised')(Bluebird);

global.should = chai.should();
global.expect = chai.expect;

