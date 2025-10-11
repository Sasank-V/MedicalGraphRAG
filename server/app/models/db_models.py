import asyncio
from beanie import Document, init_beanie
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
from pydantic import Field
from enum import Enum


class JobStatus(str, Enum):
    QUEUED = "queued"
    STARTED = "started"
    FINISHED = "finished"
    FAILED = "failed"
    RETRYING = "retrying"


class QueueJob(Document):
    parent_id: str
    user_id: str
    status: JobStatus
    actions: list[str]
    enqueued_at: datetime = Field(default_factory=datetime.now())
    started_at: datetime | None = None
    completed_at: datetime | None = None
    file_id: str
    page_range: tuple[int, int] | None = None
    chunk_id: int | None = None
