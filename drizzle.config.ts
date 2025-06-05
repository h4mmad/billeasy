import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schemas/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ||
      "postgresql://postgres.kcjggkubykawfittifyt:DOQt8Od9OxJW0DD0@aws-0-ap-south-1.pooler.supabase.com:6543/postgres",
  },
});
