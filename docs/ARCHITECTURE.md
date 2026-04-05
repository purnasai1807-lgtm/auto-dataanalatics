# Architecture Overview
## Backend
- FastAPI handles auth, uploads, dashboard APIs, chat APIs, report APIs, and WebSockets.
- Celery workers process long-running dataset cleaning, ML training, and report generation jobs.
- PostgreSQL stores users, dataset metadata, model runs, and report history.
- Redis powers Celery queues and response caching.
- S3-compatible object storage holds raw uploads, cleaned CSVs, model artifacts, prediction exports, and PDF reports.
## Analytics pipeline
1. User uploads CSV, Excel, or JSON.
2. Backend streams the file to local temp storage and uploads it to object storage.
3. Celery downloads the raw file, loads it with Pandas or Dask, cleans it, profiles it, and generates heuristic plus OpenAI-enhanced insights.
4. Dashboard APIs read the cleaned data, apply filters, and return chart-ready payloads.
5. Auto ML trains multiple models, stores artifacts, and exposes comparison metrics.
6. Chat endpoints answer natural-language questions with deterministic dataframe logic plus optional OpenAI wording.
## Frontend
- React + Vite renders a responsive analytics workspace.
- Tailwind provides the visual system, dark/light themes, and layout primitives.
- Recharts powers KPI and categorical visualizations.
- Plotly renders the correlation heatmap.
- Framer Motion adds transitions and polished entry animations.
