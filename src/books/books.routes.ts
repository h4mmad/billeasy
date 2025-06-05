import { Router } from "express";
import { validateBody } from "../middleware/validateBody";
import { bookSchema, UUIDSchema } from "../schemas/book.schema";
import {
  createBook,
  createReview,
  getBookById,
  getBooks,
} from "./books.controller";
import { asyncHandler } from "../utils/asyncHandler";
import { reviewSchema } from "../schemas/review.schema";

const r = Router();

// Create book
r.post(
  "/books",
  validateBody(bookSchema.omit({ id: true })),
  asyncHandler(createBook)
);

// Create a review for a book
r.post(
  "/books/:id/reviews",
  validateBody(reviewSchema.create),
  asyncHandler(createReview)
);

// GET /books – Get all books (with pagination and optional filters by author and genre)
r.get("/books", getBooks);

// GET /books/:id – Get book details by ID, including:
// Average rating
// Reviews (with pagination)

r.get("/books/:id", getBookById);

export const BooksRouter = r;
