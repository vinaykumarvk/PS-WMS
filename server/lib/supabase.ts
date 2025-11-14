import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
// Prefer service role for server; fall back to anon for read-only in demo/dev
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_KEY = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  // eslint-disable-next-line no-console
  console.warn('[server/supabase] Missing SUPABASE_URL or SUPABASE keys. Using limited/no DB access.');
}

let serverClient: SupabaseClient | null = null;

export function getServerSupabase(): SupabaseClient | null {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return null;
  }
  
  if (!serverClient) {
    serverClient = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false }
    });
  }
  return serverClient;
}

// Initialize only if credentials are available
// This can be null if credentials are not provided
export const supabaseServer = getServerSupabase();

// Helper function to ensure Supabase is available, throws helpful error if not
export function requireSupabase(): SupabaseClient {
  if (!supabaseServer) {
    throw new Error(
      'Supabase is not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY) in your .env file.'
    );
  }
  return supabaseServer;
}


