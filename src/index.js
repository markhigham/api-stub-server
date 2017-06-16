'use strict';

const logger = require('./lib/logger')('/');
const config = require('./config');
const ResponseStack = require('./lib/response-stack');

const StubbedResponse = require('./lib/stubbed-response');

const express = require('express');
const bodyParser = require('body-parser')
const app = express();

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

const responseStack = new ResponseStack();

app.get('/favicon.ico', (req, res) => {
    res.sendStatus(404);
});

app.use('/__app', express.static('static'))

app.get('/__responses', (req, res) => {
    res.status(200).send(responseStack.asJSON());
});

app.all('/_:verb/*', (req, res) => {
    if (req.method !== 'POST') {
        logger.error('this only works with POSTS!');
        res.status(400).send('only POST works to setup return values');
        return;
    }

    const verb = req.params.verb;
    const triggerUrl = req.url.replace("/_" + verb, '');

    responseStack.push(new StubbedResponse(verb, triggerUrl, req.body));
    logger.verbose(`responseStack contains ${responseStack.length} values`);

    const response = {
        triggerUrl: triggerUrl
    };

    res.json(response);
});

app.all('*', (req, res) => {
    logger.verbose(req.method, req.url);
    const method = req.method;
    const url = req.url;

    const failMessage = `No responses available. Please prepare a response by POSTING a payload to _${method}${url}`;

    if (responseStack.getCount() == 0) {

        logger.error(failMessage);
        res.status(400).send(failMessage);
        return;
    }

    const response = responseStack.find(method, url);

    if (response) {
        res.status(200).send(response);
        return;
    }

    res.status(404).send(failMessage);

});

app.listen(config.port, config.host, () => {
    logger.verbose(`started on //${config.host}:${config.port}`);
});