import { createClient } from "@supabase/supabase-js";

// Configurar no Dyad → Settings/Env:
// VITE_SUPABASE_URL
// VITE_SUPABASE_ANON_KEY
//
// Fallback (demo): se env não estiver definido no runtime, usamos os valores do projeto.
const DEFAULT_URL = "https://wadcngsieyjgcslyfauq.supabase.co";
const DEFAULT_ANON_KEY =
  "sb_publishable_PwDvjo4NOT6bbzDtW3HIGQ_766Ycznn";

const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? DEFAULT_URL;
const anonKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ??
  DEFAULT_ANON_KEY;

export const supabase = url && anonKey ? createClient(url, anonKey) : null;

export function isSupabaseConfigured() {
  return Boolean(supabase);
}