from __future__ import annotations
import json
import logging
from typing import Any
from openai import AsyncOpenAI
from app.core.config import settings
logger = logging.getLogger(__name__)
def _extract_json_blob(text: str) -> str:
    starts = [position for position in (text.find("["), text.find("{")) if position != -1]
    if not starts:
        return text
    start = min(starts)
    end = max(text.rfind("]"), text.rfind("}"))
    return text[start : end + 1] if end > start else text
class AIService:
    def __init__(self) -> None:
        self.client = (
            AsyncOpenAI(api_key=settings.openai_api_key, timeout=45.0, max_retries=2)
            if settings.openai_api_key
            else None
        )
    async def generate_insights(
        self,
        dataset_name: str,
        profile: dict[str, Any],
        heuristic_insights: list[dict[str, Any]],
    ) -> list[dict[str, Any]]:
        if not self.client:
            return heuristic_insights
        payload = {
            "dataset_name": dataset_name,
            "profile": profile,
            "heuristic_insights": heuristic_insights,
        }
        try:
            response = await self.client.responses.create(
                model=settings.openai_model,
                instructions=(
                    "You are a senior business intelligence analyst. "
                    "Return only JSON: an array of 3 to 5 insight objects. "
                    "Each object must include title, detail, business_action, and confidence."
                ),
                input=json.dumps(payload, default=str),
            )
            parsed = json.loads(_extract_json_blob(response.output_text))
            if isinstance(parsed, list):
                return parsed
        except Exception as exc:
            logger.warning("OpenAI insight generation failed: %s", exc)
        return heuristic_insights
    async def answer_question(
        self,
        question: str,
        context: dict[str, Any],
        deterministic_answer: dict[str, Any],
    ) -> dict[str, Any]:
        if not self.client:
            return deterministic_answer
        payload = {
            "question": question,
            "dataset_context": context,
            "deterministic_result": deterministic_answer,
        }
        try:
            response = await self.client.responses.create(
                model=settings.openai_model,
                instructions=(
                    "You are an analytics copilot. Return only JSON with keys "
                    "answer, query_plan, visualization_hint, tabular_result. "
                    "Use the deterministic result if present and never invent metrics."
                ),
                input=json.dumps(payload, default=str),
            )
            parsed = json.loads(_extract_json_blob(response.output_text))
            if isinstance(parsed, dict):
                return {
                    "answer": parsed.get("answer", deterministic_answer["answer"]),
                    "query_plan": parsed.get("query_plan", deterministic_answer.get("query_plan", {})),
                    "visualization_hint": parsed.get(
                        "visualization_hint",
                        deterministic_answer.get("visualization_hint"),
                    ),
                    "tabular_result": parsed.get(
                        "tabular_result",
                        deterministic_answer.get("tabular_result"),
                    ),
                }
        except Exception as exc:
            logger.warning("OpenAI chat generation failed: %s", exc)
        return deterministic_answer
