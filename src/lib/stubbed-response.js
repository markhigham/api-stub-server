'use strict';

const logger = require('./logger')('stubbed-response');

function stubbedResponse(method, url, body) {
    this.method = method.toLowerCase();
    this.body = body;
    this.url = url;
}

stubbedResponse.prototype.isMatch = function (method, testUrl) {
    const lcaseMethod = method.toLowerCase();
    logger.verbose(`testing ${method} ${testUrl} against ${this.method} ${this.url}`)
    return (lcaseMethod == this.method && testUrl == this.url);
}

module.exports = stubbedResponse;