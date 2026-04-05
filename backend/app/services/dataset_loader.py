from __future__ import annotations
import json
from pathlib import Path
import dask.dataframe as dd
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
    def load_dataframe(self, path: str | Path, file_type: str) -> pd.DataFrame:
        file_path = Path(path)
        use_dask = self.should_use_dask(file_path, file_type)
        if file_type == "csv":
            if use_dask:
                return dd.read_csv(file_path, assume_missing=True, blocksize="64MB").compute()
            return pd.read_csv(file_path)
        if file_type == "json":
            if use_dask:
                try:
                    return dd.read_json(file_path, blocksize="64MB", sample=1_000_000).compute()
                except ValueError:
                    pass
            try:
                return pd.read_json(file_path, lines=True)
            except ValueError:
                with open(file_path, "r", encoding="utf-8") as handle:
                    data = json.load(handle)
                return pd.DataFrame(data)
        if file_type == "xlsx":
            return pd.read_excel(file_path, engine="openpyxl")
        raise ValueError(f"Unsupported file type: {file_type}")
    def save_dataframe(self, frame: pd.DataFrame, path: str | Path) -> Path:
        target_path = Path(path)
        target_path.parent.mkdir(parents=True, exist_ok=True)
        frame.to_csv(target_path, index=False)
        return target_path
