import json
from datetime import datetime, timezone
from urllib.parse import parse_qs, urlparse
from types import SimpleNamespace
import pandas as pd
from app.core.config import settings
from app.core.security import decode_storage_token
from app.core.storage import StorageService
from app.schemas.dataset import DatasetRead
from app.services.cleaning import CleaningService
from app.services.dataset_loader import DatasetLoaderService
from app.services.ml import MLService
from app.services.profiling import ProfilingService
def test_cleaning_standardizes_and_fills_values():
    frame = pd.DataFrame(
        {
            "Order Date": ["2025-01-01", "2025-01-01", None],
            "Sales Amount": ["100", "100", "250"],
            "Category ": ["Office", "Office", None],
        }
    )
    cleaned, summary = CleaningService().clean_dataframe(frame)
    assert "order_date" in cleaned.columns
    assert summary["duplicates_removed"] == 1
    assert cleaned["category"].isna().sum() == 0
def test_profiling_builds_dashboard_kpis():
    frame = pd.DataFrame(
        {
            "order_date": pd.to_datetime(["2025-01-01", "2025-02-01", "2025-03-01"], utc=True),
            "country": ["USA", "India", "USA"],
            "sales": [1000, 1500, 1700],
            "quantity": [5, 8, 9],
            "status": ["won", "won", "won"],
        }
    )
    dashboard = ProfilingService().build_dashboard(frame)
    assert dashboard["kpis"]["orders"] == 3
    assert dashboard["kpis"]["total_sales"] == 4200.0
    assert dashboard["charts"]["time_series"]["data"]
def test_ml_service_infers_problem_type():
    frame = pd.DataFrame(
        {
            "sales": [10, 20, 30, 40, 50, 60],
            "quantity": [1, 2, 3, 4, 5, 6],
            "country": ["USA", "USA", "India", "India", "USA", "India"],
        }
    )
    service = MLService()
    assert service.infer_problem_type(frame["sales"]) == "regression"
def test_dataset_loader_reads_single_json_object(tmp_path):
    dataset_path = tmp_path / "dataset.json"
    dataset_path.write_text(json.dumps({"sales": 120, "country": "USA"}), encoding="utf-8")
    frame = DatasetLoaderService().load_dataframe(dataset_path, "json")
    assert frame.to_dict(orient="records") == [{"sales": 120, "country": "USA"}]
def test_dataset_read_preserves_schema_json_response_field():
    payload = SimpleNamespace(
        id="dataset-1",
        user_id="user-1",
        name="Sales",
        original_filename="sales.csv",
        file_type="csv",
        status="ready",
        size_bytes=128,
        row_count=1,
        column_count=2,
        processing_progress=100.0,
        schema_json={"columns": [{"name": "sales"}]},
        profile_json={},
        cleaning_summary={},
        ai_insights=[],
        sample_rows=[],
        error_message=None,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    dataset = DatasetRead.model_validate(payload)
    dumped = dataset.model_dump(by_alias=True)
    assert dumped["schema_json"] == {"columns": [{"name": "sales"}]}
def test_storage_service_uses_local_fallback_when_s3_is_unconfigured(tmp_path):
    original_local_temp_dir = settings.local_temp_dir
    original_storage_backend = settings.storage_backend
    original_bucket = settings.s3_bucket
    original_endpoint = settings.s3_endpoint_url
    original_access_key = settings.aws_access_key_id
    original_secret_key = settings.aws_secret_access_key
    original_api_prefix = settings.api_v1_prefix
    try:
        settings.local_temp_dir = tmp_path
        settings.storage_backend = "auto"
        settings.s3_bucket = ""
        settings.s3_endpoint_url = None
        settings.aws_access_key_id = ""
        settings.aws_secret_access_key = ""
        settings.api_v1_prefix = "/api/v1"
        storage = StorageService()
        storage.ensure_bucket()
        storage.upload_bytes(b"hello", "exports/report.txt")
        assert storage.download_bytes("exports/report.txt") == b"hello"
        download_url = storage.generate_presigned_url("exports/report.txt")
        parsed_url = urlparse(download_url)
        token = parse_qs(parsed_url.query)["token"][0]
        payload = decode_storage_token(token)
        assert storage.uses_local_storage is True
        assert parsed_url.path == "/api/v1/storage/download"
        assert payload["key"] == "exports/report.txt"
        assert storage.resolve_local_path("exports/report.txt").exists()
    finally:
        settings.local_temp_dir = original_local_temp_dir
        settings.storage_backend = original_storage_backend
        settings.s3_bucket = original_bucket
        settings.s3_endpoint_url = original_endpoint
        settings.aws_access_key_id = original_access_key
        settings.aws_secret_access_key = original_secret_key
        settings.api_v1_prefix = original_api_prefix
def test_runtime_summary_reports_fallback_modes():
    original_environment = settings.environment
    original_task_backend = settings.task_backend
    original_storage_backend = settings.storage_backend
    original_broker = settings.celery_broker_url
    original_result_backend = settings.celery_result_backend
    original_bucket = settings.s3_bucket
    original_endpoint = settings.s3_endpoint_url
    original_access_key = settings.aws_access_key_id
    original_secret_key = settings.aws_secret_access_key
    try:
        settings.environment = "production"
        settings.task_backend = "inline"
        settings.storage_backend = "local"
        settings.celery_broker_url = ""
        settings.celery_result_backend = ""
        settings.s3_bucket = ""
        settings.s3_endpoint_url = None
        settings.aws_access_key_id = ""
        settings.aws_secret_access_key = ""
        summary = settings.runtime_summary
        assert summary["task_backend"] == "inline"
        assert summary["storage_backend"] == "local"
        assert summary["degraded"] is True
        assert len(summary["warnings"]) == 2
    finally:
        settings.environment = original_environment
        settings.task_backend = original_task_backend
        settings.storage_backend = original_storage_backend
        settings.celery_broker_url = original_broker
        settings.celery_result_backend = original_result_backend
        settings.s3_bucket = original_bucket
        settings.s3_endpoint_url = original_endpoint
        settings.aws_access_key_id = original_access_key
        settings.aws_secret_access_key = original_secret_key
