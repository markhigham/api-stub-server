#!/usr/bin/env node

process.env.DEBUG = process.env.DEBUG || "api*";
process.env.DEBUG_LEVEL = process.env.DEBUG_LEVEL || "info";

const colors = require('colors');
const app = require('../lib/api');
const config = require('../config');
const fs = require('fs');

const argv = require('minimist')(process.argv.slice(2));

const port = argv.p || config.port;
const host = argv.h || config.host;

function showHelp() {
    console.log(`api-stub-server [-p 8092] [-h 127.0.0.1] [saved_response_file.json]
-p  (Optional) Port number - defaults to 3001

-h  (Optional) Host address - defaults to 0.0.0.0

saved_response_file.json (optional)
    Path to a file containing pre-saved responses

    `);
}

if (argv.h) {
    showHelp();
    process.exit(0);
}

if (isNaN(port)) {
    showHelp();
    process.exit(-1);
}

process.on('uncaughtException', (err) => {
    console.error('Something unexpected happened. See the error code below'.red);
    console.error(err);
});

app.start(port, host).then(() => {
    if (argv._.length === 0) {
        return;
    }

    const filename = argv._[0];
    console.log(`using ${filename}`);

    var file = fs.readFileSync(filename, 'utf8');
    var json = JSON.parse(file);
    return app.upload(json);

}).then(() => {
    // started
}).catch(err => {
    console.error('Something failed');
    process.exit(-1);
});



