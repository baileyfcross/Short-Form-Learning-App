import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../security/tokens.js";

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const header = req.header("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : undefined;
  if (!token) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }

  try {
    const claims = verifyAccessToken(token);
    req.user = { id: claims.sub, email: claims.email, roles: claims.roles };
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};
