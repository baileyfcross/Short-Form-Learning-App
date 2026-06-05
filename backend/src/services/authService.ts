import type { AuthResponse, UserPublic } from "@shortlearn/shared";
import { graphRepository } from "../db/index.js";
import { AppError } from "../utils/errors.js";
import { hashPassword, verifyPassword } from "../security/password.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../security/tokens.js";

export class AuthService {
  async register(input: { email: string; password: string; displayName: string; subjects?: string[] }): Promise<AuthResponse> {
    const existing = await graphRepository.findUserByEmail(input.email);
    if (existing) throw new AppError(409, "Email already registered");

    const user = await graphRepository.createUser({
      email: input.email,
      displayName: input.displayName,
      passwordHash: await hashPassword(input.password),
      roles: ["user"],
      subjects: input.subjects ?? []
    });

    return this.issueTokens(user);
  }

  async login(input: { email: string; password: string }): Promise<AuthResponse> {
    const user = await graphRepository.findUserByEmail(input.email);
    if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
      throw new AppError(401, "Invalid email or password");
    }
    return this.issueTokens(user);
  }

  async refresh(refreshToken: string): Promise<AuthResponse> {
    const claims = verifyRefreshToken(refreshToken);
    const user = await graphRepository.findUserById(claims.sub);
    if (!user) throw new AppError(401, "Invalid refresh token");
    return this.issueTokens(user);
  }

  async me(userId: string): Promise<UserPublic> {
    const user = await graphRepository.findUserById(userId);
    if (!user) throw new AppError(404, "User not found");
    const { passwordHash: _passwordHash, ...safeUser } = user;
    return safeUser;
  }

  private issueTokens(user: { id: string; email: string; roles: AuthResponse["user"]["roles"]; displayName: string; subjects: string[]; createdAt: string }) {
    const claims = { sub: user.id, email: user.email, roles: user.roles };
    return {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        roles: user.roles,
        subjects: user.subjects,
        createdAt: user.createdAt
      },
      accessToken: signAccessToken(claims),
      refreshToken: signRefreshToken(claims)
    };
  }
}

export const authService = new AuthService();
