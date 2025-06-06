import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";
dotenv.config();

// On start if DATABASE_URL not there stop
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not defined in environment variables");
  process.exit(1);
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/dbSchema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
