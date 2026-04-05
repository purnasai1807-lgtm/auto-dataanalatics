from __future__ import annotations
import json
from pathlib import Path
import pandas as pd
from app.core.config import settings
class DatasetLoaderService:
    SUPPORTED_TYPES = {"csv", "xlsx", "xls", "json"}
    @staticmethod
    def detect_file_type(filename: str) -> str:
        suffix = Path(filename).suffix.lower().replace(".", "")
        if suffix not in DatasetLoaderService.SUPPORTED_TYPES:
            raise ValueError("Unsupported file type. Please upload CSV, Excel, or JSON.")
        return "xlsx" if suffix == "xls" else suffix
    @staticmethod
    def content_type_for(file_type: str) -> str:
        return {
            "csv": "text/csv",
            "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "json": "application/json",
        }.get(file_type, "application/octet-stream")
    def should_use_dask(self, path: str | Path, file_type: str) -> bool:
        file_path = Path(path)
        size_mb = file_path.stat().st_size / (1024 * 1024)
        return file_type in {"csv", "json"} and size_mb >= settings.large_file_threshold_mb
    @staticmethod
    def _dask_dataframe_module():
        try:
            import dask.dataframe as dd
        except ModuleNotFoundError as exc:
            raise ModuleNotFoundError(
                "Dask is required for large CSV or JSON files. Install backend requirements to enable chunked processing."
            ) from exc
        return dd
    @staticmethod
    def _load_json_records(file_path: Path) -> pd.DataFrame:
        try:
            return pd.read_json(file_path, lines=True)
        except ValueError:
            with open(file_path, "r", encoding="utf-8") as handle:
                data = json.load(handle)
            if isinstance(data, dict):
                data = [data]
            if not isinstance(data, list):
                raise ValueError("Unsupported JSON structure. Please upload JSON records or an array of objects.")
            return pd.DataFrame(data)
    def load_dataframe(self, path: str | Path, file_type: str) -> pd.DataFrame:
        file_path = Path(path)
        use_dask = self.should_use_dask(file_path, file_type)
        if file_type == "csv":
            if use_dask:
                dd = self._dask_dataframe_module()
                return dd.read_csv(file_path, assume_missing=True, blocksize="64MB").compute()
            return pd.read_csv(file_path)
        if file_type == "json":
            if use_dask:
                try:
                    dd = self._dask_dataframe_module()
                    return dd.read_json(file_path, blocksize="64MB", sample=1_000_000).compute()
                except ValueError:
                    return self._load_json_records(file_path)
            return self._load_json_records(file_path)
        if file_type == "xlsx":
            return pd.read_excel(file_path, engine="openpyxl")
        raise ValueError(f"Unsupported file type: {file_type}")
    def save_dataframe(self, frame: pd.DataFrame, path: str | Path) -> Path:
        target_path = Path(path)
        target_path.parent.mkdir(parents=True, exist_ok=True)
        frame.to_csv(target_path, index=False)
        return target_path
