import express from "express";
import dotenv from "dotenv";
import { BooksRouter } from "./books/books.routes";
import { AuthRouter, checkAuth } from "./auth/auth";
import { drizzle } from "drizzle-orm/node-postgres";
import errorHandler from "./utils/errorHandler";
import { Pool } from "pg";
import { ReviewsRouter } from "./reviews/reviews.routes";
import { Search } from "./search/search.routes";

dotenv.config();

if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET is not defined in environment variables");
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not defined in environment variables");
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// You can specify any property from the node-postgres connection options
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
export const db = drizzle({ client: pool });

app.use(AuthRouter);
app.use(checkAuth);
app.use(BooksRouter);
app.use(ReviewsRouter);
app.use(Search);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
