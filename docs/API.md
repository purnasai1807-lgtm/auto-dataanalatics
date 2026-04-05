# API Guide
Base path: `/api/v1`
## Auth
- `POST /auth/signup` - create a user and receive a bearer token.
- `POST /auth/login` - authenticate and receive a bearer token.
- `GET /auth/me` - fetch the current user profile.
## Datasets
- `GET /datasets` - list user datasets.
- `POST /datasets/upload` - upload CSV, Excel, or JSON and enqueue background processing.
- `GET /datasets/{dataset_id}` - fetch dataset status, schema, cleaning summary, and AI insights.
- `GET /datasets/{dataset_id}/download-cleaned` - generate a signed URL for the cleaned CSV export.
## Analytics
- `GET /analytics/{dataset_id}/dashboard` - fetch KPI cards, filter options, charts, insights, and sample rows.
Query params:
- `date_from`
- `date_to`
- `country`
- `category`
- `product_line`
## Machine Learning
- `GET /ml/datasets/{dataset_id}/runs` - list model runs for a dataset.
- `POST /ml/{dataset_id}/train` - enqueue automated model training.
- `GET /ml/runs/{run_id}` - fetch a model run and evaluation results.
- `GET /ml/runs/{run_id}/predictions` - generate a signed URL for prediction exports.
## Chat
- `POST /chat/{dataset_id}/ask` - ask a natural-language question about a dataset.
Request body:
```json
{
  "question": "Show top 5 countries by sales"
}
```
## Reports
- `GET /reports` - list saved reports.
- `POST /reports/{dataset_id}/generate` - enqueue PDF report generation.
- `GET /reports/{report_id}/download` - generate a signed URL for report download.
## Health
- `GET /healthz`
- `GET /ready`
## Live updates
- `GET /ws/datasets/{dataset_id}?token=<JWT>` - WebSocket stream for dataset, model-run, and report status updates.
## Interactive docs
FastAPI serves interactive docs at:
- `/docs`
- `/redoc`
