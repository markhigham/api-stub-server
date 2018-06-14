"use strict";
const uuidV4 = require("uuid/v4");
const Route = require("route-parser");

const logger = require("./logger")("stubbed-response");

const wildcard = "*";

function stubbedResponse(method, url, body, usageType, host) {
  this.host = host || wildcard;
  this.count = 0;
  this.method = method.toLowerCase();
  this.body = body;
  this.url = url;
  this.usageType = usageType || "persistent";
  this.uid = uuidV4();
}

stubbedResponse.prototype.isMatch = function(method, testUrl, host) {
  const lcaseMethod = method.toLowerCase();
  logger.verbose(
    `testing '${method} ${host}${testUrl}' against '${this.method} ${
      this.host
    }${this.url}'`
  );

  const route = new Route(this.url);
  const routeMatch = route.match(testUrl);

  if (!routeMatch) {
    logger.verbose("routes do NOT match");
    return false;
  }

  if (lcaseMethod != this.method) {
    logger.verbose("verbs do NOT match");
    return false;
  }

  if (this.host == wildcard) {
    logger.verbose("wildcard match");
    return true;
  }

  logger.verbose(host);
  return false;
};

stubbedResponse.prototype.interpolate = function() {
  const ticks = new Date().getTime();
  const count = this.count++;
  const uid = uuidV4();
  const json = JSON.stringify(this.body);
  let replaced = json.replace(/{{\$ticks}}/g, ticks);
  replaced = replaced.replace(/{{\$count}}/g, count);
  replaced = replaced.replace(/{{\$uid}}/g, uid);
  return JSON.parse(replaced);
};

module.exports = stubbedResponse;
