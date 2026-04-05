from __future__ import annotations
import re
from typing import Any
import pandas as pd
from sklearn.linear_model import LinearRegression
from app.services.ai import AIService
from app.services.profiling import ProfilingService
class ChatService:
    def __init__(self) -> None:
        self.ai_service = AIService()
        self.profiler = ProfilingService()
    def _top_dimension(
        self,
        df: pd.DataFrame,
        group_column: str,
        metric_column: str | None,
        limit: int,
    ) -> list[dict[str, Any]]:
        if metric_column and metric_column in df.columns:
            grouped = (
                df.groupby(group_column)[metric_column]
                .sum()
                .sort_values(ascending=False)
                .head(limit)
                .reset_index(name="value")
            )
        else:
            grouped = df[group_column].astype(str).value_counts().head(limit).reset_index()
            grouped.columns = [group_column, "value"]
        return grouped.to_dict(orient="records")
    def _predict_next_month_sales(self, df: pd.DataFrame, date_column: str, sales_column: str) -> dict[str, Any]:
        monthly = df[[date_column, sales_column]].dropna().copy()
        monthly["period"] = monthly[date_column].dt.to_period("M").dt.to_timestamp()
        aggregated = monthly.groupby("period")[sales_column].sum().reset_index()
        if len(aggregated) < 3:
            return {
                "answer": "Not enough monthly history is available to forecast next month reliably.",
                "query_plan": {"type": "forecast", "status": "insufficient_history"},
                "visualization_hint": {"chart": "line", "x_key": "period", "y_key": sales_column},
                "tabular_result": aggregated.assign(period=aggregated["period"].astype(str)).to_dict(orient="records"),
            }
        aggregated["index"] = range(len(aggregated))
        model = LinearRegression().fit(aggregated[["index"]], aggregated[sales_column])
        next_index = len(aggregated)
        predicted = float(model.predict([[next_index]])[0])
        next_period = (aggregated["period"].max() + pd.offsets.MonthBegin(1)).strftime("%Y-%m-%d")
        table = aggregated.assign(period=aggregated["period"].astype(str)).to_dict(orient="records")
        table.append({"period": next_period, sales_column: round(predicted, 2)})
        return {
            "answer": f"Projected sales for {next_period} are approximately {predicted:.2f}.",
            "query_plan": {"type": "forecast", "model": "linear_regression", "metric": sales_column},
            "visualization_hint": {"chart": "line", "x_key": "period", "y_key": sales_column},
            "tabular_result": table,
        }
    def deterministic_answer(self, df: pd.DataFrame, question: str) -> dict[str, Any]:
        semantics = self.profiler.infer_semantics(df)
        lowered = question.lower()
        metric_column = semantics.get("sales_column") or semantics.get("quantity_column")
        top_n_match = re.search(r"top\s+(\d+)", lowered)
        limit = int(top_n_match.group(1)) if top_n_match else 5
        if "country" in lowered and semantics.get("country_column"):
            result = self._top_dimension(df, semantics["country_column"], metric_column, limit)
            return {
                "answer": f"Here are the top {limit} countries based on {metric_column or 'record count'}.",
                "query_plan": {
                    "type": "group_by",
                    "dimension": semantics["country_column"],
                    "metric": metric_column or "count",
                    "limit": limit,
                },
                "visualization_hint": {"chart": "bar", "x_key": semantics["country_column"], "y_key": "value"},
                "tabular_result": result,
            }
        if ("best product" in lowered or "top product" in lowered or "product is best" in lowered) and (
            semantics.get("product_column") or semantics.get("product_line_column")
        ):
            product_column = semantics.get("product_column") or semantics.get("product_line_column")
            result = self._top_dimension(df, product_column, metric_column, limit)
            best = result[0][product_column] if result else "Unknown"
            return {
                "answer": f"{best} is currently the best-performing product grouping.",
                "query_plan": {
                    "type": "group_by",
                    "dimension": product_column,
                    "metric": metric_column or "count",
                    "limit": limit,
                },
                "visualization_hint": {"chart": "bar", "x_key": product_column, "y_key": "value"},
                "tabular_result": result,
            }
        if "predict" in lowered and "sales" in lowered and semantics.get("date_column") and semantics.get("sales_column"):
            return self._predict_next_month_sales(df, semantics["date_column"], semantics["sales_column"])
        sample = self.profiler.build_dashboard(df)
        return {
            "answer": "I can answer ranking, trend, and forecasting questions from this dataset. Try asking for the top countries, best products, or next-month sales.",
            "query_plan": {"type": "fallback"},
            "visualization_hint": {"chart": "table"},
            "tabular_result": sample["sample_rows"],
        }
    async def answer(self, df: pd.DataFrame, question: str, dataset_context: dict[str, Any]) -> dict[str, Any]:
        deterministic = self.deterministic_answer(df, question)
        return await self.ai_service.answer_question(question, dataset_context, deterministic)
