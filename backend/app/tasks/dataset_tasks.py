from __future__ import annotations
import asyncio
import json
from datetime import datetime, timezone
from pathlib import Path
from celery.utils.log import get_task_logger
from sqlalchemy import select
from app.core.celery_app import celery_app
from app.core.config import settings
from app.core.database import SyncSessionLocal
from app.core.storage import StorageService
from app.models.dataset import Dataset
from app.models.model_run import ModelRun
from app.models.report import Report
from app.services.ai import AIService
from app.services.cleaning import CleaningService
from app.services.dataset_loader import DatasetLoaderService
from app.services.export import ExportService
from app.services.ml import MLService
from app.services.profiling import ProfilingService
logger = get_task_logger(__name__)
def _dataset_download_path(dataset: Dataset) -> Path:
    return Path(settings.local_temp_dir) / "worker" / "raw" / f"{dataset.id}.{dataset.file_type}"
def _cleaned_output_path(dataset: Dataset) -> Path:
    return Path(settings.local_temp_dir) / "worker" / "cleaned" / f"{dataset.id}_cleaned.csv"
@celery_app.task(name="process_dataset_task")
def process_dataset_task(dataset_id: str) -> dict:
    db = SyncSessionLocal()
    storage = StorageService()
    loader = DatasetLoaderService()
    cleaning = CleaningService()
    profiler = ProfilingService()
    ai_service = AIService()
    try:
        storage.ensure_bucket()
        dataset = db.get(Dataset, dataset_id)
        if not dataset:
            return {"status": "not_found", "dataset_id": dataset_id}
        dataset.status = "processing"
        dataset.processing_progress = 10
        dataset.error_message = None
        db.commit()
        local_input = _dataset_download_path(dataset)
        storage.download_file(dataset.original_storage_key, local_input)
        dataset.processing_progress = 35
        db.commit()
        frame = loader.load_dataframe(local_input, dataset.file_type)
        cleaned_frame, cleaning_summary = cleaning.clean_dataframe(frame)
        profile = profiler.build_profile(cleaned_frame, cleaning_summary)
        ai_insights = asyncio.run(
            ai_service.generate_insights(
                dataset.name,
                profile,
                profile["default_dashboard"]["insights"],
            )
        )
        local_cleaned = _cleaned_output_path(dataset)
        loader.save_dataframe(cleaned_frame, local_cleaned)
        cleaned_key = f"{settings.storage_prefix_cleaned}/{dataset.user_id}/{dataset.id}_cleaned.csv"
        profile_key = f"{settings.storage_prefix_cleaned}/{dataset.user_id}/{dataset.id}_profile.json"
        storage.upload_file(local_cleaned, cleaned_key, "text/csv")
        storage.upload_bytes(json.dumps(profile, default=str).encode("utf-8"), profile_key, "application/json")
        dataset.cleaned_storage_key = cleaned_key
        dataset.profile_storage_key = profile_key
        dataset.schema_json = profile["schema"]
        dataset.profile_json = profile
        dataset.cleaning_summary = cleaning_summary
        dataset.ai_insights = ai_insights
        dataset.sample_rows = profiler.dataframe_records(cleaned_frame, limit=20)
        dataset.row_count = int(len(cleaned_frame))
        dataset.column_count = int(cleaned_frame.shape[1])
        dataset.status = "ready"
        dataset.processing_progress = 100
        dataset.last_processed_at = datetime.now(timezone.utc)
        db.commit()
        logger.info("Dataset %s processed successfully", dataset_id)
        return {
            "status": "ready",
            "dataset_id": dataset_id,
            "row_count": dataset.row_count,
            "column_count": dataset.column_count,
        }
    except Exception as exc:
        logger.exception("Dataset processing failed for %s", dataset_id)
        dataset = db.get(Dataset, dataset_id)
        if dataset:
            dataset.status = "failed"
            dataset.error_message = str(exc)
            dataset.processing_progress = 0
            db.commit()
        return {"status": "failed", "dataset_id": dataset_id, "error": str(exc)}
    finally:
        db.close()
