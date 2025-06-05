import z from "zod";

// Review schema
// Assumption that review content is optional
// and rating is an integer between 1 and 5 is mandatory
const complete = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  bookId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  content: z.string().optional(),
});

const create = complete.omit({ id: true, userId: true });

const update = complete
  .omit({ id: true, bookId: true, userId: true })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: `At least one field must be provided for update`,
  });

export const reviewSchema = {
  complete,
  update,
  create,
};
