import * as path from "path";

import { config } from "./config";
import { LogManager } from "./logger";
import { Responses } from "./responses";
import { Response } from "./response";

import * as express from "express";
import * as bodyParser from "body-parser";
import { createManagementRouter } from "./routes/responseManagement";

const logger = LogManager.getLogger(__filename);

const app = express();
const serverDetails = {
  host: "",
  port: 0,
};

let recordCount = 0; //0 is off

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const responseStack = new Responses();

app.get("/favicon.ico", (req, res) => {
  res.sendStatus(404);
});

const managementRouter = createManagementRouter(responseStack, "/__app");

app.use("/__app", express.static(path.join(__dirname + "/../../static")));
app.use(
  "/node_modules",
  express.static(path.join(__dirname + "/../../node_modules"))
);

app.use("/__response", managementRouter);

app.get("/__info", (req, res) => {
  res.status(200).send(config);
});

/**
 * Any POST sent to /_ will be handled as an attempt to seed another response
 * for example
 * POST /_GET/api/v1/  { 'hello' : 'world' }
 * will create a new GET response at /api/v1 which returns the helloworld json
 */
app.all("/_:verb/*", (req, res) => {
  if (req.method !== "POST") {
    logger.error("this only works with POSTS!");
    res.status(400).send("only POST works to setup return values");
    return;
  }

  const verb = req.params.verb;

  const triggerUrl = req.url.replace("/_" + verb, "");
  logger.debug(`${verb} ${triggerUrl}`);

  responseStack.push(new Response(verb, triggerUrl, req.body));
  logger.debug(`responseStack contains ${responseStack.getCount()} values`);

  const response = {
    triggerUrl: triggerUrl,
  };

  res.json(response);
});

app.all("*", (req, res) => {
  const method = req.method;
  const url = req.url;
  logger.debug(`looking for ${method} ${url}`);

  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );

  if (method == "OPTIONS") {
    res.status(200).send("oh yes... options");
    return;
  }

  if (responseStack.getCount() > 0) {
    const response = responseStack.use(method, url);
    if (response) {
      logger.debug(response);
      logger.info(`200 ${method} ${req.url}`);
      res.status(200).send(response);
      return;
    }
  }

  // Not found
  if (recordCount != 0) {
    recordCount--;
    logger.debug(`recordCount ${recordCount}`);
    const stubbedResponse = req.body;
    const payload = new Response(req.method, req.url, req.body);

    responseStack.push(payload);
    res.sendStatus(200);
    return;
  }

  const failMessage = `404 - Not found. Try the web ui at http://${serverDetails.host}:${serverDetails.port}/__app/`;
  logger.info(`404, ${method}, ${url}`);
  res.status(404).send(failMessage);
});

function start(port, host): Promise<void> {
  logger.debug(`starting ${host}:${port}`);
  return new Promise((resolve, reject) => {
    app.listen(port, host, (err) => {
      if (err) {
        reject(err);
        return;
      }

      logger.info(`started on http://${host}:${port}`);
      serverDetails.host = host;
      serverDetails.port = port;
      resolve();
    });
  });
}

export class Api {
  start(port, host) {
    return start(port, host);
  }

  stop(): Promise<any> {
    // this is really hacking and i'm quite embarrassed about it
    // TODO - use stoppable
    console.log("quitting");
    return Promise.resolve();
  }

  upload(savedData) {
    return responseStack.addMany(savedData);
  }

  startRecording(limit) {
    logger.info(`recording ${limit} requests`);
    recordCount = limit;
  }
}
