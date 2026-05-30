import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import express from "express";
import { errorHandler } from "./middlewares/error-handler.js";
import { registerRoutes } from "./routes/index.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDistPath = path.resolve(__dirname, "../../frontend/dist");
export const createApp = () => {
    const app = express();
    app.use(cors({
        origin: true,
        credentials: true
    }));
    app.use(express.json());
    app.get("/health", (_req, res) => {
        res.json({ ok: true, service: "wms-api" });
    });
    app.get("/api/health", (_req, res) => {
        res.json({ ok: true, service: "wms-api" });
    });
    registerRoutes(app);
    app.use("/api", (_req, res) => {
        res.status(404).json({ message: "Ruta API no encontrada" });
    });
    app.use(express.static(frontendDistPath));
    app.get(/^(?!\/api).*/, (_req, res) => {
        res.sendFile(path.join(frontendDistPath, "index.html"));
    });
    app.use(errorHandler);
    return app;
};
