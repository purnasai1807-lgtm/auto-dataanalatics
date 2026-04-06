# Auto Data Analytics Platform
AI-powered analytics SaaS starter that combines automated data cleaning, dashboard generation, business insight narration, chat with data, and Auto ML in one full-stack project.
## Stack
- Frontend: React + Vite + Tailwind + Recharts + Plotly + Framer Motion
- Backend: FastAPI (async) + Celery + Redis
- Data processing: Pandas + Dask
- ML: scikit-learn + XGBoost + LightGBM-ready dependency set
- AI: OpenAI API with graceful fallback insight generation
- Database: PostgreSQL
- Storage: AWS S3 or S3-compatible storage (MinIO for local Docker)
- Deployment: Docker, Render/Railway/AWS ready
## Monorepo structure
```text
backend/            FastAPI app, Celery tasks, analytics/ML services, tests
frontend/           Vite React client, dashboard UI, chat, model and report panels
sample-data/        Example retail dataset
docs/               API, deployment, and architecture notes
docker-compose.yml  Local multi-service stack
render.yaml         One-click Render blueprint
```
## Core capabilities
- Smart uploads for CSV, Excel, and JSON
- Automated data cleaning with type correction, missing value handling, duplicate removal, and outlier clipping
- Dashboard generation with KPI cards, filters, trend detection, line/bar/pie/heatmap charts
- Auto ML for regression/classification with model comparison and feature importance
- AI-generated insights and natural-language chart explanations
- Chat with data for top-N analysis and sales forecasting prompts
- Real-time updates over WebSockets
- PDF reports, cleaned dataset download, and predictions export
- User authentication and report history
## Quick start
### Backend only
```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --app-dir backend --reload
```
### Full stack with Docker
```bash
docker compose up --build
```
Then open:
- Frontend: `http://localhost:3000`
- API docs: `http://localhost:8000/docs`
## Cloud deployment files
- Render: `render.yaml`
- Railway backend service config: `backend/railway.backend.json`
- Railway worker service config: `backend/railway.worker.json`
- Railway frontend service config: `frontend/railway.frontend.json`
- For an always-on hosted setup, the fastest path is the Render Blueprint in `render.yaml` with managed Postgres, Redis, a backend web service, a Celery worker, and the frontend.
- See `docs/DEPLOYMENT.md` for the 24/7 deployment checklist and post-deploy health checks.
## Environment variables
Copy `.env.example` to `.env` and update:
- `SECRET_KEY`
- `DATABASE_URL`
- `REDIS_URL`
- `CELERY_BROKER_URL`
- `CELERY_RESULT_BACKEND`
- `TASK_BACKEND`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `STORAGE_BACKEND`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `S3_BUCKET`
- `S3_ENDPOINT_URL`
- `ALLOWED_ORIGINS`
## Runtime modes
- `TASK_BACKEND=auto` uses Celery when Redis broker/result variables are present and falls back to inline background tasks otherwise.
- `STORAGE_BACKEND=auto` uses S3-compatible storage when bucket credentials are present and falls back to local container storage otherwise.
- For durable production, set `TASK_BACKEND=celery` and `STORAGE_BACKEND=s3`.
- The health endpoints now expose the active runtime mode and whether the app is running in fallback mode.
## OpenAI integration
The backend uses the official OpenAI Python SDK `responses.create(...)` pattern for:
- insight narration
- business action suggestions
- conversational answer polishing
If `OPENAI_API_KEY` is not configured, the platform still works with deterministic heuristics for insights and chat.
## Sample data
Use `sample-data/retail_sales_sample.csv` to test the upload and dashboard flow.
## Verification
- Backend source compiles with `python -m compileall backend/app`
- Dockerized frontend and backend build in the local stack
## Docs
- `docs/ARCHITECTURE.md`
- `docs/API.md`
- `docs/DEPLOYMENT.md`
