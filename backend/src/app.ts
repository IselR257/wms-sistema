import cors from "cors";
import express from "express";

import { errorHandler } from "./middlewares/error-handler.js";
import { registerRoutes } from "./routes/index.js";

export const createApp = () => {
  const app = express();

  app.use(
    cors({
      origin: true,
      credentials: true
    })
  );
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "wms-api" });
  });

  registerRoutes(app);
  app.use(errorHandler);

  return app;
};
