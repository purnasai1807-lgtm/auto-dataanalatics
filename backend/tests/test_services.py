import pandas as pd
from app.services.cleaning import CleaningService
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
