# InsightForge AI

InsightForge AI is a production-style AI analytics SaaS built to feel launch-ready, monetizable, and easy to hand off as a $1000+ starter product.

Users can:

- sign up and log in with JWT auth
- upload CSV or XLSX files
- get AI-powered summaries and rule-based insights
- review charts instantly
- save report history
- export polished PDF reports
- upgrade from a free plan to a Stripe-backed Pro plan

## Stack

- Frontend: React + Vite + Tailwind CSS + Framer Motion + Recharts
- Backend: Node.js + Express
- Database: MongoDB + Mongoose
- AI: OpenAI Responses API
- Billing: Stripe Checkout + Billing Portal

## Repo layout

```text
frontend/   InsightForge AI web client
server/     Express API, auth, uploads, AI analysis, Stripe, PDF export
backend/    Legacy Python backend kept intact from earlier project work
docs/       Product, architecture, and deployment notes
sample-data/ Demo dataset used for onboarding
```

## Local run

### 1. Backend

```bash
cd server
cp .env.example .env
npm install
npm run dev
```

Required backend variables:

- `MONGODB_URI`
- `JWT_SECRET`
- `CLIENT_URL`
- `APP_URL`
- `CORS_ORIGIN`
- `OPENAI_API_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRO_PRICE_ID`

Optional local demo seed:

```bash
cd server
docker compose -f docker-compose.mongo.yml up -d
```

Then run:

```bash
cd server
npm run seed
```

Seeded accounts:

- `demo@insightforge.ai` / `InsightForge123!`
- `pro@insightforge.ai` / `InsightForge123!`

### 2. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Default frontend variable:

- `VITE_API_BASE_URL=http://localhost:4000/api`
- `VITE_SHOW_DEMO_HINTS=false`

## Pricing logic

- Free plan: 3 reports per day
- Pro plan: unlimited reports
- Limit enforcement happens in the backend before report generation

## Core API routes

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/dashboard/overview`
- `GET /api/reports`
- `POST /api/reports/analyze`
- `POST /api/reports/demo/analyze`
- `GET /api/reports/demo/preview`
- `GET /api/reports/:reportId`
- `GET /api/reports/:reportId/pdf`
- `GET /api/profile`
- `PATCH /api/profile`
- `POST /api/billing/checkout-session`
- `POST /api/billing/portal-session`
- `POST /api/billing/webhook`

## Deployment

- Frontend: deploy `frontend/` to Vercel or Railway
- Backend: deploy `server/` to Railway or Render
- Database: MongoDB Atlas
- Billing: Stripe product + recurring price wired to `STRIPE_PRO_PRICE_ID`

### Railway quick start for `/workspace`

- Frontend service root: `frontend`
- Frontend config path: `/frontend/railway.frontend.json`
- API service root: `server`
- API config path: `/server/railway.server.json`
- API health check: `/api/health`
- Frontend proxy variable: `UPSTREAM_API_HOSTPORT=${{<api-service-name>.RAILWAY_PRIVATE_DOMAIN}}:4000`

If you want to keep the existing public URL `https://auto-analytics-frontend-production.up.railway.app/workspace`, reuse the current Railway frontend service and redeploy it from `frontend/` instead of creating a brand-new public service.

## Launch checklist

- Create MongoDB Atlas database and set `MONGODB_URI`
- Create an OpenAI API key and set `OPENAI_API_KEY`
- Create a Stripe recurring price and set `STRIPE_PRO_PRICE_ID`
- Add a Stripe webhook for `/api/billing/webhook`
- Set `CLIENT_URL`, `APP_URL`, and `CORS_ORIGIN`
- Run `npm run seed` in `server/` if you want ready-to-demo accounts

See [docs/INSIGHTFORGE_AI.md](docs/INSIGHTFORGE_AI.md) for architecture and deployment details.
See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for the exact Railway wiring.

## Verification completed

- Backend dependency audit: `0 vulnerabilities`
- Backend service import check: passed
- Dataset parsing and chart generation smoke test: passed
- Frontend production build: passed with `npm run build`
