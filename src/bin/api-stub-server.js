#!/usr/bin/env node

process.env.DEBUG = process.env.DEBUG || "api*";
process.env.DEBUG_LEVEL = process.env.DEBUG_LEVEL || "info";

const app = require('../lib/api');
const config = require('../config');
const fs = require('fs');

const argv = require('minimist')(process.argv.slice(2));

const port = argv.p || config.port;
const host = argv.h || config.host;

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
    console.error(err);
    process.exit(-1);
});




