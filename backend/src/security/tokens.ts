import jwt from "jsonwebtoken";
import type { UserRole } from "@shortlearn/shared";
import { env } from "../config/env.js";

export interface TokenClaims {
  sub: string;
  email: string;
  roles: UserRole[];
}

export const signAccessToken = (claims: TokenClaims) =>
  jwt.sign(claims, env.JWT_ACCESS_SECRET, { expiresIn: env.ACCESS_TOKEN_TTL as jwt.SignOptions["expiresIn"] });

export const signRefreshToken = (claims: TokenClaims) =>
  jwt.sign(claims, env.JWT_REFRESH_SECRET, { expiresIn: env.REFRESH_TOKEN_TTL as jwt.SignOptions["expiresIn"] });

export const verifyAccessToken = (token: string) => jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenClaims;
export const verifyRefreshToken = (token: string) => jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenClaims;
