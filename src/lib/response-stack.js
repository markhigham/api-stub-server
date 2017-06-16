'use strict';

function responseStack() {
    const logger = require('./logger')('response-stack');

    //FIFO approach to storing the actual data
    const stack = [];
    //So we can look it up directly
    const hash = {};

    const self = {};

    self.update = function (updatedResponse) {
        //find it
        var existing = hash[updatedResponse.uid];

        if (!existing) {
            logger.error(`couldn't find ${updatedResponse.uid}`);
            return Promise.reject('not found');
        }

        logger.verbose(`found ${updatedResponse.uid}`);

        //sweeet found it - copy over the relevant data
        existing.url = updatedResponse.url;
        existing.method = updatedResponse.method;
        existing.body = updatedResponse.body;

        return Promise.resolve();

    };

    self.push = function (stubbedResponse) {
        stack.push(stubbedResponse);

        hash[stubbedResponse.uid] = stubbedResponse;
        logger.verbose(hash);
    }

    self.getCount = function () {
        return stack.length;
    }

    self.find = function (method, url) {
        let response = undefined;
        //Find in the responses array
        for (let i = stack.length - 1; i >= 0; i--) {
            logger.verbose(i);
            const stub = stack[i];

            if (stub.isMatch(method, url)) {
                logger.verbose(stub);
                response = stub.body;
                stack.splice(i, 1);
                break;
            }
        }

        return response;
    }

    self.asJSON = function () {
        return stack;
    }

    return Object.freeze(self);

}

module.exports = responseStack;