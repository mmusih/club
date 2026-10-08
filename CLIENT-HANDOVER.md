# Eyes On The Ball Academy — website handover

Prepared 5 October 2026. This delivery is an upload package; the site owner completes hosting and HTTPS configuration for https://eyesontheball.co.bw.

## Files to use

- `outputs/hostinger-upload.zip` — upload this as a Next.js / Node.js application. It contains the website source and dependency lockfile, without account credentials or private database exports.
- `outputs/hostinger-database.sql` — preserved academy content and images for a **new, empty** MySQL database. Import separately through phpMyAdmin. Keep this file private.
- `HOSTINGER.md` — server setup, required environment variables and maintenance instructions.

This is a server application, not a static HTML website. Uploading the ZIP to `public_html` alone will not run it.

## Upload and launch

1. Create a new MySQL database and import the SQL file. Back up existing sites and databases before any replacement.
2. Upload the website ZIP using the hosting account's Node.js application deployment flow.
3. Use Node.js 24, `npm run build` to build, and `npm start` to run. The build output is `.next`.
4. Configure the database settings, the final HTTPS origin as `APP_URL`, and the administrator email and password hash. All variables are listed in `HOSTINGER.md` and `.env.example`.
5. Generate a password hash with `npm run admin:password`. Store credentials in a password manager and give the client access privately.
6. After deployment, check the homepage, squad, news links, photos, joining email link and administrator sign-in. Publish a small approved edit and confirm it appears publicly. Verify uploads persist after a redeploy.

## Updating the website

Open `/admin` on the final domain and sign in.

- **Club details:** name, headline, introduction, location, email and telephone number.
- **Programmes:** teams, age labels, descriptions, training times and team photos.
- **Photo gallery:** upload JPG, PNG or WebP files, write captions, choose collections and select a cover photo. Maximum upload size is 8 MB per photo.
- **Club news:** title, date, category, story and photo. Published stories have their own links for sharing.
- **Fixtures:** team, opponent, season, date, time and venue. Mark a match Played and enter both scores to show a result. Upcoming lists scheduled matches from today onward; Other matches includes postponed, cancelled and past matches awaiting results.
- **Staff, Standings and Honours:** enter confirmed club records.
- **Homepage sections:** hide sections until their content is ready.

Click **Publish changes** to apply dashboard edits. **Discard changes** restores the last published content loaded in the editor and clears its recovery copy. A recovery copy of club-content edits is saved in the current browser tab after a short delay. After a refresh, choose **Restore draft** or **Discard saved draft**. This is not a shared or permanent backup; it does not cover the separate player editor. Closing the tab or clearing browser data can remove it. A draft based on an older published version cannot overwrite newer content.

## Player profiles

Use **Player profiles** to enter real player details, portraits, match records and video links. Keep incomplete profiles as drafts. Review the permission and eligibility checks before making a profile public. Birth dates stay private. Five clearly labelled fictional sample profiles are included for demonstration. They are controlled separately under Demo content and are not real player or consent records.

The existing Under-division rule requires a player to be N − 2 or younger on the club's current date for Under N (for example, 11 or younger for Under 13). This is the application's configured rule; the club should verify its suitability for its competitions before assigning players.

## Joining enquiries

Visitors can choose a team, enter their name and write a short enquiry. **Continue to email** opens their own email application with a prepared message. They must review and send it there. The website does not store or send enquiries itself, and there is no enquiry inbox in the dashboard. The club email address and phone link remain available directly.

## Demo content and new contacts

The delivery contains five fictional player profiles with statistics, three demo news stories, six fixtures, three staff profiles, four league rows and two honours. Every example is labelled Demo or Sample. Dates and results are fictional, not actual club announcements. Demo fixtures use October 2026 dates; they naturally move out of Upcoming as those dates pass.

In **Club dashboard → Demo content**, untick individual sample players or choose **Remove all demo content**, then **Publish changes**. Removing a sample player also disables its direct profile page. Other demo records can be removed individually in their corresponding sections. For real content, remove the demo entry and add a new record: the bulk cleanup uses the original demo IDs. Existing contacts, programmes, academy photos and real player records remain intact. Discard changes reverses an unpublished removal.

General enquiries use **info@eyesontheball.co.bw**. Additional contacts are **shakes@eyesontheball.co.bw**, **gbranthoka@eyesontheball.co.bw**, **+267 72 220 100** and **+267 73 888 909**. Edit these under Club details. Website links do not create email mailboxes: set up these mailboxes separately in the hosting account. They do not automatically become administrator accounts.

## Content the club maintains

Training venue and schedules remain honestly labelled “to be confirmed” until the club supplies them. Replace any draft player placeholders with real records; add confirmed news, fixtures, staff, standings and honours when available. Existing club content has been preserved rather than replaced with invented records.

## Ongoing care

Back up MySQL regularly: it contains published content, player records and uploaded photos. Keep SQL exports and environment files out of the public website. Keep the hosting account and dependencies maintained. Admin sessions expire after eight hours; sign out on shared devices. Password recovery is managed by generating a new hash and updating the hosting environment, not by an email reset link.

Live HTTPS, production database connectivity and production login must be checked after upload. Local verification is recorded separately in `outputs/RELEASE-CHECKS.md`.
