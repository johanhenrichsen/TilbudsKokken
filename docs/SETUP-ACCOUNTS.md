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

## Later: add Google sign-in
Set up a Google OAuth credential in Google Cloud, add it under Supabase
**Authentication → Providers → Google**, and I'll wire up the "Sign in with
Google" button.
