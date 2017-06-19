'use strict';
const uuidV4 = require('uuid/v4');

const logger = require('./logger')('stubbed-response');

function stubbedResponse(method, url, body, usageType) {
    this.method = method.toLowerCase();
    this.body = body;
    this.url = url;
    this.usageType = usageType || 'persistent';
    this.uid = uuidV4();
}

stubbedResponse.prototype.isMatch = function (method, testUrl) {
    const lcaseMethod = method.toLowerCase();
    logger.verbose(`testing '${method} ${testUrl}' against '${this.method} ${this.url}'`)
    const result =  (lcaseMethod == this.method && testUrl == this.url);

    logger.verbose(result);
    return result;
}

module.exports = stubbedResponse;