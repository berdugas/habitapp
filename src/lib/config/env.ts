const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co";
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder-anon-key";

export const env = {
  supabaseUrl,
  supabaseAnonKey,
  isSupabaseConfigured:
    supabaseUrl !== "https://placeholder.supabase.co" &&
    supabaseAnonKey !== "placeholder-anon-key",
};
