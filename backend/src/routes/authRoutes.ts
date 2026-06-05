import { Router } from "express";
import { login, logout, me, refresh, register } from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { loginSchema, refreshSchema, registerSchema } from "./schemas.js";

export const authRoutes = Router();

authRoutes.post("/register", validate(registerSchema), register);
authRoutes.post("/login", validate(loginSchema), login);
authRoutes.post("/refresh", validate(refreshSchema), refresh);
authRoutes.post("/logout", requireAuth, logout);
authRoutes.get("/me", requireAuth, me);
