# Deployment Guide
## Local Docker
1. Copy `.env.example` to `.env` if you want a separate local env file.
2. Run `docker compose up --build -d`.
3. Open `http://localhost:3000` for the app and `http://localhost:8000/docs` for the API docs.
4. Open `http://localhost:9001` for the local MinIO console.
## Render
1. Push this repository to GitHub.
2. In Render, create a new Blueprint and point it at this repo.
3. Render will read `render.yaml` and create PostgreSQL, Redis, `auto-analytics-backend`, `auto-analytics-worker`, and `auto-analytics-frontend`.
4. During setup, provide `OPENAI_API_KEY`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and `S3_BUCKET`.
5. After the first deploy, open the frontend service URL and use that public URL if you want to override `FRONTEND_URL` or `ALLOWED_ORIGINS` later.
6. Keep `S3_ENDPOINT_URL` empty on Render when using AWS S3.
## Railway
1. Create a Railway project.
2. Add a PostgreSQL service and a Redis service.
3. Create a service named `backend` from this repo, set Root Directory to `backend`, set Config File Path to `/backend/railway.backend.json`, and deploy it.
4. Create a service named `worker` from this repo, set Root Directory to `backend`, set Config File Path to `/backend/railway.worker.json`, and deploy it.
5. Create a service named `frontend` from this repo, set Root Directory to `frontend`, set Config File Path to `/frontend/railway.frontend.json`, and deploy it.
6. In `backend` variables, set `DATABASE_URL=${{Postgres.DATABASE_URL}}`, `REDIS_URL=${{Redis.REDIS_URL}}`, `CELERY_BROKER_URL=${{Redis.REDIS_URL}}`, `CELERY_RESULT_BACKEND=${{Redis.REDIS_URL}}`, `ENVIRONMENT=production`, `OPENAI_API_KEY`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION=us-east-1`, `S3_BUCKET`, and leave `S3_ENDPOINT_URL` empty for AWS S3.
7. In `worker` variables, mirror the backend runtime values or reference them from `backend` using Railway reference variables.
8. In `frontend` variables, set `UPSTREAM_API_HOSTPORT=${{backend.RAILWAY_PRIVATE_DOMAIN}}:8000`.
9. Add a public domain to `frontend`; Railway will inject `PORT` automatically.
## Durable production mode
Set these values when Redis and S3-compatible object storage are available:
- `TASK_BACKEND=celery`
- `STORAGE_BACKEND=s3`
- `REDIS_URL`
- `CELERY_BROKER_URL`
- `CELERY_RESULT_BACKEND`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `S3_BUCKET`
- `S3_ENDPOINT_URL`
## Railway fallback mode
Use this temporary profile only when Railway Redis or bucket storage is not available:
- `TASK_BACKEND=inline`
- `STORAGE_BACKEND=local`
- leave Redis and S3 credential variables empty
- keep the worker service optional in this mode
## Health checks
- `GET /api/v1/healthz` returns the active runtime mode and whether the service is running in fallback mode.
- `GET /api/v1/ready` returns the same deployment summary for readiness checks.
## AWS
Use this mapping for an always-on production stack:
- Frontend: ECS or S3 + CloudFront
- Backend: ECS Fargate or App Runner
- Worker: ECS Fargate service running Celery
- Database: Amazon RDS PostgreSQL
- Cache and queue: Amazon ElastiCache Redis
- Storage: Amazon S3
## 24/7 runtime note
To keep the platform online while your laptop is off, the backend, worker, database, Redis, and storage must run in managed cloud infrastructure instead of local Docker.
