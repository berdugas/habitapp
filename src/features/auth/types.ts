import type { Session, User } from "@supabase/supabase-js";

export type AuthSessionState = {
  isBootstrapping: boolean;
  session: Session | null;
  user: User | null;
};
