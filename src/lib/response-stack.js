'use strict';
const _ = require('lodash');

function responseStack() {
    const logger = require('./logger')('response-stack');

    //FIFO approach to storing the actual data
    let stack = [];
    //So we can look it up directly
    let hash = {};

    const self = {};

    self.clear = function () {
        logger.verbose('clearing current values');
        stack = [];
        hash = {};

        return Promise.resolve();
    };



    self.delete = function (uid) {
        var existing = hash[uid];

        if (!existing) {
            const msg = `Could't find response with uid ${uid}`;
            logger.error(msg);
            return Promise.reject(msg);
        }

        logger.verbose(`found ${uid}`);
        delete hash[uid];

        _.remove(stack, item => {
            return item.uid == uid;
        });

        //Yeah - this could be a sync call - but I may change the data to be stored somewhere else
        return Promise.resolve();
    }

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

    self.addMany = function (values) {
        logger.verbose('addmany', values);
        _.each(values, value => {
            self.push(value);
        });
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

                if (response.usageType != 'persistent')
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