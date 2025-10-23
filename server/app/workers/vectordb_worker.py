import asyncio
from datetime import datetime
from services.vector_db import insert_text_chunk
from models.db_models import update_job_status, JobStatus
from models.worker_db import WorkerDB
from core.logger import get_logger

logger = get_logger()


async def insert_chunks_to_vectordb_async(
    job_id: str,
    chunk_text: str,
    file_metadata: dict[str, any],
    page_range: tuple[int, int],
    chunk_id: int,
):
    await WorkerDB.ensure_connection()
    WorkerDB.ensure_vector_db_connection()
    try:
        logger.info(f"Inserting Chunks in Range: {page_range}")

        # Update job status to STARTED
        await update_job_status(job_id, JobStatus.STARTED, started_time=datetime.now())

        # Update Metadata
        metadata = dict(file_metadata)
        metadata["page_range"] = page_range
        metadata["chunk_id"] = chunk_id

        # Insert Chunks to VectorDB
        start_time = datetime.now()
        insert_text_chunk(chunk_text, metadata)
        completed_time = datetime.now()

        logger.info(f"Embedded chunk {chunk_id} from pages {page_range}")

        # Update Job Status to FINISHED
        await update_job_status(
            job_id,
            status=JobStatus.FINISHED,
            started_time=start_time,
            completed_time=completed_time,
        )

    except Exception as e:
        logger.error(f"Error is vectorDB worker: {e}")
        await update_job_status(
            job_id,
            JobStatus.FAILED,
            completed_time=completed_time,
            started_time=start_time,
            error_message=str(e),
        )
        raise e


def insert_chunks_to_vectordb(
    job_id: str,
    chunk_text: str,
    file_metadata: dict[str, any],
    page_range: tuple[int, int],
    chunk_id: int,
):
    return asyncio.run(
        insert_chunks_to_vectordb_async(
            job_id,
            chunk_text,
            file_metadata,
            page_range,
            chunk_id,
        )
    )
