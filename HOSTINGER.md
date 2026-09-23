# Hostinger Business deployment

This is a Next.js server application. Use Hostinger's **Deploy Web App / Node.js** feature, not a static upload to `public_html`.

## Prepared files

- `outputs/hostinger-upload.zip`: website source, package lockfile and MySQL migrations. No passwords, local database files, or private data exports.
- `outputs/hostinger-database.sql`: schema and preserved local content, five player records and uploaded images. Import this separately through phpMyAdmin into a **new, empty database**. Keep it private; do not place it in `public_html` or commit it.
- `outputs/content-migration.json`: private backup of the original local D1/R2 content. The original `.wrangler` data is also retained.

## Deployment

1. Sign in to hPanel and select the Business plan and intended domain. Back up any existing website/database before replacing it.
2. Create a MySQL database and database user in **Databases → Management**. Save the credentials in a password manager.
3. Open phpMyAdmin for that new database and import `outputs/hostinger-database.sql`. Do not import it into a database with existing club tables.
4. Generate your admin password hash locally with `npm run admin:password`. The password is entered invisibly; only the hash is printed. There is no default admin password.
5. Choose **Add Website → Deploy Web App → Upload your website files**, then select `outputs/hostinger-upload.zip`. For an existing Node.js website, use its deployment upload flow.
6. Select **Next.js**, **Node.js 24** (22.13+ also meets the app requirement), project root **`.`**, build command **`npm run build`**, output **`.next`**, and start command **`npm start`** if requested. Let Hostinger supply the runtime port.
7. Configure the environment variables below before deploying. Select the server-side Next.js application option.
8. Deploy and wait for a successful build. Confirm HTTPS, the homepage, `/players`, and `/admin/login`. Sign in and check content publishing and photo upload. Keep any test player as a draft and remove test data afterwards.

| Variable | Value |
| --- | --- |
| `APP_URL` | Exact public HTTPS origin, e.g. `https://your-domain.com`; no path |
| `DB_HOST` | Host shown in Hostinger's database settings; usually `localhost` |
| `DB_PORT` | `3306`, unless Hostinger specifies otherwise |
| `DB_NAME` | Full database name, including Hostinger's prefix |
| `DB_USER` | Full database username, including the prefix |
| `DB_PASSWORD` | Database user's password |
| `DB_SSL` | `false` for the local Hostinger connection; `true` for remote TLS connections |
| `ADMIN_EMAIL` | Email of the single club administrator |
| `ADMIN_PASSWORD_HASH` | Complete `scrypt:...` output from the password helper |

Restart/redeploy after changing environment variables. If the public domain changes, update `APP_URL` too; it protects all write operations against cross-origin requests.

## Storage and maintenance

Published content, player records, sessions and uploaded photos are stored in MySQL. Photos are stored in 256 KB chunks to tolerate small MySQL packet limits and survive redeployments. Uploads remain limited to 8 MB each; gallery storage counts toward your MySQL quota. Back up the database, not just the application ZIP. For a large gallery, migrate media to object storage later.

Admin sessions expire after eight hours. Sign out revokes the session. Changing `ADMIN_PASSWORD_HASH` invalidates existing sessions. Ten login attempts are allowed per 15-minute account window; the count persists in MySQL. There is no email password-reset service: reset the hash through hPanel when needed.

For later schema updates, back up MySQL and run `npm run db:migrate` with the production database environment configured. The migration runner records checksums and applied versions. Never run the local integration tests against production: they intentionally save test content and only accept isolated local test databases.

## Official references

- [Deploy a Node.js application](https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/)
- [Connect Hostinger MySQL](https://www.hostinger.com/support/connecting-a-hostinger-mysql-database-to-a-node-js-application/)

## Current status

Local production build and MySQL-compatible integration tests have passed. The live upload, real Hostinger database connection, HTTPS and production login still require verification in the signed-in Hostinger account.
