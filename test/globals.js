'use strict';

global.should  = require('chai').should();
global.expect  = require('chai').expect;
global.factory = require('factory-girl').factory;
global.request = require('supertest');
global.config  = require('../lib/config');
