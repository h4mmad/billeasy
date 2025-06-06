import { bookGenres, books, reviews } from "../db/dbSchema";
import {
  UUIDSchema,
  createBookSchema,
  filterSchema,
} from "../schemas/book.schema";
import { v4 as uuidv4 } from "uuid";
import z from "zod";
import { reviewSchema } from "../schemas/review.schema";
import { Response } from "express";
import { IGetUserAuthInfoRequest } from "../types/express";
import { eq, and, sql, inArray } from "drizzle-orm";
import { db } from "../db/db";

export const createBook = async (
  req: IGetUserAuthInfoRequest,
  res: Response
) => {
  // validateBody middleare already validated the data
  const newBook = req.body as z.infer<typeof createBookSchema>;

  const insertedBook = await db
    .insert(books)
    .values({
      title: newBook.title,
      author: newBook.author,
      id: uuidv4(),
    })
    .returning({ id: books.id, title: books.title, author: books.author });

  const bookId = insertedBook[0].id;

  const bookGenreRows = newBook.genres.map((genre) => ({
    bookId,
    genre,
  }));

  await db.insert(bookGenres).values(bookGenreRows);

  const book = {
    id: insertedBook[0].id,
    title: insertedBook[0].title,
    author: insertedBook[0].author,
    genres: newBook.genres,
  };

  res.status(201).json({
    status: "success",
    message: "Book created successfully",
    data: book,
  });
};

export const createReview = async (
  req: IGetUserAuthInfoRequest,
  res: Response
) => {
  // Validate book ID
  const bookId = req.params.id;
  if (!UUIDSchema.safeParse(bookId).success) {
    res.status(400).json({ status: "error", message: "Invalid UUID" });
    return;
  }

  // Check auth (assumes middleware adds `req.user`)
  if (!req?.user) {
    res.status(400).json({ status: "error", message: "unauthorized" });
    return;
  }

  // Validated by validateBody middlewaew and extract review data
  const review = req.body as z.infer<typeof reviewSchema.complete>;

  const result = await db
    .insert(reviews)
    .values({
      id: uuidv4(),
      bookId,
      userId: req.user.id,
      rating: review.rating,
      content: review.content || null,
    })
    .returning({
      id: reviews.id,
      bookId: reviews.bookId,
      userId: reviews.userId,
      rating: reviews.rating,
      content: reviews.content,
    });

  res.status(201).json({
    status: "success",
    message: "Review created successfully",
    data: result[0],
  });
};

// GET /books – Get all books (with pagination and optional filters by author and genre)
export const getBooks = async (req: IGetUserAuthInfoRequest, res: Response) => {
  const result = filterSchema.safeParse(req.query);

  if (!result.success) {
    res.status(400).json({ status: "error", message: result.error });
  }

  const filterData = result.data;

  // Default limit and page values
  let limit = 10;
  let page = 1;

  // Check if limit and page are sent
  if (filterData?.limit) {
    limit = filterData.limit;
  }

  if (filterData?.page) {
    page = filterData.page;
  }

  // Offset will be used in returing the number of rows
  const offset = (page - 1) * limit;
  const conditions = [];
  const authorCondition = [];

  // Check for genre
  // If single genre sent as filter, it wil be a string
  // If multiple genre sent as filter, it will be a string array

  if (typeof filterData?.genre === "string" && filterData.genre) {
    const genre = filterData.genre;
    conditions.push(eq(bookGenres.genre, genre));
  } else if (Array.isArray(filterData?.genre) && filterData.genre.length > 0) {
    conditions.push(inArray(bookGenres.genre, filterData.genre));
  }

  // Check if author is present
  if (filterData?.author) {
    const author = filterData.author;
    authorCondition.push(eq(books.author, author));
  }

  // Make query
  // Find matching book IDs
  const filteredBooks = await db
    .selectDistinct({ id: books.id })
    .from(books)
    .leftJoin(bookGenres, eq(books.id, bookGenres.bookId))
    .where(and(...authorCondition, ...conditions))
    .limit(limit)
    .offset(offset);

  const bookIds = filteredBooks.map((b) => b.id);
  if (bookIds.length === 0) {
    return res.status(200).json({ status: "success", data: [] });
  }

  //  Get full data with all genres for matching books
  const booksWithGenres = await db
    .select({
      id: books.id,
      title: books.title,
      author: books.author,
      genres: sql`ARRAY_AGG(${bookGenres.genre})`.as("genres"),
    })
    .from(books)
    .leftJoin(bookGenres, eq(books.id, bookGenres.bookId))
    .where(inArray(books.id, bookIds))
    .groupBy(books.id);

  res.status(200).json({
    status: "success",
    data: booksWithGenres,
  });
};

// GET /books/:id – Get book details by ID, including:
// Average rating
// Reviews (with pagination)
export const getBookById = async (
  req: IGetUserAuthInfoRequest,
  res: Response
) => {
  if (!UUIDSchema.safeParse(req.params.id).success) {
    res.status(400).json({ error: "Invalid ID format" });
    return;
  }

  const bookId = req.params.id;

  // Get book details + genres + average rating
  const [book] = await db
    .select({
      id: books.id,
      title: books.title,
      author: books.author,
      genres: sql`ARRAY_AGG(DISTINCT ${bookGenres.genre})`.as("genres"),
      averageRating: sql`ROUND(AVG(${reviews.rating})::numeric, 2)`.as(
        "averageRating"
      ),
    })
    .from(books)
    .leftJoin(bookGenres, eq(bookGenres.bookId, books.id))
    .leftJoin(reviews, eq(reviews.bookId, books.id))
    .where(eq(books.id, bookId))
    .groupBy(books.id);

  if (!book) {
    res.status(404).json({ error: "Book not found" });
    return;
  }

  // Pagination for reviews
  const limit = Number(req.query.limit) || 10;
  const page = Number(req.query.page) || 1;
  const offset = (page - 1) * limit;

  const reviewList = await db
    .select({
      id: reviews.id,
      userId: reviews.userId,
      rating: reviews.rating,
      content: reviews.content,
    })
    .from(reviews)
    .where(eq(reviews.bookId, bookId))
    .limit(limit)
    .offset(offset);

  res.status(200).json({
    status: "success",
    data: { ...book, reviews: reviewList },
  });
};
