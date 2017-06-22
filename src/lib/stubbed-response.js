'use strict';
const uuidV4 = require('uuid/v4');
const Route = require('route-parser');

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

    const route = new Route(this.url);
    const routeMatch = route.match(testUrl);

    if (!routeMatch) {
        logger.verbose('routes do NOT match');
        return false;
    }

    if (lcaseMethod != this.method) {
        logger.verbose('verbs do NOT match');
        return false;
    }
    return true;
};

stubbedResponse.prototype.processBody = function () {
    const ticks = new Date().getTime();

    const json = JSON.stringify(this.body);
    const replaced = json.replace(/{{\$ticks}}/, ticks);

    return JSON.parse(replaced);
};

module.exports = stubbedResponse;