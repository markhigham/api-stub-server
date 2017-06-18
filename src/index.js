'use strict';
const moment = require('moment');

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
app.use('/node_modules', express.static('node_modules'));

app.get('/__responses', (req, res) => {
    res.status(200).send(responseStack.asJSON());
});

app.get('/__responses/download', (req, res) => {
    const now = moment.utc();
    const filename = `api-stub-server-${now.format('YYYY-MM-DD-HHmm')}.json`;

    res.setHeader('Content-type', 'application/json');
    res.setHeader('Content-disposition', `attachment; filename=${filename}`);
    res.send(responseStack.asJSON());
});

app.get('/__responses/upload', (req, res) => {
    logger.verbose('work in progress');
    res.sendStatus(202);
});

app.delete('/__response/:uid', (req, res) => {
    logger.verbose('delete', req.params.uid);
    responseStack.delete(req.params.uid).then(() => {
        res.sendStatus(204);
    }).catch(err => {
        res.status(500).send(err);
    });
});

app.post('/__response', (req, res) => {
    logger.verbose('creating new response', req.body);
    const stubbedResponse = req.body;
    const payload = new StubbedResponse(stubbedResponse.method, stubbedResponse.url,
            stubbedResponse.body);
    
    responseStack.push(payload);
    res.sendStatus(202);

});

app.put('/__response', (req, res) => {
    logger.verbose('updating response', req.body);

    responseStack.update(req.body).then(() => {
        res.sendStatus(204);

    }).catch(err => {
        res.status(500).send(err);
    });

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
    logger.verbose(`responseStack contains ${responseStack.getCount()} values`);

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