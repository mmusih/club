# Eyes On The Ball Academy

Academy website, photo gallery, player profiles and staff dashboard.

## Stack

Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/Radix UI, MySQL (mysql2) and Drizzle schema/migrations. Standard Node.js runtime; no Cloudflare or Sites service is required.

## Hostinger

See [HOSTINGER.md](HOSTINGER.md) for deployment and configuration. Run this as a Node.js/Next.js website on the Business plan.

## Local development

1. Install dependencies with `npm ci` (Node.js 22.13+; Node.js 24 recommended).
2. Copy `.env.example` to `.env`, set `APP_URL=http://localhost:5173` for local development, and configure local MySQL and administrator settings.
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

## Club records and seasons

The homepage now includes Squad, Staff, Fixtures, Standings and Honours. Manage staff, official league table rows and honours in the matching dashboard sections. Photos can be selected from the gallery. Empty sections do not invent club records.

Use consecutive seasons such as **2026/27**. Four recent seasons are always offered, and older recorded seasons remain available. Legacy year-only player records display as their starting-year season (2025 becomes 2025/26). Fixtures without a season use a July-to-June default based on the match date; editors can set the correct season for each competition.

Under **Player profiles → Match statistics**, enter goal and assist totals, then optionally add named contributions with a match minute. For a goal, enter the assisting teammate; for an assist, enter the goal scorer. Named details cannot exceed their corresponding totals. These details describe the current player's record and do not automatically update another player's profile.

Validation: `node --env-file=.env.hostinger-test tests/club-records-integration.mjs` checks persistence, legacy data, seasons, standings arithmetic and named contributions against the isolated test database. Add `--review` to pause with temporary records for browser checks; press Enter afterward to restore the original test content.

## Homepage visibility and division eligibility

Use **Homepage sections** in the club dashboard to show or hide each homepage section. Publish to apply changes. Hidden sections keep their saved content; links to hidden sections are removed from the homepage. This is a display setting, not access control: the public content API and direct player pages remain accessible.

For an **Under N** division, a player must be **N − 2 or younger today**, using the club's date in Africa/Gaborone (Under 13: 11 or younger; Under 17: 15 or younger; Under 21: 19 or younger). Add a private date of birth in Player details. Invalid or missing birth dates block assignment to an Under division. Birth dates are excluded from public player responses and pages. Public reads check eligibility again so a player who ages out no longer appears until staff chooses an eligible division. Existing Under profiles without birth dates are flagged for review in the admin and hidden until corrected. Senior and other non-Under groups do not use this upper-age rule.

## Client delivery

See CLIENT-HANDOVER.md for upload and editing instructions. News stories now have shareable pages. Joining enquiries prepare an email in the visitor’s email app; the website does not send or store the message. Club-content drafts can be recovered in the same browser tab after a refresh. Upcoming fixtures exclude cancellations, postponements and past unplayed dates. Delivery demos are explicitly enabled through Demo content; removing them keeps them removed, including direct profile URLs.

## Fixtures, match tracking and supporters

In **Fixtures**, define a named competition (league, promotional playoff, cup, friendly or custom), then select the team and competition before adding a fixture. Existing text competitions remain readable and can be linked to a defined competition.

Open **Lineup & live match tracker**, choose a formation, and drag profile players onto the pitch. On touch screens or with a keyboard, select a player and then a position; selecting a position first also works. Players are grouped by position and filtered by the fixture's age group, with an option to show all eligible age groups. Add reserves to the bench before starting the match.

Start the match, advance the current minute manually, and select a player on the pitch to record goals, assists, cards, injuries or substitutions. The second yellow or a red card removes a player; substitute minutes are calculated from the event times. Returning substitutes are supported. An injury records the incident; use a substitution to record the player leaving. Finish at the actual final minute, including stoppage time. Set the normal match length before kick-off. Update First-half added minutes and Second-half added minutes when the referee announces them. At the end of the first-half clock, select Half-time, then Start second half when play resumes. Added time counts towards player minutes; the break does not. Goals set the academy score; enter the opponent score separately. Undo incorrect events in the match log; remove dependent later events first if necessary.

Use **Publish changes** to save the match and update the public match centre and player statistics. Linked fixture statistics are derived from the saved match record, so repeated saves do not add duplicate appearances. Edit linked records through Fixtures; manually entered historical records remain separate. Draft/unconsented player portraits and names are not included in the public linked lineup.

The **Supporters** dashboard section manages the public **/supporters** page. Upload multiple photos and add interviews using YouTube, Vimeo, or HTTPS MP4/WebM links. Visitors can filter photos and interviews, browse pages, and open photos or videos. Publish changes after editing.

Run the match model regression checks with `node tests/match-record.mjs`.

Player profiles have an Upload headshot / photo control. The same saved photo is used in lineups; use Refresh photos in the lineup editor after updating a profile. Standings rows accept a logo upload or a gallery image, with the academy logo used by default for its own row.
