import type { UserRole } from "@shortlearn/shared";

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      roles: UserRole[];
    }

    interface Request {
      user?: User;
    }
  }
}
