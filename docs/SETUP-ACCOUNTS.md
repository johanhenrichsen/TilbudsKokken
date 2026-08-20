# Setting up user accounts (one-time, ~10 minutes)

The app has account/sign-in built in, but it needs a free **Supabase** project to
store accounts and synced data. Do these steps once. Email/password sign-in is
included; Google sign-in can be added later.

## 1. Create a free Supabase project
1. Go to https://supabase.com → **Start your project** → sign up (free).
2. Click **New project**. Give it a name (e.g. `tilbudskokken`), set a database
   password (save it somewhere), pick the region closest to you, and create it.
3. Wait ~1 minute for it to finish setting up.

## 2. Create the data table
1. In your project, open **SQL Editor** (left sidebar) → **New query**.
2. Open the file `supabase/schema.sql` from this repo, copy everything, paste it
   into the editor, and click **Run**. You should see "Success".

## 3. Get your two keys
1. Open **Project Settings** (gear icon) → **API**.
2. Copy the **Project URL** and the **anon public** key.

## 4. Put the keys in the app
**Local development** — create a file named `.env` in the project root (copy
`.env.example`) and fill in:
```
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR-ANON-PUBLIC-KEY
```

**On Vercel (production)** — Project → **Settings → Environment Variables**, add
the same two variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) for the
Production (and Preview) environments, then **redeploy**.

## 5. (Recommended) Make sign-up instant
By default Supabase emails a confirmation link before a new account can log in.
To skip that while testing: **Authentication → Providers → Email** → turn **off**
"Confirm email" → Save. (You can turn it back on later.)

## Done
Reload the app, tap the **person icon** (next to settings), and create an account.
Your saved recipes and meal plan will sync to it and follow you across devices.

## Password reset
Already wired up — no extra setup. On the log-in screen there's a **"Forgot
password?"** link: it emails a reset link (via Supabase's built-in email), and
clicking it opens the app with a "set new password" form. For the link to work,
make sure your app URLs are allowlisted: Supabase → **Authentication → URL
Configuration** → set **Site URL** to your production URL and add your Vercel
preview URL(s) under **Redirect URLs**.

## Add Google sign-in (optional)
The "Continue with Google" button is built in but stays hidden until you enable
it. Steps:

1. **Google Cloud** → create an OAuth 2.0 Client ID (type: *Web application*).
   - Authorised redirect URI: `https://YOUR-PROJECT.supabase.co/auth/v1/callback`
     (find the exact value in Supabase → Authentication → Providers → Google).
   - Copy the **Client ID** and **Client secret**.
2. **Supabase** → **Authentication → Providers → Google** → enable it and paste
   the Client ID + secret → Save.
3. **Supabase** → **Authentication → URL Configuration** → make sure your app's
   URLs are in **Redirect URLs** (production + preview).
4. **Vercel** → add env var `VITE_GOOGLE_AUTH=1` (Production + Preview) and
   **redeploy**. The Google button now appears on the sign-in screen.
