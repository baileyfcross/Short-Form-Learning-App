import { Router } from "express";
import { adminRoutes } from "./adminRoutes.js";
import { authRoutes } from "./authRoutes.js";
import { feedRoutes } from "./feedRoutes.js";
import { libraryRoutes } from "./libraryRoutes.js";
import { searchRoutes } from "./searchRoutes.js";

export const apiRoutes = Router();

apiRoutes.get("/health", (_req, res) => res.json({ ok: true }));
apiRoutes.use("/auth", authRoutes);
apiRoutes.use("/library", libraryRoutes);
apiRoutes.use("/feed", feedRoutes);
apiRoutes.use("/search", searchRoutes);
apiRoutes.use("/admin", adminRoutes);
