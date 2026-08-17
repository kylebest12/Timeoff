# Leave Booking — Best Property Services

An in-house replacement for Timetastic: staff request annual leave, Kyle approves it,
everyone sees a shared team calendar, and each person's leave balance (with carry-over)
is tracked automatically.

## Features

- Email + password sign-in (no shared Timetastic subscription)
- Staff dashboard: leave balance, upcoming leave, request form
- Admin approval queue with email notifications to both sides
- Team calendar (month view) showing approved leave + Northern Ireland bank holidays
- Configurable leave types (Annual, Sick, Unpaid, Other by default)
- Leave balance with pro-rated allowance for new starters and automatic carry-over
  (capped at 3 days by default, editable in Settings)
- Staff management: add/edit staff, set individual allowances, reset passwords

## Tech stack

Next.js 16 (App Router) + TypeScript + Tailwind CSS, Prisma 7 + PostgreSQL, NextAuth
(Auth.js) for sign-in, Resend for email notifications.

## Running it locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start a local Postgres database (no separate install needed — this uses Prisma's
   built-in local dev database):
   ```bash
   npx prisma dev -n leave-app -d
   ```
   Run `npx prisma dev ls` any time to see its connection details, or `npx prisma dev stop -n leave-app` to stop it.
3. Copy `.env.example` to `.env` and fill in `DATABASE_URL` with the connection string
   from step 2 (the plain `postgresql://...` one, not the `prisma+postgres://` one).
4. Apply the schema and seed starter data (leave types, NI bank holidays, your admin
   account from `ADMIN_EMAIL`/`ADMIN_PASSWORD` in `.env`):
   ```bash
   npx prisma migrate dev
   npx prisma db seed
   ```
5. Start the app:
   ```bash
   npm run dev
   ```
   Open http://localhost:3000 and sign in with the admin account from `.env`.

With no `RESEND_API_KEY` set, emails are printed to the terminal instead of sent — handy
for local testing.

## Deploying it for real

1. **Database** — create a free Postgres database. Either works, the app code is
   identical either way:
   - [Neon](https://neon.tech) (generous free tier, no card required), or
   - [Prisma Postgres](https://console.prisma.io) (`npx create-db` from this project
     will provision one and print a connection string)

   Copy its connection string into `DATABASE_URL`.
2. **Email** — sign up at [Resend](https://resend.com) (free tier), verify a sending
   domain or use their test domain, and put the API key in `RESEND_API_KEY`. Set
   `EMAIL_FROM` to an address on your verified domain.
3. **Hosting** — push this project to a GitHub repo and import it into
   [Vercel](https://vercel.com) (free tier). Add these environment variables in the
   Vercel project settings:
   - `DATABASE_URL`, `RESEND_API_KEY`, `EMAIL_FROM`
   - `AUTH_SECRET` — generate with `openssl rand -base64 32`
   - `AUTH_URL` — your production URL, e.g. `https://leave.bestpropertyservices.com`
   - `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` — only needed once, for the seed step below
4. Run migrations and seed the production database once, pointing at the production
   `DATABASE_URL` (e.g. from your local machine with `.env` temporarily pointed at
   production, or via Vercel's CLI):
   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```
5. **Change the admin password** immediately after first sign-in (Profile page, top
   right) and remove `ADMIN_PASSWORD` from your saved secrets — it's only used once by
   the seed script to create the account.

If you'd rather use your own domain for email/hosting or a different Postgres provider,
nothing above is locked in — swap the connection string / API key and the app works the
same.

## Notes for admins

- **Staff accounts**: created from Staff → Add staff. A temporary password is emailed
  automatically; staff should change it from their Profile page after first sign-in.
  "Reset password" on a staff member's edit page issues a new temporary one.
- **Leave types**: Settings → Leave types. Each type can be excluded from counting
  against the annual allowance (Sick/Unpaid/Other are excluded by default).
- **Public holidays**: seeded with computed Northern Ireland bank holidays (includes
  St Patrick's Day, Good Friday, and Battle of the Boyne, on top of the England/Wales
  set). Settings → Public holidays lets you generate a different year, or add/remove
  holidays by hand.
- **Carry-over**: capped at 3 days by default (Settings → Leave policy). Balances are
  computed on the fly from approved requests, so changing this figure applies
  immediately without needing to touch historical data.
