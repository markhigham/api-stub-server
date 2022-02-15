import { Router } from "express";
import * as moment from "moment";
import { Response } from "../response";

import { LogManager } from "../logger";
import { IResponseStore } from "../interfaces";

const logger = LogManager.getLogger(__filename);

const router = Router();

export function createManagementRouter(
  store: IResponseStore,
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

    store
      .clear()
      .then(() => {
        return store.addMany(uploadedData);
      })
      .then(() => {
        res.redirect(appRoutePath);
      })
      .catch((err) => {
        logger.error(err);
        res.status(500).send(err);
      });
  });

  router.get("/", async (req, res) => {
    logger.info(`200 GET /__response`);
    res.status(200).send(await store.asJSON());
  });

  router.delete("/:uid", (req, res) => {
    logger.debug(`delete ${req.params.uid}`);
    store
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
    store
      .clear()
      .then(() => {
        res.sendStatus(204);
      })
      .catch((err) => {
        logger.error(err);
        res.status(500).send(err);
      });
  });

  router.get("/download", async (req, res) => {
    const now = moment.utc();
    const filename = `api-stub-server-${now.format("YYYY-MM-DD-HHmm")}.json`;

    res.setHeader("Content-type", "application/json");
    res.setHeader("Content-disposition", `attachment; filename=${filename}`);
    res.send(await store.asJSON());
  });

  router.post("/", async (req: any, res) => {
    logger.debug("creating new response", req.body);
    const tenant = req.tenant || "";
    const stubbedResponse = req.body;
    const payload = new Response(
      stubbedResponse.method,
      stubbedResponse.url,
      stubbedResponse.body,
      stubbedResponse.usageType,
      tenant,
      stubbedResponse.statusCode
    );

    await store.push(payload);
    res.sendStatus(202);
  });

  router.put("/", (req, res) => {
    logger.debug("updating response", req.body);

    store
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
