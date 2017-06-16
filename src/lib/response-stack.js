'use strict';

function responseStack() {
    const logger = require('./logger')('response-stack');
    const stack = [];
    const self = {};

    self.push = function (stubbedResponse) {
        stack.push(stubbedResponse);
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

    self.asJSON = function(){
        return stack;
    }

    return Object.freeze(self);

}

module.exports = responseStack;