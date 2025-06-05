import { NextFunction, Request, Response } from "express";
import { ZodTypeAny } from "zod";

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
