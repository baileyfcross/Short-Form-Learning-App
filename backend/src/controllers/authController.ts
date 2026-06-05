import { authService } from "../services/authService.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const register = asyncHandler(async (req, res) => {
  res.status(201).json(await authService.register(req.body));
});

export const login = asyncHandler(async (req, res) => {
  res.json(await authService.login(req.body));
});

export const refresh = asyncHandler(async (req, res) => {
  res.json(await authService.refresh(req.body.refreshToken));
});

export const logout = asyncHandler(async (_req, res) => {
  res.status(204).send();
});

export const me = asyncHandler(async (req, res) => {
  res.json(await authService.me(req.user!.id));
});
