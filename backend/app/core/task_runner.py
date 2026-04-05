from __future__ import annotations
import logging
from collections.abc import Callable
from fastapi import BackgroundTasks
from app.core.config import settings
logger = logging.getLogger(__name__)
def run_task_callable(task: Callable, *args) -> None:
    runner = getattr(task, "run", task)
    try:
        runner(*args)
    except Exception:
        logger.exception("Background task execution failed for %s", getattr(task, "name", repr(task)))
def dispatch_task(background_tasks: BackgroundTasks, task: Callable, *args) -> str:
    if settings.use_celery:
        task.delay(*args)
        return "celery"
    background_tasks.add_task(run_task_callable, task, *args)
    return "inline"
