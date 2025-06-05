import z from "zod";

// User schema
export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  password: z.string().min(6),
});
