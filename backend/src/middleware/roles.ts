import type { NextFunction, Request, Response } from "express";
import type { UserRole } from "@shortlearn/shared";

export const requireRole =
  (...roles: UserRole[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    const hasRole = req.user?.roles.some((role) => roles.includes(role));
    if (!hasRole) {
      res.status(403).json({ message: "Insufficient permissions" });
      return;
    }
    next();
  };

export const isAdmin = (req: Request) => Boolean(req.user?.roles.includes("admin"));
