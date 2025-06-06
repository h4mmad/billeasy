import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  integer,
  unique,
  check,
  primaryKey,
} from "drizzle-orm/pg-core";

// Users table
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
});

// Books table
export const books = pgTable("books", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  author: text("author").notNull(),
});

// BookGenres table
// It allows a book to have multiple genres
// Assumption: In real world a book can belong to multiple genres
export const bookGenres = pgTable(
  "book_genres",
  {
    bookId: uuid("book_id")
      .notNull()
      .references(() => books.id, { onDelete: "cascade" }),
    genre: text("genre").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.bookId, table.genre] }), // composite primary key
    unique().on(table.bookId, table.genre), // ensures no duplicate genre for a book
  ]
);

// Reviews table
// id is the review id
// userId is the user who writes the review
// rating is 1 to 5 inclusive of both
export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    bookId: uuid("book_id")
      .notNull()
      .references(() => books.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull(),
    content: text("content"),
  },
  (reviews) => [
    unique().on(reviews.bookId, reviews.userId),
    check(
      "rating_check",
      sql`${reviews.rating} >= 1 AND ${reviews.rating} <= 5`
    ),
  ] // ensures one review per user per book]
);
