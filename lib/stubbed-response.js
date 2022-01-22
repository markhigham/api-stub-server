"use strict";
const uuid = require("uuid");
const Route = require("route-parser");
const _ = require("lodash");

const logger = require("./logger")(__filename);
const config = require("./config");

function stubbedResponse(method, url, body, usageType) {
  this.count = 0;
  this.method = method.toLowerCase();
  this.body = body;
  this.url = url;
  this.usageType = usageType || "persistent";
  this.uid = uuid.v4();
}

/**
 *
 * @param method
 * @param testUrl
 * @return {boolean|Record<string, string>} returns an object with the params if matched, false otherwise
 */
stubbedResponse.prototype.isMatch = function (method, testUrl) {
  const lcaseMethod = method.toLowerCase();
  logger.debug(
    `testing '${method} ${testUrl}' against '${this.method} ${this.url}'`
  );

  const route = new Route(this.url);
  const routeMatch = route.match(testUrl);

  if (!routeMatch) {
    logger.debug("routes do NOT match");
    return false;
  }

  if (lcaseMethod != this.method) {
    logger.debug("verbs do NOT match");
    return false;
  }

  logger.debug("match");
  logger.debug(routeMatch);
  return routeMatch;
};

stubbedResponse.prototype.interpolate = function (matchResult) {
  const ticks = new Date().getTime();
  const count = this.count++;

  const body = _.cloneDeep(this.body);

  if (config.echoRouteParams) {
    // add route params into the body of the response
    Object.assign(body, matchResult);
  }
  const json = JSON.stringify(body);

  let replaced = json.replace(/{{\$ticks}}/g, ticks);
  replaced = replaced.replace(/{{\$count}}/g, count);
  replaced = replaced.replace(/{{\$uid}}/g, this.uid);
  return JSON.parse(replaced);
};

module.exports = stubbedResponse;
