# XEELZ NEXUS

Mobile-first GitHub/Vercel project for the provider API flow shown in the supplied documentation.

## API flow
1. `POST /api/send-magic-link` → provider `/send-magic-link`
2. `POST /api/verify-account` → provider `/verify-account`
3. `POST /api/apply-premium` → provider `/apply-premium`

The provider documentation states that the premium endpoint is limited to 5 accounts per 24 hours per API-key owner. The project also shows a local 5/day guard in the browser.

## Important
Do **not** put the API key in `public/app.js`. Set it in Vercel:
`Settings → Environment Variables → AXZYE_API_KEY`

Then redeploy.

No local photo/image files are included. The banner media are remote URLs supplied by the project owner.


## Live website statistics
The Home page now has two shared counters:
- **Total Pengunjung** starts at `0` and increases by 1 for each new browser visitor ID. Refreshing the same browser does not keep increasing it.
- **Aktif User** shows visitors whose heartbeat was seen within the last 60 seconds.

These counters must use a persistent Redis database because Vercel serverless functions do not provide a permanent local counter file. Create an Upstash Redis database from Vercel/Upstash, then add these Vercel Environment Variables:
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

The stats API creates its own keys (`xeelz:nexus:*`), so no manual database schema is needed. After adding the variables, redeploy.
