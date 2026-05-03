import app from "./app";
import { logger } from "./utils/logger";
import { startCronJobs } from "./cron/daily-report";
import { config } from "./config";
import fs from "fs";

// Ensure uploads directory exists
if (!fs.existsSync(config.uploadDir)) {
  fs.mkdirSync(config.uploadDir, { recursive: true });
}

const port = config.port;

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  // Start cron jobs
  startCronJobs();
});
