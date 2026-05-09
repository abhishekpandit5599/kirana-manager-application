import { defineConfig } from "drizzle-kit";
import path from "path";
import { config } from "dotenv";

// Load .env from root
const envPath = path.resolve(process.cwd(), "../../.env");
config({ path: envPath });

if (!process.env.DATABASE_URL) {
  // Try another common path just in case
  config({ path: path.resolve(process.cwd(), ".env") });
}

const databaseUrl = process.env.DATABASE_URL?.trim();

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set. Please check your .env file.");
}

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
});
