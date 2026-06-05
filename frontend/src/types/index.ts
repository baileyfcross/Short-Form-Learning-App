import type { AuthResponse, Material, Snippet, UserPublic } from "@shortlearn/shared";

export type Session = AuthResponse | null;
export type ViewKey = "feed" | "library" | "upload" | "search" | "admin";

export interface ApiState {
  session: Session;
  user?: UserPublic;
  feed: Snippet[];
  library: Material[];
}
