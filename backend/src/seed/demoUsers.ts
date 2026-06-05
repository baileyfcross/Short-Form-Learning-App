import type { UserRole } from "@shortlearn/shared";
import { env } from "../config/env.js";
import type { GraphRepository } from "../db/graphRepository.js";
import { graphRepository } from "../db/index.js";
import { hashPassword } from "../security/password.js";

export interface DemoUserSeed {
  email: string;
  displayName: string;
  roles: UserRole[];
  subjects: string[];
}

export const demoUsers: DemoUserSeed[] = [
  {
    email: "learner@example.com",
    displayName: "Demo Learner",
    roles: ["user"],
    subjects: ["Science", "History", "Language"]
  },
  {
    email: "moderator@example.com",
    displayName: "Demo Moderator",
    roles: ["moderator"],
    subjects: ["Science", "Creative Arts"]
  },
  {
    email: "admin@example.com",
    displayName: "Demo Admin",
    roles: ["admin"],
    subjects: ["Science", "History", "Language", "Creative Arts"]
  }
];

export const seedDemoUsers = async (repository: GraphRepository = graphRepository) => {
  const passwordHash = await hashPassword(env.DEMO_USER_PASSWORD);
  const results: Array<{ email: string; status: "created" | "exists" }> = [];

  for (const demoUser of demoUsers) {
    const existing = await repository.findUserByEmail(demoUser.email);
    if (existing) {
      results.push({ email: demoUser.email, status: "exists" });
      continue;
    }

    await repository.createUser({
      ...demoUser,
      passwordHash
    });
    results.push({ email: demoUser.email, status: "created" });
  }

  return results;
};
