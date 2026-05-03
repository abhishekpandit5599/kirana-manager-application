import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "path";
import fs from "fs";
import router from "./routes";
import { logger } from "./utils/logger";
import { errorMiddleware } from "./middlewares/error.middleware";
import { config } from "./config";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files (logos, QR codes, etc.)
app.use("/uploads", express.static(path.resolve(config.uploadDir)));

// API routes
app.use("/api", router);

// Global error handler (must be after routes)
app.use(errorMiddleware);

// Serve frontend in production (must be after API routes)
const frontendPath = path.resolve(process.cwd(), "../kirana-store/dist/public");
if (fs.existsSync(frontendPath)) {
  app.use(express.static(frontendPath));
  app.use((req, res, next) => {
    if (req.path.startsWith("/api/")) {
      res.status(404).json({ message: "Not found" });
    } else {
      res.sendFile(path.resolve(frontendPath, "index.html"));
    }
  });
}

export default app;
