import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";
import { graphRepository } from "../db/index.js";
import { hashPassword } from "../security/password.js";
import { demoUsers } from "../seed/demoUsers.js";

export const devLoginMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  if (!env.DEV_LOGIN_ENABLED || env.NODE_ENV === "production" || req.user) {
    next();
    return;
  }

  const requestedEmail = req.header("x-shortlearn-dev-user")?.toLowerCase();
  if (!requestedEmail) {
    next();
    return;
  }

  const demoUser = demoUsers.find((user) => user.email === requestedEmail);
  if (!demoUser) {
    res.status(401).json({ message: "Dev login user is not allowed" });
    return;
  }

  try {
    const existingUser = await graphRepository.findUserByEmail(demoUser.email);
    const user =
      existingUser ??
      (await graphRepository.createUser({
        ...demoUser,
        passwordHash: await hashPassword(env.DEMO_USER_PASSWORD)
      }));

    req.user = { id: user.id, email: user.email, roles: user.roles };
    next();
  } catch (error) {
    next(error);
  }
};
