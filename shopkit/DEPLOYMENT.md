# Deploying ShopKit — MongoDB Atlas + Render (free tier)

Three pieces, deployed in this order:

```
MongoDB Atlas (M0, free)  ←  Render Web Service (API, free)  ←  Render Static Site (React, free)
     database                        server/                          client/
```

Total cost: **$0**. Total time: about 30 minutes the first go.

---

## Know this before you start

**The free API sleeps.** Render spins a free web service down after ~15 minutes with no traffic. The next request wakes it, which takes 30–60 seconds — the site will look broken to someone landing on it cold. That's acceptable for a demo, a portfolio link, or showing a client. It is not acceptable for a real storefront. The fix is $7/month for Render's Starter instance, which is always on.

**Atlas M0 pauses after 30 days idle.** You resume it with one click in the Atlas UI. It also caps at 512 MB storage, 100 ops/sec, and has no backups.

**Don't use Vercel's free plan for this.** Vercel's Hobby tier is generous, but its fair-use terms restrict it to non-commercial personal use — an actual store selling things doesn't qualify. Render's static sites and Cloudflare Pages have no such clause.

---

## Step 1 — Push to GitHub

Render deploys from a repo. From the project root:

```bash
cd shopkit
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<you>/shopkit.git
git push -u origin main
```

Before pushing, confirm no secrets are going up:

```bash
git ls-files | grep -E "^(server|client)/\.env$"
```

That should print **nothing**. Both `.gitignore` files already exclude `.env` — only the `.env.example` files belong in the repo.

---

## Step 2 — MongoDB Atlas

1. Sign up at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas), create a project.
2. **Create a cluster** → choose the **M0 Free** tier. Pick a region close to your users — for Bangladesh, Mumbai (`ap-south-1`) is the nearest.
3. **Database Access** → Add New Database User. Username + a generated password. Role: *Read and write to any database*. **Copy the password now** — Atlas won't show it again.
4. **Network Access** → Add IP Address → **Allow access from anywhere** (`0.0.0.0/0`).

   Render's free tier has no static outbound IP, so there's nothing narrower to allowlist. Your database is still protected by the username and password — but this is a real reason to use a long generated password, not one you invented.
5. **Connect** → *Drivers* → copy the connection string. It looks like:

   ```
   mongodb+srv://shopkit:<db_password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

6. Edit it: replace `<db_password>` with the real password, and insert the database name before the `?`:

   ```
   mongodb+srv://shopkit:YOURPASS@cluster0.xxxxx.mongodb.net/shopkit?retryWrites=true&w=majority
   ```

   > If your password contains `@ : / ? # [ ] %`, URL-encode it or the string parses wrong. `@` becomes `%40`, `#` becomes `%23`. Easiest fix: regenerate a password without symbols.

---

## Step 3 — Deploy the API

### Option A — Blueprint (both services at once)

The repo ships a `render.yaml`. In Render: **New → Blueprint** → pick your repo → Apply. Render creates both services and prompts you for `MONGO_URI`, `CLIENT_URL`, and `VITE_API_URL`. Skip to Step 5.

### Option B — Manually

**New → Web Service** → connect your repo, then:

| Field | Value |
| --- | --- |
| Name | `shopkit-api` |
| Root Directory | `server` |
| Runtime | Node |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Instance Type | Free |
| Health Check Path | `/api/health` |

Under **Environment**, add:

| Key | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `MONGO_URI` | the Atlas string from Step 2 |
| `JWT_SECRET` | a long random string (below) |
| `JWT_EXPIRES_IN` | `7d` |
| `CLIENT_URL` | leave blank for now — filled in Step 5 |

Generate the secret locally:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Do **not** set `PORT`. Render injects it, and `server.js` already reads `process.env.PORT`.

Deploy. When the log shows `MongoDB connected` and `API running in production mode`, test it:

```bash
curl https://shopkit-api.onrender.com/api/health
# {"status":"ok","uptime":12.3}
```

Note your actual API URL — you need it twice more.

---

## Step 4 — Seed some products

A fresh store is empty. From your laptop, point `server/.env` at the **Atlas** URI and run:

```bash
cd server
npm run seed
```

That inserts 8 demo products and an admin account (`admin@shopkit.dev` / `changeme123`). Change that password, or delete the user once you've made your own.

Verify: `curl https://shopkit-api.onrender.com/api/products`

---

## Step 5 — Deploy the frontend

**New → Static Site** → same repo:

