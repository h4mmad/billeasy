import { z } from "zod";

export const GenreEnum = z.enum([
  "FICTION",
  "NON_FICTION",
  "HORROR",
  "ROMANCE",
  "MYSTERY",
  "FANTASY",
]);

// Book schema
export const bookSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  author: z.string().min(1),
  genres: z.array(GenreEnum).nonempty(),
});

export const filterSchema = z.object({
  page: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .refine((n) => n >= 1, { message: "Page must be >= 1" })
    .optional(),

  limit: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .refine((n) => n >= 1 && n <= 100, { message: "Limit must be 1-100" })
    .optional(),

  author: z
    .string()
    .min(1, { message: "Author cannot be an empty string" })
    .optional(),

  genre: z
    .union([z.string(), z.array(z.string())])
    .refine(
      (val) => {
        const genres = Array.isArray(val) ? val : [val];
        return genres.every((g) => GenreEnum.options.includes(g as any));
      },
      { message: "Invalid genre(s) provided" }
    )
    .optional(),
});

export const UUIDSchema = z.string().uuid().nonempty();

export const createBookSchema = bookSchema.omit({ id: true });
