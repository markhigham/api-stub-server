# api-stub-server

> A simple http stub server designed for use while developing and testing applications that consume external HTTP based APIs.

## Installation

To install globally

    npm install -g api-stub-server

## Usage

To start the basic server

    api-stub-server

To start using some simple sample data

    api-stub-server -s

    curl http://localhost/api/value/1

### Options

### Stubbing a single HTTP request

> Because I Googled this for 30 seconds and couldn't find anything.

Getting started

    cd src
    npm install

macOS / Linux

    DEBUG=api* node index.js

Windows

    set DEBUG=api*
    node index.js
