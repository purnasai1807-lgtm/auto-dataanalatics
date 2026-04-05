from __future__ import annotations
import re
from typing import Any
import numpy as np
import pandas as pd
from pandas.api.types import is_datetime64_any_dtype, is_numeric_dtype
class CleaningService:
    @staticmethod
    def _normalize_column_name(column: str) -> str:
        cleaned = re.sub(r"[^a-zA-Z0-9]+", "_", column.strip().lower())
        cleaned = re.sub(r"_+", "_", cleaned).strip("_")
        return cleaned or "column"
    @staticmethod
    def _mode_or_default(series: pd.Series, default: Any) -> Any:
        mode = series.mode(dropna=True)
        return mode.iloc[0] if not mode.empty else default
    def clean_dataframe(self, frame: pd.DataFrame) -> tuple[pd.DataFrame, dict[str, Any]]:
        df = frame.copy()
        summary: dict[str, Any] = {
            "renamed_columns": {},
            "duplicates_removed": 0,
            "type_conversions": [],
            "missing_values_filled": {},
            "outlier_columns_clipped": [],
            "normalized_columns": [],
        }
        renamed_columns = {
            column: self._normalize_column_name(column)
            for column in df.columns
            if self._normalize_column_name(column) != column
        }
        if renamed_columns:
            df = df.rename(columns=renamed_columns)
            summary["renamed_columns"] = renamed_columns
        duplicate_count = int(df.duplicated().sum())
        if duplicate_count:
            df = df.drop_duplicates().reset_index(drop=True)
        summary["duplicates_removed"] = duplicate_count
        for column in list(df.columns):
            series = df[column]
            if series.dtype == "object":
                df[column] = series.astype(str).str.strip().replace({"nan": None, "None": None, "": None})
                summary["normalized_columns"].append(column)
                numeric_candidate = pd.to_numeric(df[column], errors="coerce")
                numeric_ratio = float(numeric_candidate.notna().mean()) if len(df[column]) else 0.0
                if numeric_ratio >= 0.8:
                    df[column] = numeric_candidate
                    summary["type_conversions"].append(
                        {"column": column, "from": "object", "to": "numeric", "confidence": numeric_ratio}
                    )
                    continue
                datetime_candidate = pd.to_datetime(df[column], errors="coerce", utc=True)
                datetime_ratio = float(datetime_candidate.notna().mean()) if len(df[column]) else 0.0
                if datetime_ratio >= 0.8 or any(
                    keyword in column for keyword in ("date", "time", "timestamp", "created", "updated")
                ):
                    if datetime_ratio >= 0.5:
                        df[column] = datetime_candidate
                        summary["type_conversions"].append(
                            {
                                "column": column,
                                "from": "object",
                                "to": "datetime",
                                "confidence": datetime_ratio,
                            }
                        )
        for column in df.columns:
            series = df[column]
            missing_before = int(series.isna().sum())
            if not missing_before:
                continue
            if is_numeric_dtype(series):
                fill_value = float(series.median()) if not pd.isna(series.median()) else 0.0
                df[column] = series.fillna(fill_value)
            elif is_datetime64_any_dtype(series):
                df[column] = series.ffill().bfill()
            else:
                fill_value = self._mode_or_default(series, "Unknown")
                df[column] = series.fillna(fill_value)
            summary["missing_values_filled"][column] = missing_before
        numeric_columns = [
            column
            for column in df.select_dtypes(include=["number"]).columns
            if df[column].nunique(dropna=True) > 10
        ]
        for column in numeric_columns:
            q1 = df[column].quantile(0.25)
            q3 = df[column].quantile(0.75)
            iqr = q3 - q1
            if pd.isna(iqr) or iqr == 0:
                continue
            lower = q1 - 1.5 * iqr
            upper = q3 + 1.5 * iqr
            original = df[column].copy()
            df[column] = df[column].clip(lower=lower, upper=upper)
            if not np.allclose(original.fillna(0), df[column].fillna(0)):
                summary["outlier_columns_clipped"].append(column)
        return df, summary
