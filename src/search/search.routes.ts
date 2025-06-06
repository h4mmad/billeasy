import { Router } from "express";
import { IGetUserAuthInfoRequest } from "../types/express";
import { and, ilike } from "drizzle-orm";
import { books } from "../db/dbSchema";
import { db } from "../db/db";

const r = Router();

// GET /search – Search books by title or author (partial and case-insensitive)
// use url param title or author
// pagination not specified
// partial or case-insensitive, not clear here what partial means
// 1. does partial mean if author is John Doe, then search query is 'Joh'
// 2. does partial mean seacrch by title or search by author or both
// I think partial means no 1
r.get("/search", async (req: IGetUserAuthInfoRequest, res) => {
  const { author, title } = req.query;

  try {
    const conditions = [];

    if (author && typeof author === "string") {
      //ilike is case insensitive
      conditions.push(ilike(books.author, `%${author}%`));
    }

    if (title && typeof title === "string") {
      conditions.push(ilike(books.title, `%${title}%`));
    }

    if (!author && !title) {
      res.status(400).json({
        error: "Bad request, use 'author' or 'title' as search params",
      });
    }

    const results = await db
      .select()
      .from(books)
      .where(and(...conditions));

    res.status(200).json({ message: "success", data: results });
  } catch (err) {
    res.status(500).json({ error: "Search failed", detail: err });
  }
});

export const Search = r;
