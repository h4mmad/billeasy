import { Router } from "express";
import { validateBody } from "../middleware/validateBody";
import { reviewSchema } from "../schemas/review.schema";
import { asyncHandler } from "../utils/asyncHandler";
import { deleteReview, updateReview } from "./reviews.controller";

const r = Router();

// PUT /reviews/:id – Update your own review
// validate body validates req.body with the reviewSchema for update
r.put(
  "/reviews/:id",
  validateBody(reviewSchema.update),
  asyncHandler(updateReview)
);

// DELETE /reviews/:id – Delete your own review
r.delete("/reviews/:id", asyncHandler(deleteReview));

export const ReviewsRouter = r;
