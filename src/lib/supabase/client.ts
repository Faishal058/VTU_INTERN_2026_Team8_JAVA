import { createBrowserClient } from "@supabase/ssr";

/**
 * Creates a Supabase client for use in Browser/Client components.
 * Uses public environment variables for URL and Anon Key.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
