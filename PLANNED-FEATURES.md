# Academy website progress

## Implemented locally

- Player directory at `/players`, with name search, age-group and position filters.
- Clickable individual profiles at `/players/[id]` with photo, biography, position, age group, shirt number and preferred foot.
- Dated match history with season filtering and computed appearances, minutes, goals, assists and goalkeeper saves.
- YouTube, Vimeo and direct HTTPS MP4/WebM video links with on-demand playback and an original-video link. File uploads for videos are not included.
- Print / Save PDF action and A4 print styles. Printed profiles contain all recorded seasons and readable video links.
- Authorised player management at `/admin/players`: add and update players, upload portraits, edit match entries, attach video links, and choose draft/public visibility.
- Server-side guardian-permission gate for public youth profiles, draft isolation, request validation, and conflict detection for simultaneous edits.
- Real academy name, logo, cover photo, three further gallery photos and public contact details integrated into the local preview.

No real player records have been added; the club must enter and publish its own profiles. Temporary test records were removed.

## Validation

Type checking, production build and local integration checks passed. Browser checks covered mobile profile layout, desktop editor layout, season totals, menu navigation and photo rendering. Print action was exercised; native print-dialog/PDF output was not visually verified in the embedded browser.

## Remaining launch work

- Confirm the club's programme ages, training times and wording; these still include sample programme information.
- Configure the single administrator email and password hash in Hostinger. Public contact emails are not automatically editor accounts.
- Add real player details, portraits, statistics, videos and the club's permission records.
- More Facebook photos can be added later; current sources are in `ACADEMY-PHOTO-SOURCES.md`.
- Hostinger Business deployment remains pending. The application now uses standard Next.js on Node.js and MySQL. See HOSTINGER.md.
- Player accounts, follow notifications, automatic stat feeds and video-file uploads are not implemented.

## September 22 design and content update

- Confirmed teams: Boys’ Under 13, Under 17, Under 21 and Senior; Girls’ Over 15. Updated starter content and the existing local database without changing saved photos or other club details.
- Gallery categories now have horizontal, touch-scrollable photo rows, previous/next controls, counts, lazy image loading and the existing photo viewer.
- Dashboard gallery can filter collections and accepts custom collection names with team suggestions. Uploads use the selected collection, or Training when viewing all collections. The existing 200-photo total limit remains.
- Refreshed player-directory introduction and empty state, squad counts, profile setup guidance, content review and validation navigation.
- Training times/location and real individual player records still need club input. Team age groups are confirmed; previous notes describing those as sample ages are superseded.
- The original Sites deployment path has been replaced by the Hostinger migration described below.

## Placeholder content handover

The club will supply and maintain its own final content. Training venue and schedules now use “to be confirmed” placeholders. Five labelled draft player records (one per confirmed team) are saved in the local dashboard. Replace their names, sample position and biography; add portraits, real match records and videos; review permission and visibility before publishing. Placeholder records have no recorded guardian permission and remain excluded from public pages. Existing academy photos and contact information are retained. No further content collection is required from the user to continue development.

## Hostinger migration

- Standard Next.js/Node.js build and start commands; MySQL connection pool, schema and migrations.
- Password-based admin login with server-side sessions, login rate limits and sign-out revocation.
- Photo storage in MySQL, including chunking for small packet limits.
- Production build and local integration tests passed; live Hostinger verification is pending.
- Old platform-specific source and metadata are preserved locally in ignored outputs/legacy-platform.
