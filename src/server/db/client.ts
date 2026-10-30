// ===========================================
// Supabase Database Client
// ===========================================

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let supabase: SupabaseClient | null = null;

/** Uses Supabase when configured and SQLite for the credential-free local demo. */
export function usesSqlite(): boolean {
  return process.env['DATABASE_PROVIDER'] === 'sqlite'
    || (!process.env['SUPABASE_URL'] && !process.env['SUPABASE_SERVICE_ROLE_KEY'] && !process.env['SUPABASE_ANON_KEY']);
}

/**
 * Get the Supabase client singleton.
 * Throws if environment variables are missing.
 */
export function getSupabase(): SupabaseClient {
  if (supabase) return supabase;

  const url = process.env['SUPABASE_URL'];
  const key = process.env['SUPABASE_SERVICE_ROLE_KEY'] || process.env['SUPABASE_ANON_KEY'];

  if (!url || !key) {
    throw new Error(
      'Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables. ' +
        'Copy .env.example to .env and fill in your Supabase credentials.'
    );
  }

  supabase = createClient(url, key, {
    auth: { persistSession: false },
  });

  return supabase;
}

/**
 * Reset the client (for testing).
 */
export function resetSupabase(): void {
  supabase = null;
}
