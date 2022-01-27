import { Router } from "express";
import * as moment from "moment";
import { Response } from "../response";

import { LogManager } from "../logger";
import { Responses } from "../responses";

const logger = LogManager.getLogger(__filename);

const router = Router();

export function createManagementRouter(
  responseStack: Responses,
  appRoutePath: string
) {
  router.post("/upload", (req, res) => {
    logger.info("200 POST /__responses/upload");
    logger.verbose(req.body);
    let uploadedData;
    try {
      uploadedData = req.body;
    } catch (ex) {
      logger.error(ex);
      res.status(500).send(ex);
      return;
    }

    responseStack
      .clear()
      .then(() => {
        return responseStack.addMany(uploadedData);
      })
      .then(() => {
        res.redirect(appRoutePath);
      })
      .catch((err) => {
        logger.error(err);
        res.status(500).send(err);
      });
  });

  router.get("/", (req, res) => {
    logger.info(`200 GET /__response`);
    res.status(200).send(responseStack.asJSON());
  });

  router.delete("/:uid", (req, res) => {
    logger.debug(`delete ${req.params.uid}`);
    responseStack
      .delete(req.params.uid)
      .then(() => {
        res.sendStatus(204);
      })
      .catch((err) => {
        logger.error(err);
        res.status(500).send(err);
      });
  });

  router.delete("/", (req, res) => {
    logger.debug("deleting all saved responses");
    responseStack
      .clear()
      .then(() => {
        res.sendStatus(204);
      })
      .catch((err) => {
        logger.error(err);
        res.status(500).send(err);
      });
  });

  router.get("/download", (req, res) => {
    const now = moment.utc();
    const filename = `api-stub-server-${now.format("YYYY-MM-DD-HHmm")}.json`;

    res.setHeader("Content-type", "application/json");
    res.setHeader("Content-disposition", `attachment; filename=${filename}`);
    res.send(responseStack.asJSON());
  });

  router.post("/", (req, res) => {
    logger.debug("creating new response", req.body);
    const stubbedResponse = req.body;
    const payload = new Response(
      stubbedResponse.method,
      stubbedResponse.url,
      stubbedResponse.body,
      stubbedResponse.usageType
    );

    responseStack.push(payload);
    res.sendStatus(202);
  });

  router.put("/", (req, res) => {
    logger.debug("updating response", req.body);

    responseStack
      .update(req.body)
      .then(() => {
        res.sendStatus(204);
      })
      .catch((err) => {
        res.status(500).send(err);
      });
  });

  return router;
}
