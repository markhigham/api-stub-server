"use strict";
var _ = require("lodash");

var config = {
  env: "production",
};
config = _.merge({}, require("../base"), config);

module.exports = config;
