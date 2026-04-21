import { supabase } from "@/lib/supabase/client";

export function getSupabaseSession() {
  return supabase.auth.getSession();
}

export function onSupabaseAuthStateChange(
  callback: Parameters<typeof supabase.auth.onAuthStateChange>[0],
) {
  return supabase.auth.onAuthStateChange(callback);
}
