import { RequestHandler, Router, Request, Response } from "express";
import { validateBody } from "../middleware/validateBody";
import {} from "../schemas/book.schema";
import z from "zod";

import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { users } from "../db/dbSchema";
import jwt, { JsonWebTokenError } from "jsonwebtoken";
import { userSchema } from "../schemas/user.schema";
import { IGetUserAuthInfoRequest } from "../types/express";
import { db } from "../db/db";

const auth = Router();

const userSchemaWithoutId = userSchema.omit({ id: true });

// There is already a unique constraint in db, so no need to make
// a query before inserting to check if user exists
auth.post(
  "/signup",
  validateBody(userSchema.omit({ id: true })),
  async (req, res) => {
    try {
      const { email, password } = req.body as z.infer<
        typeof userSchemaWithoutId
      >;

      const hashedPassword = await bcrypt.hash(password, 12);

      const user = await db
        .insert(users)
        .values({
          email,
          password: hashedPassword,
          id: uuidv4(),
        })
        .returning({ email: users.email, id: users.id });
      res.status(201).json({
        status: "success",
        message: "User created successfully",
        data: user,
      });
    } catch (error) {
      console.log(error);
      res
        .status(500)
        .json({ status: "error", message: "Could not register user" });
    }
  }
);

auth.post(
  "/login",
  validateBody(userSchema.omit({ id: true })),
  async (req, res) => {
    try {
      const { email, password } = req.body as z.infer<
        typeof userSchemaWithoutId
      >;

      const user = await db.select().from(users).where(eq(users.email, email));

      if (!user || user.length === 0) {
        res.status(401).json({ message: "Invalid credentials" });
        return;
      }

      const isValid = await bcrypt.compare(password, user[0].password);

      if (!isValid) {
        res
          .status(401)
          .json({ status: "error", message: "Invalid credentials" });
        return;
      }
      const token = jwt.sign(
        { id: user[0].id, email: user[0].email },
        process.env.JWT_SECRET!,
        { expiresIn: "3h" }
      );

      res.status(200).json({
        status: "success",
        message: "Login successful",
        data: {
          token,
          user: {
            id: user[0].id,
            email: user[0].email,
          },
        },
      });

      // generate JWT
    } catch (error) {
      console.log(error);
      res.status(500).json({ status: "error", message: "server error" });
    }
  }
);

export const AuthRouter = auth;

export const checkAuth: RequestHandler = (
  req: IGetUserAuthInfoRequest,
  res: Response,
  next
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({ message: "No auth header present" });
      return;
    }
    console.log(authHeader);
    const [scheme, token] = authHeader.split(" ");

    if (!scheme.startsWith("Bearer")) {
      res.status(400).json({ message: "No Bearer token" });
      return;
    }
    const payload = jwt.verify(token, process.env.JWT_SECRET!);
    const { id, email } = payload as { email: string; id: string };

    req.user = { id, email };

    next();
  } catch (error) {
    if (error instanceof JsonWebTokenError) {
      res.status(400).json({ error });
      return;
    }
    res.status(500).json({ error });
  }
};
