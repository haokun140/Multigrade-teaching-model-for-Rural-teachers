import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export function isNotFound(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as any).code === 'PGRST116';
}

export function handleSingle<T>(result: { data: T | null; error: any }): T | null {
  if (result.error) {
    if (isNotFound(result.error)) return null;
    throw result.error;
  }
  return result.data;
}
