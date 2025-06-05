import { DrizzleError } from "drizzle-orm/errors";
import { DatabaseError } from "pg";
import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = 500;
  let message = "Internal server errror";

  if (err.constructor.name === "DrizzleQueryError") {
    const drizzleError = err as DrizzleError;
    if (drizzleError && err.cause.code === "23505") {
      // Conflict
      statusCode = 409;

      // Check specific constraint
      if (err.cause.constraint) {
        message = "This record already exists - unique constraint violated";
      }
    }

    // Check for foreign key constraint violations
    else if (err.cause && err.cause.code === "23503") {
      statusCode = 400;
      message = "Referenced record does not exist";
    }
    // Other database errors
    else {
      statusCode = 500;
      message = "Database operation failed";
    }
  } else if (err instanceof ZodError) {
    console.log("I'm in error handler");
    statusCode = 400;
    message = err.message;
  }

  console.log("Error:", err);

  res.status(statusCode).json({
    status: "error",
    message,
  });
};

export default errorHandler;
