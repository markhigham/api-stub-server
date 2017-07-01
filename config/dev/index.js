'use strict'
var _ = require('lodash');

var config = {
    env: 'dev',

    requireAuth: false

};

config = _.merge({}, require('../base'), config);

module.exports = config;
