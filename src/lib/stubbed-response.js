'use strict';
const uuidV4 = require('uuid/v4');

const logger = require('./logger')('stubbed-response');

function stubbedResponse(method, url, body) {
    this.method = method.toLowerCase();
    this.body = body;
    this.usageType = 'persistent';
    this.url = url;
    this.uid = uuidV4();
}

stubbedResponse.prototype.isMatch = function (method, testUrl) {
    const lcaseMethod = method.toLowerCase();
    logger.verbose(`testing ${method} ${testUrl} against ${this.method} ${this.url}`)
    return (lcaseMethod == this.method && testUrl == this.url);
}

module.exports = stubbedResponse;