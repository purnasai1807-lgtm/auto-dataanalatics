from __future__ import annotations
import io
from typing import Any
import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import (
    GradientBoostingClassifier,
    GradientBoostingRegressor,
    RandomForestClassifier,
    RandomForestRegressor,
)
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    f1_score,
    mean_absolute_error,
    mean_squared_error,
    precision_score,
    r2_score,
    recall_score,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import LabelEncoder, OneHotEncoder, StandardScaler
try:
    from xgboost import XGBClassifier, XGBRegressor
    XGBOOST_AVAILABLE = True
except ModuleNotFoundError:
    XGBClassifier = None
    XGBRegressor = None
    XGBOOST_AVAILABLE = False
from app.services.profiling import make_json_safe
class MLService:
    max_training_rows = 100_000
    def infer_target_column(self, df: pd.DataFrame, candidates: list[str] | None = None) -> str:
        if candidates:
            for candidate in candidates:
                if candidate in df.columns:
                    return candidate
        preferred = ["target", "label", "class", "sales", "revenue", "status", "profit"]
        lower_map = {column.lower(): column for column in df.columns}
        for preferred_name in preferred:
            for lowered, original in lower_map.items():
                if preferred_name in lowered:
                    return original
        return df.columns[-1]
    def infer_problem_type(self, target: pd.Series) -> str:
        threshold = min(20, max(5, int(len(target) * 0.1)))
        if pd.api.types.is_numeric_dtype(target) and target.nunique(dropna=True) > threshold:
            return "regression"
        return "classification"
    def _expand_datetime_columns(self, df: pd.DataFrame) -> pd.DataFrame:
        expanded = df.copy()
        for column in list(expanded.columns):
            if pd.api.types.is_datetime64_any_dtype(expanded[column]):
                expanded[f"{column}_year"] = expanded[column].dt.year
                expanded[f"{column}_month"] = expanded[column].dt.month
                expanded[f"{column}_day"] = expanded[column].dt.day
                expanded[f"{column}_dayofweek"] = expanded[column].dt.dayofweek
                expanded = expanded.drop(columns=[column])
        return expanded
    def _prepare_frame(self, df: pd.DataFrame, target_column: str) -> tuple[pd.DataFrame, pd.Series, dict[str, Any]]:
        frame = df.copy().dropna(subset=[target_column])
        if len(frame) > self.max_training_rows:
            frame = frame.sample(self.max_training_rows, random_state=42)
        frame = self._expand_datetime_columns(frame)
        high_cardinality = [
            column
            for column in frame.select_dtypes(include=["object"]).columns
            if frame[column].nunique(dropna=True) > min(200, len(frame) * 0.3)
        ]
        if high_cardinality:
            frame = frame.drop(columns=high_cardinality)
        y = frame[target_column]
        X = frame.drop(columns=[target_column])
        X = X.loc[:, X.nunique(dropna=False) > 1]
        metadata = {
            "sampled_rows": int(len(frame)),
            "feature_count": int(X.shape[1]),
            "dropped_high_cardinality_columns": high_cardinality,
        }
        return X, y, metadata
    def _build_preprocessor(self, X: pd.DataFrame) -> ColumnTransformer:
        numeric_features = list(X.select_dtypes(include=["number"]).columns)
        categorical_features = list(X.select_dtypes(exclude=["number"]).columns)
        numeric_transformer = Pipeline(
            steps=[
                ("imputer", SimpleImputer(strategy="median")),
                ("scaler", StandardScaler()),
            ]
        )
        categorical_transformer = Pipeline(
            steps=[
                ("imputer", SimpleImputer(strategy="most_frequent")),
                ("onehot", OneHotEncoder(handle_unknown="ignore")),
            ]
        )
        return ColumnTransformer(
            transformers=[
                ("num", numeric_transformer, numeric_features),
                ("cat", categorical_transformer, categorical_features),
            ]
        )
    def _build_models(self, problem_type: str, class_count: int) -> dict[str, Any]:
        if problem_type == "regression":
            models: dict[str, Any] = {
                "linear_regression": LinearRegression(),
                "random_forest": RandomForestRegressor(
                    n_estimators=220,
                    max_depth=14,
                    random_state=42,
                    n_jobs=-1,
                ),
            }
            if XGBOOST_AVAILABLE and XGBRegressor is not None:
                models["xgboost"] = XGBRegressor(
                    n_estimators=250,
                    max_depth=6,
                    learning_rate=0.05,
                    subsample=0.9,
                    colsample_bytree=0.9,
                    random_state=42,
                    tree_method="hist",
                )
            else:
                models["gradient_boosting"] = GradientBoostingRegressor(random_state=42)
            return models
        objective = "binary:logistic" if class_count <= 2 else "multi:softprob"
        xgb_params: dict[str, Any] = {
            "n_estimators": 250,
            "max_depth": 6,
            "learning_rate": 0.05,
            "subsample": 0.9,
            "colsample_bytree": 0.9,
            "random_state": 42,
            "tree_method": "hist",
            "objective": objective,
            "eval_metric": "logloss" if class_count <= 2 else "mlogloss",
        }
        if class_count > 2:
            xgb_params["num_class"] = class_count
        models = {
            "logistic_regression": LogisticRegression(max_iter=1000),
            "random_forest": RandomForestClassifier(
                n_estimators=220,
                max_depth=12,
                random_state=42,
                n_jobs=-1,
            ),
        }
        if XGBOOST_AVAILABLE and XGBClassifier is not None:
            models["xgboost"] = XGBClassifier(**xgb_params)
        else:
            models["gradient_boosting"] = GradientBoostingClassifier(random_state=42)
        return models
    def _evaluate(self, problem_type: str, y_true: pd.Series, y_pred: np.ndarray) -> dict[str, Any]:
        if problem_type == "regression":
            rmse = float(np.sqrt(mean_squared_error(y_true, y_pred)))
            return {
                "rmse": round(rmse, 4),
                "mae": round(float(mean_absolute_error(y_true, y_pred)), 4),
                "r2": round(float(r2_score(y_true, y_pred)), 4),
            }
        return {
            "accuracy": round(float(accuracy_score(y_true, y_pred)), 4),
            "precision": round(float(precision_score(y_true, y_pred, average="weighted", zero_division=0)), 4),
            "recall": round(float(recall_score(y_true, y_pred, average="weighted", zero_division=0)), 4),
            "f1": round(float(f1_score(y_true, y_pred, average="weighted", zero_division=0)), 4),
        }
    def _comparison_score(self, problem_type: str, metrics: dict[str, Any]) -> float:
        return float(metrics["r2"]) if problem_type == "regression" else float(metrics["accuracy"])
    def _extract_feature_importance(self, pipeline: Pipeline) -> list[dict[str, Any]]:
        preprocessor = pipeline.named_steps["preprocessor"]
        model = pipeline.named_steps["model"]
        feature_names = preprocessor.get_feature_names_out()
        importances = None
        if hasattr(model, "feature_importances_"):
            importances = model.feature_importances_
        elif hasattr(model, "coef_"):
            coef = np.array(model.coef_)
            importances = np.abs(coef[0] if coef.ndim > 1 else coef)
        if importances is None:
            return []
        ranked = sorted(
            zip(feature_names, importances, strict=False),
            key=lambda item: item[1],
            reverse=True,
        )[:15]
        return [{"feature": name, "importance": round(float(score), 6)} for name, score in ranked]
    def train(self, df: pd.DataFrame, target_column: str | None = None, problem_type: str | None = None) -> dict[str, Any]:
        target = target_column or self.infer_target_column(df)
        inferred_problem_type = problem_type or self.infer_problem_type(df[target])
        X, y, metadata = self._prepare_frame(df, target)
        if X.empty:
            raise ValueError("Not enough usable features available for model training.")
        preprocessor = self._build_preprocessor(X)
        label_encoder: LabelEncoder | None = None
        if inferred_problem_type == "classification":
            label_encoder = LabelEncoder()
            y = pd.Series(label_encoder.fit_transform(y.astype(str)), index=y.index)
            metadata["class_labels"] = label_encoder.classes_.tolist()
        class_count = int(y.nunique(dropna=True))
        models = self._build_models(inferred_problem_type, class_count)
        stratify = y if inferred_problem_type == "classification" and class_count > 1 else None
        X_train, X_test, y_train, y_test = train_test_split(
            X,
            y,
            test_size=0.2,
            random_state=42,
            stratify=stratify,
        )
        comparison: list[dict[str, Any]] = []
        best_pipeline: Pipeline | None = None
        best_metrics: dict[str, Any] = {}
        best_model_name = ""
        best_score = -float("inf")
        for model_name, model in models.items():
            pipeline = Pipeline(
                steps=[
                    ("preprocessor", preprocessor),
                    ("model", model),
                ]
            )
            pipeline.fit(X_train, y_train)
            predictions = pipeline.predict(X_test)
            metrics = self._evaluate(inferred_problem_type, y_test, predictions)
            comparison.append({"model": model_name, **metrics})
            score = self._comparison_score(inferred_problem_type, metrics)
            if score > best_score:
                best_score = score
                best_pipeline = pipeline
                best_metrics = metrics
                best_model_name = model_name
        assert best_pipeline is not None
        final_predictions = best_pipeline.predict(X_test)
        actual_output = y_test
        predicted_output = pd.Series(final_predictions)
        if inferred_problem_type == "classification" and label_encoder is not None:
            actual_output = pd.Series(label_encoder.inverse_transform(y_test.astype(int)))
            predicted_output = pd.Series(label_encoder.inverse_transform(predicted_output.astype(int)))
        predictions_df = pd.DataFrame(
            {
                "actual": actual_output.reset_index(drop=True),
                "predicted": predicted_output.reset_index(drop=True),
            }
        )
        buffer = io.BytesIO()
        joblib.dump(best_pipeline, buffer)
        return {
            "target_column": target,
            "problem_type": inferred_problem_type,
            "best_model": best_model_name,
            "metrics": make_json_safe(best_metrics),
            "comparison": make_json_safe(comparison),
            "feature_importance": make_json_safe(self._extract_feature_importance(best_pipeline)),
            "predictions_df": predictions_df,
            "model_bytes": buffer.getvalue(),
            "metadata": make_json_safe(metadata),
        }
