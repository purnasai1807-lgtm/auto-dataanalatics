# Deployment Guide

## Current deploy target

This repo now contains two backend stacks:

- `frontend/` + `server/` is the active InsightForge AI SaaS that should power `/workspace`
- `backend/` is the legacy Python service from the earlier analytics product

If your goal is to make `https://auto-analytics-frontend-production.up.railway.app/workspace` run the new sellable SaaS, deploy `frontend/` and `server/`.

## Railway deployment for InsightForge AI

### Services

1. Keep or create a frontend service from `frontend` with config path `/frontend/railway.frontend.json`
2. Keep or create an API service from `server` with config path `/server/railway.server.json`
3. Add MongoDB with Railway Mongo or MongoDB Atlas
4. Keep both services in the same Railway project and environment

### Preserve the existing public URL

If you want to keep `https://auto-analytics-frontend-production.up.railway.app/workspace`, reuse the existing Railway frontend service instead of creating a new public service. Update that service so its root directory is `frontend` and redeploy it.

### API service variables

Set these on the `server` service:

- `NODE_ENV=production`
- `PORT=4000`
- `MONGODB_URI=<your Mongo connection string>`
- `JWT_SECRET=<at least 32 random characters>`
- `JWT_EXPIRES_IN=7d`
- `CLIENT_URL=https://auto-analytics-frontend-production.up.railway.app`
- `APP_URL=https://auto-analytics-frontend-production.up.railway.app`
- `CORS_ORIGIN=https://auto-analytics-frontend-production.up.railway.app`
- `OPENAI_API_KEY=<optional but recommended>`
- `OPENAI_MODEL=gpt-4.1-mini`
- `STRIPE_SECRET_KEY=<required for live billing>`
- `STRIPE_WEBHOOK_SECRET=<required for live billing>`
- `STRIPE_PRO_PRICE_ID=<required for live billing>`
- `MAX_UPLOAD_SIZE_MB=8`
- `DEMO_DATASET_PATH=./sample-data/retail_sales_sample.csv`

### Frontend service variables

Set these on the `frontend` service:

- `UPSTREAM_API_SCHEME=http`
- `UPSTREAM_API_HOSTPORT=${{<api-service-name>.RAILWAY_PRIVATE_DOMAIN}}:4000`

Replace `<api-service-name>` with the exact Railway service name for the Node API. If you keep the old service name, use that existing name in the reference variable.

### Why this works

- the browser talks to the frontend on `/workspace`
- nginx in the frontend container proxies `/api/*` to the Node API over Railway private networking
- the client bundle uses `/api` by default, so the browser never needs the API's public domain
- the API now binds to `::`, which is the safest Railway setting for both dual-stack and older IPv6-only environments

### Deploy steps

1. Push this repo to the Git branch Railway is watching
2. Redeploy the `server` service from `server/`
3. Confirm the API health check passes at `/api/health`
4. Redeploy the `frontend` service from `frontend/`
5. Open `/workspace`
6. Test signup, login, demo analysis, upload analysis, PDF export, and pricing

### Live verification

After deploy, verify:

- `https://<api-public-domain>/api/health` returns `{"status":"ok","service":"InsightForge AI API"}`
- `https://auto-analytics-frontend-production.up.railway.app/workspace` loads the new landing page
- `/workspace/login` signs in successfully
- `/workspace/dashboard` loads without API or CORS errors
- demo analysis works without a file upload
- file upload works with CSV and XLSX
- PDF export downloads successfully

## Vercel plus Railway split

If you later move the frontend to Vercel:

- deploy `frontend/` to Vercel
- set `VITE_API_BASE_URL` to the public API URL plus `/api`
- update `CLIENT_URL`, `APP_URL`, and `CORS_ORIGIN` on the API service to the Vercel production domain

## Legacy stack note

`backend/`, `backend/railway.backend.json`, `backend/railway.worker.json`, and `render.yaml` still describe the older Python architecture. Leave those in place only if you are intentionally maintaining that older product line.
