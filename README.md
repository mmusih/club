# Eyes On The Ball Academy

Academy website, photo gallery, player profiles and staff dashboard.

## Stack

Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/Radix UI, MySQL (mysql2) and Drizzle schema/migrations. Standard Node.js runtime; no Cloudflare or Sites service is required.

## Hostinger

See [HOSTINGER.md](HOSTINGER.md) for deployment and configuration. Run this as a Node.js/Next.js website on the Business plan.

## Local development

1. Install dependencies with `npm ci` (Node.js 22.13+; Node.js 24 recommended).
2. Copy `.env.example` to `.env` and set a local MySQL database, `APP_URL`, and administrator settings.
3. Run `npm run db:migrate` to create tables. An empty database uses the academy seed content until first publication.
4. Run `npm run admin:password` to generate an admin password hash and save it as `ADMIN_PASSWORD_HASH` in your environment.
5. Run `npm run dev` and open http://localhost:5173. Admin sign-in is at `/admin/login`.

Build: `npm run build`. Production: `npm start` (honours `PORT`). Published edits and photos persist in MySQL. Player profiles require guardian consent before publication. Do not commit private database exports or environment files.

## Validation

Integration scripts in `tests/` require an isolated local database named `club_hostinger_test_*` and `.env.hostinger-test`, including a generated `TEST_ADMIN_PASSWORD`. Run `node --env-file=.env.hostinger-test tests/local-integration.mjs`, then `tests/players-integration.mjs` and `tests/hostinger-auth-integration.mjs` using the same prefix. Tests exercise publishing, conflicts, player privacy, authentication, throttling and uploads. Never run these against production.

Photo attribution remains in ACADEMY-PHOTO-SOURCES.md. Programme schedules and venue copy still need club confirmation.

## News and fixtures

Use **Club dashboard → Club news** to add stories, dates, categories and a photo from the gallery. The newest story leads the news wall; visitors can filter categories and open full stories.

Use **Club dashboard → Fixtures** to edit the match table. Add the academy team, opponent, date, local kick-off time, venue and competition. Mark completed games **Played** and enter both scores (academy first); they appear under **Results**. Postponed and cancelled games retain their status. Changes become public only after **Publish changes**. Existing saved content automatically starts with an empty fixtures list; no database migration is needed.

The sticky homepage header, scroll progress, hero parallax and section reveals respect reduced-motion preferences. Run `tests/fixtures-integration.mjs` with the isolated test environment to verify news/fixture persistence and validation; the script restores the original test content.
