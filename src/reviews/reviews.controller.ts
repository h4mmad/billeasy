import { Response } from "express";
import { reviewSchema } from "../schemas/review.schema";
import { UUIDSchema } from "../schemas/book.schema";
import { reviews } from "../schemas/schema";
import z from "zod";
import { and, eq, ne } from "drizzle-orm";
import { IGetUserAuthInfoRequest } from "../types/express";
import { db } from "../db";

export const updateReview = async (
  req: IGetUserAuthInfoRequest,
  res: Response
) => {
  const parse = UUIDSchema.safeParse(req.params.id);
  if (!parse.success) {
    res
      .status(400)
      .json({ status: "error", message: "review id not valid UUID" });
    return;
  }

  if (!req.user?.id) {
    res.status(400).json({ status: "error", message: "no user id found" });
    return;
  }

  // Read from body already validated
  // Read the user id from the request
  const { content, rating } = req.body as z.infer<typeof reviewSchema.update>;
  const { id: requestUserId } = req.user;

  // Add fields only if they were sent
  // If no fields were sent then validateBody already sent error
  let update: any = {};

  if (content !== undefined) {
    update.content = content;
  }
  if (rating !== undefined) {
    update.rating = rating;
  }

  // Now we need to update the review from db
  // AND check if review written by user
  const updateQuery = await db
    .update(reviews)
    .set({ ...update })
    .where(
      and(eq(reviews.userId, requestUserId), eq(reviews.id, req.params.id))
    )
    .returning({ id: reviews.id });

  // If review is not found
  if (updateQuery.length === 0) {
    res.status(404).json({ status: "error", message: "review not found" });
    return;
  }

  res.status(200).json({
    status: "success",
    message: `your review with ID: ${updateQuery[0].id} has been updated`,
  });
};

export const deleteReview = async (
  req: IGetUserAuthInfoRequest,
  res: Response
) => {
  // Parse the review id to check if it is valid uuid, if not fail fast
  const parse = UUIDSchema.safeParse(req.params.id);
  if (!parse.success) {
    res
      .status(400)
      .json({ status: "error", message: "review id not valid UUID" });
    return;
  }

  // Check for user id
  if (!req.user?.id) {
    return res
      .status(400)
      .json({ status: "error", message: "no user id found" });
  }

  //First query to check if the user is authorzied to delete the review
  // we can use just one delete, query but by checking
  // if user has authority to delete we can send proper responses
  const [unauthorizedReview] = await db
    .select({ userId: reviews.userId })
    .from(reviews)
    .where(and(eq(reviews.id, req.params.id), ne(reviews.userId, req.user.id)));

  if (unauthorizedReview) {
    res.status(403).json({
      status: "error",
      message: "You are not allowed to delete this review",
      deleteRequestBy: unauthorizedReview.userId,
    });
    return;
  }

  // The query will delete if the request user id matches the review's user id
  // and if the request review id equals the review's id
  // we can use soft delete by using isDeleted column in db, but I chose to delete completely.
  const deleteQuery = await db
    .delete(reviews)
    .where(and(eq(reviews.userId, req.user.id), eq(reviews.id, req.params.id)))
    .returning({ id: reviews.id });

  if (deleteQuery.length === 0) {
    return res.status(404).json({
      status: "error",
      message: "review has been deleted",
    });
  }

  const deletedId = deleteQuery[0].id;

  res.status(200).json({
    status: "success",
    message: `your review with ID: ${deletedId} has been deleted`,
  });
};
