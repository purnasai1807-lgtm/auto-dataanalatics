# InsightForge AI Architecture

## Product position

InsightForge AI is designed as a small but credible SaaS business:

- clear user outcome: upload data and get fast business insight
- obvious monetization: free tier with hard usage caps, Pro tier with unlimited usage
- onboarding path: sample dataset preview and one-click demo analysis
- retention features: saved history, exports, profile state, billing management

## Architecture

### Frontend

- React + Vite for fast delivery and clean deploys
- Tailwind CSS for productized UI consistency
- Framer Motion for premium motion
- Recharts for bar, line, and pie visualizations

### Backend

- Express with modular routes and controllers
- JWT auth with protected routes
- Multer memory uploads with file type and size restrictions
- OpenAI enrichment on top of deterministic analytics logic
- PDF export with PDFKit
- Stripe Checkout and Billing Portal for monetization

### Database

- MongoDB stores users, plans, report usage windows, and generated reports
- Mongoose schemas enforce structure and simplify role and plan state

## Data flow

1. User signs up or logs in
2. User uploads CSV or XLSX
3. Backend parses rows and detects likely numeric, date, and category fields
4. Backend creates chart data and rule-based insights
5. OpenAI upgrades the narrative into a more executive-friendly summary when configured
6. Report is saved in MongoDB
7. Dashboard loads history and allows PDF export

## Monetization model

### Free

- 3 reports per day
- saved history
- demo dataset access
- export support

### Pro

- unlimited reports
- Stripe subscription management
- buyer-friendly usage with no daily cap

## Deployment path

### Frontend on Vercel

- root: `frontend`
- build command: `npm run build`
- output directory: `dist`
- environment variable: `VITE_API_BASE_URL`

### Backend on Railway or Render

- root: `server`
- start command: `npm start`
- port: `PORT`
- persistent environment variables from `server/.env.example`

### Railway path for the live `/workspace` app

- Keep the frontend served from `frontend/`
- Keep the API served from `server/`
- Point the frontend proxy at the API over Railway private networking with `UPSTREAM_API_HOSTPORT=${{<api-service-name>.RAILWAY_PRIVATE_DOMAIN}}:4000`
- Set `PORT=4000` on the API service so the private-network target stays explicit
- Use `/server/railway.server.json` for the API service health check at `/api/health`
- Reuse the existing frontend service if you want to preserve the current public URL
- The API now binds to `::`, which is the safest default for Railway private networking across both newer dual-stack environments and older IPv6-only environments

### Database

- MongoDB Atlas

### Stripe

- create one recurring Pro price
- set `STRIPE_PRO_PRICE_ID`
- add a webhook endpoint pointing to `/api/billing/webhook`

## Demo seed workflow

- start Mongo locally with `docker compose -f docker-compose.mongo.yml up -d` from `server/`
- run `npm run seed` from `server/`
- the script creates one free user and one pro user
- both users receive seeded reports built from the bundled sample dataset stored in `server/sample-data/`
- seeded credentials include `demo@insightforge.ai` / `InsightForge123!`
- seeded credentials include `pro@insightforge.ai` / `InsightForge123!`

If you want a clean reset before reseeding, use `npm run seed:reset`.

## Security basics already included

- hashed passwords with bcrypt
- JWT-protected private routes
- Helmet headers
- CORS allowlist support
- upload extension and size checks
- no hardcoded secrets

## Recommended next commercial upgrades

- email delivery for invoices and onboarding
- organization/team accounts
- retry queue for large report jobs
- S3 storage for uploaded originals
- audit logs and admin analytics