| Field | Value |
| --- | --- |
| Name | `shopkit-client` |
| Root Directory | `client` |
| Build Command | `npm install && npm run build` |
| Publish Directory | `dist` |

Environment variable:

| Key | Value |
| --- | --- |
| `VITE_API_URL` | `https://shopkit-api.onrender.com/api` |

Two things people get wrong here:

- **Include `/api`, omit the trailing slash.** `https://shopkit-api.onrender.com/api` — not `.../api/` and not the bare domain.
- **Vite inlines this at build time**, not runtime. Changing it later requires a rebuild, not a restart. Render does rebuild on env-var change, but if you ever edit it by hand elsewhere, remember this.

Then add the SPA rewrite: **Redirects/Rewrites** tab → Source `/*`, Destination `/index.html`, Action **Rewrite**. Without it, refreshing on any sub-path returns 404. (`client/public/_redirects` covers this on Netlify and Cloudflare Pages; Render wants it in the dashboard or via `render.yaml`.)

---

## Step 6 — Close the CORS loop

Go back to **shopkit-api → Environment** and set:

```
CLIENT_URL = https://shopkit-client.onrender.com
```

No trailing slash. The browser sends the origin without one, and the comparison in `app.js` is exact.

Multiple frontends? Comma-separate them:

```
CLIENT_URL = https://shopkit-client.onrender.com,https://shop.yourdomain.com
```

Save. Render redeploys. Open the site — products load, Add to Cart works.

---

## Environment variables, all in one place

**API service**

| Key | Example | Notes |
| --- | --- | --- |
| `NODE_ENV` | `production` | suppresses error stacks in responses |
| `MONGO_URI` | `mongodb+srv://…/shopkit?…` | database name before the `?` |
| `JWT_SECRET` | 96 hex chars | rotating it logs everyone out |
| `JWT_EXPIRES_IN` | `7d` | |
| `CLIENT_URL` | `https://shopkit-client.onrender.com` | comma-separated, no trailing slash |
| `PORT` | — | **don't set it**, Render injects it |

**Static site**

| Key | Example | Notes |
| --- | --- | --- |
| `VITE_API_URL` | `https://shopkit-api.onrender.com/api` | baked in at build time |

---

## Troubleshooting

**Products don't load, console says CORS.**
`CLIENT_URL` on the API doesn't exactly match the browser's origin. Check for a trailing slash, `http` vs `https`, or a `www.` mismatch. The API logs the blocked origin — read it there and paste it in verbatim.

**`MongoServerError: bad auth`.**
Wrong password, or an un-encoded symbol in it. Regenerate a password with letters and digits only.

**API deploys fine but every request times out.**
Atlas Network Access doesn't include `0.0.0.0/0`. The connection hangs rather than failing loudly, which makes this one look like a different problem than it is.

**First visit takes 50 seconds, then everything is fast.**
That's the free-tier spin-down, working as designed. $7/month on the API service removes it. Uptime pingers that poll every 14 minutes are a popular workaround and also a violation of Render's free-tier terms — they'll suspend the service.

**Refreshing a page gives 404.**
The SPA rewrite from Step 5 is missing.

**Build fails: `vite: not found`.**
Render installed production dependencies only. Vite is a devDependency. Check the build command is `npm install` (which installs everything) and not `npm install --production` or `npm ci --omit=dev`.

---

## Before you take real money

This scaffold is a good foundation, not a shippable store. The gaps, roughly in the order they'll bite you:

1. **Lock down product creation.** Any registered user can currently `POST /api/products`. One line in `routes/productRoutes.js`: `.post(protect, admin, createProduct)`.
2. **Rate-limit the auth routes.** `express-rate-limit` on `/api/auth/*`, or your login endpoint is a free password-guessing oracle.
3. **Add `helmet`** for baseline security headers.
4. **Validate input** with `zod` or `express-validator` — Mongoose validators catch type errors, not hostile payloads.
5. **Reconsider the JWT in `localStorage`.** It's XSS-readable. An httpOnly cookie is the stronger pattern once you have a real domain for both apps.
6. **Turn on Atlas backups**, which means leaving M0 — the free tier has none. Losing your orders collection is not a recoverable situation.
7. **Payments** — for Bangladesh, SSLCommerz, bKash, or Stripe if you're selling internationally. Never trust a price sent from the browser; recalculate the order total server-side from the database.

Sources for the platform details above: [Render pricing](https://render.com/pricing), [Atlas free cluster limits](https://www.mongodb.com/docs/atlas/reference/free-shared-limitations/), [Vercel Hobby plan terms](https://vercel.com/docs/plans/hobby).
