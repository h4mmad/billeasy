import { NextFunction, Request, Response } from "express";
import { ZodTypeAny } from "zod";

// this middleware will validate req.body against any zod schema provided
// so we can fail before the request reaches the controllers.
export function validateBody(schema: ZodTypeAny) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error;
      res.status(400).json({ errors });
      return;
    }
    req.body = result.data;
    next();
  };
}