@celery_app.task(name="train_model_task")
def train_model_task(model_run_id: str) -> dict:
    db = SyncSessionLocal()
    storage = StorageService()
    loader = DatasetLoaderService()
    ml_service = MLService()
    try:
        storage.ensure_bucket()
        model_run = db.get(ModelRun, model_run_id)
        if not model_run:
            return {"status": "not_found", "model_run_id": model_run_id}
        dataset = db.get(Dataset, model_run.dataset_id)
        if not dataset or not dataset.cleaned_storage_key:
            raise ValueError("Dataset is not processed yet.")
        model_run.status = "running"
        model_run.error_message = None
        db.commit()
        local_cleaned = _cleaned_output_path(dataset)
        storage.download_file(dataset.cleaned_storage_key, local_cleaned)
        frame = loader.load_dataframe(local_cleaned, "csv")
        result = ml_service.train(frame, model_run.target_column, model_run.problem_type)
        predictions_key = f"{settings.storage_prefix_exports}/{dataset.user_id}/{model_run.id}_predictions.csv"
        model_key = f"{settings.storage_prefix_exports}/{dataset.user_id}/{model_run.id}_model.joblib"
        predictions_path = Path(settings.local_temp_dir) / "worker" / "predictions" / f"{model_run.id}.csv"
        loader.save_dataframe(result["predictions_df"], predictions_path)
        storage.upload_file(predictions_path, predictions_key, "text/csv")
        storage.upload_bytes(result["model_bytes"], model_key, "application/octet-stream")
        model_run.target_column = result["target_column"]
        model_run.problem_type = result["problem_type"]
        model_run.best_model = result["best_model"]
        model_run.metrics_json = {"metrics": result["metrics"], "metadata": result["metadata"]}
        model_run.comparison_json = result["comparison"]
        model_run.feature_importance_json = result["feature_importance"]
        model_run.predictions_storage_key = predictions_key
        model_run.model_storage_key = model_key
        model_run.status = "completed"
        db.commit()
        return {"status": "completed", "model_run_id": model_run_id, "best_model": result["best_model"]}
    except Exception as exc:
        logger.exception("Model training failed for %s", model_run_id)
        model_run = db.get(ModelRun, model_run_id)
        if model_run:
            model_run.status = "failed"
            model_run.error_message = str(exc)
            db.commit()
        return {"status": "failed", "model_run_id": model_run_id, "error": str(exc)}
    finally:
        db.close()
@celery_app.task(name="generate_report_task")
def generate_report_task(report_id: str) -> dict:
    db = SyncSessionLocal()
    storage = StorageService()
    exporter = ExportService()
    try:
        storage.ensure_bucket()
        report = db.get(Report, report_id)
        if not report:
            return {"status": "not_found", "report_id": report_id}
        dataset = db.get(Dataset, report.dataset_id) if report.dataset_id else None
        if not dataset:
            raise ValueError("Dataset not found for report generation.")
        latest_run = db.execute(
            select(ModelRun)
            .where(ModelRun.dataset_id == dataset.id)
            .order_by(ModelRun.created_at.desc())
        ).scalars().first()
        report.status = "running"
        db.commit()
        dashboard = dataset.profile_json.get("default_dashboard", {}) if dataset.profile_json else {}
        model_summary = None
        if latest_run and latest_run.status == "completed":
            model_summary = {
                "best_model": latest_run.best_model,
                "metrics": latest_run.metrics_json.get("metrics", {}),
            }
        pdf_bytes = exporter.build_pdf_report(dataset.name, dashboard, model_summary)
        file_key = f"{settings.storage_prefix_exports}/{dataset.user_id}/{report.id}_report.pdf"
        storage.upload_bytes(pdf_bytes, file_key, "application/pdf")
        report.file_storage_key = file_key
        report.snapshot_json = {
            "dataset_name": dataset.name,
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "kpis": dashboard.get("kpis", {}),
            "insights": dashboard.get("insights", []),
            "model": model_summary,
        }
        report.status = "completed"
        db.commit()
        return {"status": "completed", "report_id": report_id}
    except Exception as exc:
        logger.exception("Report generation failed for %s", report_id)
        report = db.get(Report, report_id)
        if report:
            report.status = "failed"
            report.error_message = str(exc)
            db.commit()
        return {"status": "failed", "report_id": report_id, "error": str(exc)}
    finally:
        db.close()
