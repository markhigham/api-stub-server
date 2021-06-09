"use strict";

var env = process.env.ENV || "dev";
var config = require("./" + env);
module.exports = config;
