# Build Plan — Beta Invite System + Two Beta Testers

## 1. Fix the admin allowlist
Update the `grant_admin_if_allowlisted` database function so these four emails automatically become admins on sign-up:
- `lindafrank@aol.com` (Linda)
- `mindibriese@gmail.com` (Mindi)
- `lfx2040@gmail.com` (Shelli) — corrected
- `arankin920@gmail.com` (Anna) — corrected

Also back-fill: if any of these already have accounts, grant them admin now.

## 2. Seed the two beta-tester accounts immediately
Create these confirmed accounts right now so they can sign in today:
- `david.foreman@morganstanley.com` / password `morganstanley`
- `fk@rcdcpa.com` / password `rcdcpa`

They'll be regular (non-admin) users. They can change their password from the Profile page after signing in.

## 3. Beta invite-code system (the gate)
New database table `beta_invite_codes` — code, max_uses, uses, expires_at, created_by, revoked.

New row in `app_settings`: `require_invite_code` (boolean toggle). **Default: OFF** so the two beta testers above can sign in immediately without a code. You flip it ON before publishing to `guardianyield.com`.

New Edge Function `validate-invite-code` — checks a code, atomically increments usage, returns valid/invalid.

Extend Edge Function `admin-users` with actions: `generate_invite_code`, `revoke_invite_code`, `list_invite_codes`, `set_require_invite_code`.

## 4. Admin Console UI (`src/pages/Admin.tsx`)
Add two new sections:
- **"Require invite code for sign-up"** toggle switch
- **"Beta Invite Codes"** table with Generate / Copy / Revoke buttons, showing usage and expiry

## 5. Sign-up UI (`src/pages/Auth.tsx`)
Add an "Invite code" input field that appears **only when the toggle is ON**. On submit, validate the code via the Edge Function before creating the account. OAuth (Google/Apple) sign-ups get the same gate.

## 6. Untouched
Dashboard, portfolio, stock cards, replacement engine, bulk import, PDF report, contact form, profile page, reset password, splash screen, existing admin user management, FMP caching.

---

## What you get today
1. Sign in with your admin URL → you see the new admin controls.
2. David and Frank can sign in with the credentials above.
3. Shelli & Anna sign up with their real emails → auto-promoted to admin.
4. When you're ready to gate public access, flip the toggle ON and hand out invite codes.

Ready to build — approve and I'll start.
