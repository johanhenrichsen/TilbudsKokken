// Supabase client + tiny data layer for user accounts and cloud sync.
//
// Configuration is read from Vite env vars (safe to expose in the client — the
// anon key only grants access allowed by Row-Level Security). If the keys are
// missing the app still runs fully; accounts just aren't available until the
// one-time Supabase setup is done (see docs/SETUP-ACCOUNTS.md).

import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isCloudConfigured = Boolean(url && anon);

export const supabase = isCloudConfigured
  ? createClient(url, anon, { auth: { persistSession: true, autoRefreshToken: true } })
  : null;

// Load the signed-in user's synced data blob, or null if they have no row yet.
export async function loadUserData(userId) {
  if (!supabase || !userId) return null;
  const { data, error } = await supabase
    .from("user_data")
    .select("data")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) { console.error("[cloud] load failed:", error.message); return null; }
  return data?.data ?? null;
}

// Upsert the whole synced blob for a user (one row per user).
export async function saveUserData(userId, blob) {
  if (!supabase || !userId) return;
  const { error } = await supabase
    .from("user_data")
    .upsert(
      { user_id: userId, data: blob, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );
  if (error) console.error("[cloud] save failed:", error.message);
}

// Human-friendly message for the auth errors we surface in the UI.
export function friendlyAuthError(err) {
  const msg = (err && err.message) || String(err || "");
  if (/invalid login credentials/i.test(msg)) return "Wrong email or password.";
  if (/user already registered/i.test(msg)) return "That email already has an account — try logging in.";
  if (/password should be at least/i.test(msg)) return "Password must be at least 6 characters.";
  if (/unable to validate email|invalid email/i.test(msg)) return "That doesn't look like a valid email.";
  if (/email not confirmed/i.test(msg)) return "Please confirm your email first (check your inbox).";
  return msg || "Something went wrong. Please try again.";
}
