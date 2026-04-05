from __future__ import annotations
from datetime import datetime
from typing import Any
import numpy as np
import pandas as pd
from pandas.api.types import is_datetime64_any_dtype, is_numeric_dtype
def make_json_safe(value: Any) -> Any:
    if isinstance(value, dict):
        return {str(key): make_json_safe(inner) for key, inner in value.items()}
    if isinstance(value, list):
        return [make_json_safe(item) for item in value]
    if isinstance(value, tuple):
        return [make_json_safe(item) for item in value]
    if isinstance(value, (np.integer,)):
        return int(value)
    if isinstance(value, (np.floating,)):
        return round(float(value), 6)
    if isinstance(value, (pd.Timestamp, datetime)):
        return value.isoformat()
    if isinstance(value, np.ndarray):
        return [make_json_safe(item) for item in value.tolist()]
    if not isinstance(value, (list, dict, tuple)) and pd.isna(value):
        return None
    return value
class ProfilingService:
    semantic_keywords = {
        "date_column": ["date", "time", "timestamp", "created", "ordered", "day"],
        "sales_column": ["sales", "revenue", "amount", "gmv", "income", "price", "total"],
        "quantity_column": ["quantity", "qty", "units", "volume"],
        "country_column": ["country", "nation", "market", "geo"],
        "category_column": ["category", "segment", "department"],
        "product_line_column": ["product_line", "productline", "brand", "line"],
        "product_column": ["product", "sku", "item", "name"],
        "status_column": ["status", "state", "stage"],
        "target_column": ["target", "label", "class", "sales", "revenue", "churn", "status"],
    }
    def infer_semantics(self, df: pd.DataFrame) -> dict[str, Any]:
        semantics: dict[str, Any] = {
            "date_column": None,
            "sales_column": None,
            "quantity_column": None,
            "country_column": None,
            "category_column": None,
            "product_line_column": None,
            "product_column": None,
            "status_column": None,
            "target_candidates": [],
            "numeric_columns": list(df.select_dtypes(include=["number"]).columns),
            "categorical_columns": list(df.select_dtypes(exclude=["number", "datetime64[ns, UTC]"]).columns),
            "datetime_columns": list(df.select_dtypes(include=["datetime64[ns, UTC]", "datetime64[ns]"]).columns),
        }
        columns_lower = {column.lower(): column for column in df.columns}
        for semantic_key, keywords in self.semantic_keywords.items():
            if semantic_key == "target_column":
                continue
            matched = next(
                (
                    original
                    for lowered, original in columns_lower.items()
                    if any(keyword in lowered for keyword in keywords)
                ),
                None,
            )
            semantics[semantic_key] = matched
        if not semantics["date_column"]:
            semantics["date_column"] = next(
                (column for column in df.columns if is_datetime64_any_dtype(df[column])),
                None,
            )
        if not semantics["sales_column"]:
            semantics["sales_column"] = next(
                (
                    column
                    for column in semantics["numeric_columns"]
                    if column not in {semantics["quantity_column"]}
                ),
                None,
            )
        if not semantics["quantity_column"]:
            semantics["quantity_column"] = next(
                (column for column in semantics["numeric_columns"] if "qty" in column or "quantity" in column),
                None,
            )
        target_candidates: list[str] = []
        for lowered, original in columns_lower.items():
            if any(keyword in lowered for keyword in self.semantic_keywords["target_column"]):
                target_candidates.append(original)
        if semantics["sales_column"] and semantics["sales_column"] not in target_candidates:
            target_candidates.append(semantics["sales_column"])
        if semantics["status_column"] and semantics["status_column"] not in target_candidates:
            target_candidates.append(semantics["status_column"])
        if df.columns[-1] not in target_candidates:
            target_candidates.append(df.columns[-1])
        semantics["target_candidates"] = target_candidates[:5]
        semantics["dimension_columns"] = [
            column
            for column in [
                semantics["country_column"],
                semantics["category_column"],
                semantics["product_line_column"],
                semantics["product_column"],
                semantics["status_column"],
            ]
            if column
        ]
        return semantics
    def build_schema(self, df: pd.DataFrame) -> dict[str, Any]:
        schema = []
        for column in df.columns:
            series = df[column]
            entry: dict[str, Any] = {
                "name": column,
                "dtype": str(series.dtype),
                "missing_pct": round(float(series.isna().mean() * 100), 2),
                "unique_values": int(series.nunique(dropna=True)),
            }
            if is_numeric_dtype(series):
                entry.update(
                    {
                        "mean": round(float(series.mean()), 4) if len(series) else None,
                        "min": round(float(series.min()), 4) if len(series) else None,
                        "max": round(float(series.max()), 4) if len(series) else None,
                    }
                )
            elif is_datetime64_any_dtype(series):
                entry["min"] = make_json_safe(series.min())
                entry["max"] = make_json_safe(series.max())
            else:
                entry["top_values"] = [
                    make_json_safe(value)
                    for value in series.dropna().astype(str).value_counts().head(5).index
                ]
            schema.append(entry)
        return {"columns": schema}
    def dataframe_records(self, df: pd.DataFrame, limit: int = 10) -> list[dict[str, Any]]:
        sample = df.head(limit).copy()
        for column in sample.columns:
            if is_datetime64_any_dtype(sample[column]):
                sample[column] = sample[column].dt.strftime("%Y-%m-%d %H:%M:%S")
        return make_json_safe(sample.to_dict(orient="records"))
    def apply_filters(
        self,
        df: pd.DataFrame,
        semantics: dict[str, Any],
        filters: dict[str, Any] | None,
    ) -> pd.DataFrame:
        if not filters:
            return df
        filtered = df.copy()
        date_column = semantics.get("date_column")
        if date_column and filters.get("date_from"):
            filtered = filtered[filtered[date_column] >= pd.to_datetime(filters["date_from"], utc=True)]
        if date_column and filters.get("date_to"):
            filtered = filtered[filtered[date_column] <= pd.to_datetime(filters["date_to"], utc=True)]
        for field in ("country_column", "category_column", "product_line_column"):
            column = semantics.get(field)
            alias = field.replace("_column", "")
            value = filters.get(alias)
            if column and value:
                filtered = filtered[filtered[column].astype(str) == str(value)]
        return filtered
    def build_filter_options(self, df: pd.DataFrame, semantics: dict[str, Any]) -> dict[str, Any]:
        options: dict[str, Any] = {}
        for field in ("country_column", "category_column", "product_line_column"):
            column = semantics.get(field)
            if column and column in df.columns:
                values = df[column].dropna().astype(str).value_counts().head(50).index.tolist()
                options[field.replace("_column", "")] = values
        date_column = semantics.get("date_column")
        if date_column and date_column in df.columns and not df[date_column].dropna().empty:
            options["date_range"] = {
                "min": make_json_safe(df[date_column].min()),
                "max": make_json_safe(df[date_column].max()),
            }
        return options
    def build_time_series(self, df: pd.DataFrame, semantics: dict[str, Any]) -> dict[str, Any]:
        date_column = semantics.get("date_column")
        metric_column = semantics.get("sales_column") or semantics.get("quantity_column")
        if not date_column or date_column not in df.columns:
            return {"data": [], "x_key": "period", "y_key": "value"}
        series_df = df[[date_column] + ([metric_column] if metric_column else [])].copy().dropna(subset=[date_column])
        if series_df.empty:
            return {"data": [], "x_key": "period", "y_key": "value"}
        period = "M" if series_df[date_column].nunique() > 31 else "D"
        date_series = series_df[date_column]
        if getattr(date_series.dt, "tz", None) is not None:
            date_series = date_series.dt.tz_localize(None)
        series_df["period"] = date_series.dt.to_period(period).dt.to_timestamp()
        if metric_column:
            grouped = series_df.groupby("period")[metric_column].sum().reset_index(name="value")
        else:
            grouped = series_df.groupby("period").size().reset_index(name="value")
        grouped["period"] = grouped["period"].dt.strftime("%Y-%m-%d")
        return {
            "data": make_json_safe(grouped.to_dict(orient="records")),
            "x_key": "period",
            "y_key": "value",
            "metric": metric_column or "count",
        }
    def build_grouped_chart(
        self,
        df: pd.DataFrame,
        group_column: str | None,
        metric_column: str | None,
        label_key: str,
    ) -> dict[str, Any]:
        if not group_column or group_column not in df.columns:
            return {"data": [], "label_key": label_key, "value_key": "value"}
        grouped = df.dropna(subset=[group_column]).copy()
        if grouped.empty:
            return {"data": [], "label_key": label_key, "value_key": "value"}
        if metric_column and metric_column in grouped.columns:
            result = (
                grouped.groupby(group_column)[metric_column]
                .sum()
                .sort_values(ascending=False)
                .head(10)
                .reset_index(name="value")
            )
            result = result.rename(columns={group_column: label_key})
        else:
            result = grouped[group_column].astype(str).value_counts().head(10).reset_index()
            result.columns = [label_key, "value"]
        return {
            "data": make_json_safe(result.to_dict(orient="records")),
            "label_key": label_key,
            "value_key": "value",
        }
    def build_heatmap(self, df: pd.DataFrame) -> dict[str, Any]:
        numeric = df.select_dtypes(include=["number"]).copy()
        if numeric.shape[1] < 2:
            return {"x": [], "y": [], "z": []}
        numeric = numeric.iloc[:, :8]
        corr = numeric.corr(numeric_only=True).round(3)
        return {
            "x": corr.columns.tolist(),
            "y": corr.index.tolist(),
            "z": make_json_safe(corr.values.tolist()),
        }
    def build_kpis(self, df: pd.DataFrame, semantics: dict[str, Any]) -> dict[str, Any]:
        sales_column = semantics.get("sales_column")
        quantity_column = semantics.get("quantity_column")
        total_sales = round(float(df[sales_column].sum()), 2) if sales_column and sales_column in df.columns else None
        orders = int(len(df))
        avg_order_value = round(total_sales / orders, 2) if total_sales is not None and orders else None
        quantity = (
            round(float(df[quantity_column].sum()), 2)
            if quantity_column and quantity_column in df.columns
            else None
        )
        return {
            "total_sales": total_sales,
            "orders": orders,
            "avg_order_value": avg_order_value,
            "quantity": quantity,
        }
    def build_trend(self, df: pd.DataFrame, semantics: dict[str, Any]) -> dict[str, Any]:
        series = self.build_time_series(df, semantics).get("data", [])
        if len(series) < 2:
            return {"direction": "flat", "delta_pct": 0, "message": "Not enough time-series data"}
        last = series[-1]["value"]
        previous = series[-2]["value"]
        if not previous:
            return {"direction": "up", "delta_pct": None, "message": "New activity detected in latest period"}
        delta_pct = round(((last - previous) / previous) * 100, 2)
        direction = "up" if delta_pct > 0 else "down" if delta_pct < 0 else "flat"
        return {
            "direction": direction,
            "delta_pct": delta_pct,
            "message": f"{direction.title()} trend of {abs(delta_pct)}% versus the previous period",
        }
    def heuristic_insights(self, df: pd.DataFrame, semantics: dict[str, Any], kpis: dict[str, Any]) -> list[dict[str, Any]]:
        insights: list[dict[str, Any]] = []
        sales_column = semantics.get("sales_column")
        country_column = semantics.get("country_column")
        product_column = semantics.get("product_column") or semantics.get("product_line_column")
        trend = self.build_trend(df, semantics)
        if sales_column and country_column and country_column in df.columns:
            top_country = df.groupby(country_column)[sales_column].sum().sort_values(ascending=False).head(1)
            if not top_country.empty:
                insights.append(
                    {
                        "title": "Top market",
                        "detail": f"{top_country.index[0]} is the leading revenue contributor at {float(top_country.iloc[0]):.2f}.",
                        "severity": "positive",
                    }
                )
        if sales_column and product_column and product_column in df.columns:
            top_product = df.groupby(product_column)[sales_column].sum().sort_values(ascending=False).head(1)
            if not top_product.empty:
                insights.append(
                    {
                        "title": "Best performer",
                        "detail": f"{top_product.index[0]} is currently the strongest product segment by sales.",
                        "severity": "positive",
                    }
                )
        if trend.get("delta_pct") is not None:
            insights.append(
                {
                    "title": "Trend detection",
                    "detail": trend["message"],
                    "severity": "positive" if trend["direction"] == "up" else "warning",
                }
            )
        if kpis.get("avg_order_value") is not None:
            insights.append(
                {
                    "title": "Order economics",
                    "detail": f"Average order value is {kpis['avg_order_value']}.",
                    "severity": "neutral",
                }
            )
        return insights[:6]
    def build_dashboard(self, df: pd.DataFrame, filters: dict[str, Any] | None = None) -> dict[str, Any]:
        semantics = self.infer_semantics(df)
        filtered = self.apply_filters(df, semantics, filters)
        kpis = self.build_kpis(filtered, semantics)
        category_key = semantics.get("category_column") or semantics.get("product_line_column")
        charts = {
            "time_series": self.build_time_series(filtered, semantics),
            "category_bar": self.build_grouped_chart(filtered, category_key, semantics.get("sales_column"), "label"),
            "status_pie": self.build_grouped_chart(filtered, semantics.get("status_column"), None, "label"),
            "country_bar": self.build_grouped_chart(
                filtered,
                semantics.get("country_column"),
                semantics.get("sales_column"),
                "label",
            ),
            "heatmap": self.build_heatmap(filtered),
            "trend": self.build_trend(filtered, semantics),
        }
        return {
            "filters": make_json_safe(filters or {}),
            "semantics": make_json_safe(semantics),
            "kpis": make_json_safe(kpis),
            "charts": make_json_safe(charts),
            "filter_options": make_json_safe(self.build_filter_options(df, semantics)),
            "insights": make_json_safe(self.heuristic_insights(filtered, semantics, kpis)),
            "sample_rows": self.dataframe_records(filtered, limit=10),
        }
    def build_profile(self, df: pd.DataFrame, cleaning_summary: dict[str, Any]) -> dict[str, Any]:
        dashboard = self.build_dashboard(df)
        return {
            "schema": self.build_schema(df),
            "cleaning_summary": make_json_safe(cleaning_summary),
            "semantics": dashboard["semantics"],
            "filter_options": dashboard["filter_options"],
            "default_dashboard": {
                "kpis": dashboard["kpis"],
                "charts": dashboard["charts"],
                "insights": dashboard["insights"],
            },
            "row_count": int(len(df)),
            "column_count": int(df.shape[1]),
        }
