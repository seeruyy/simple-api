'use strict';

const config = require('../lib/config');
const App    = require('../lib/App');

const app      = new App(config);
module.exports = app.run();
