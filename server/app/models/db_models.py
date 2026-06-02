import asyncio
import os
from beanie import Document, init_beanie, PydanticObjectId
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
from pydantic import Field
from enum import Enum
from typing import Any

# Global client for connection reuse
_client = None
_db_initialized = False


async def init_db():
    global _client, _db_initialized
    if not _db_initialized:
        db_uri = os.getenv("DATABASE_URI")
        if not db_uri:
            raise Exception("No DATABASE_URI environment variables found")

        _client = AsyncIOMotorClient(
            db_uri,
            maxPoolSize=20,
            minPoolSize=2,
            maxIdleTimeMS=30000,
            serverSelectionTimeoutMS=5000,
        )
        await init_beanie(database=_client["rag_db"], document_models=[QueueJob])
        _db_initialized = True
        print("DB Initialised")
    return _client


class JobStatus(str, Enum):
    QUEUED = "queued"
    STARTED = "started"
    FINISHED = "finished"
    FAILED = "failed"
    RETRYING = "retrying"


class QueueJob(Document):
    user_id: str
    status: JobStatus
    action: str  # Eg: "pdf_markdown"/"vectorDB"/"graphDB"
    parent_job_id: str | None = None
    child_job_ids: list[str] = Field(default_factory=list)
    enqueued_at: datetime = Field(default_factory=datetime.now)
    started_at: datetime | None = None
    completed_at: datetime | None = None
    # Error Handling
    error_message: str | None = None
    # Arguments
    file_id: str
    file_metadata: dict[str, Any]
    page_range: tuple[int, int] | None = None
    chunk_id: int | None = None


async def update_job_status(
    job_id: str,
    status: JobStatus,
    started_time: datetime | None = None,
    completed_time: datetime | None = None,
    error_message: str | None = None,
):
    job = await QueueJob.get(PydanticObjectId(job_id))
    if not job:
        raise Exception(f"Job with id{job_id} not found")

    job.status = status
    if started_time:
        job.started_at = started_time
    if completed_time:
        job.completed_at = completed_time
    if error_message:
        job.error_message = error_message

    await job.save()
    return job
