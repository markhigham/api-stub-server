'use strict';
const uuidV4 = require('uuid/v4');
const Route = require('route-parser');

const logger = require('./logger')('stubbed-response');

function stubbedResponse(method, url, body, usageType) {
    this.count = 0;
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

stubbedResponse.prototype.interpolate = function () {
    const ticks = new Date().getTime();
    const count = this.count++;
    const json = JSON.stringify(this.body);
    let replaced = json.replace(/{{\$ticks}}/, ticks);
    replaced = replaced.replace(/{{\$count}}/, count);

    return JSON.parse(replaced);
};

module.exports = stubbedResponse;