import asyncio
from datetime import datetime
from app.models.worker_db import WorkerDB
from app.core.logger import get_logger
from app.models.db_models import update_job_status, JobStatus
from app.services.graph_db import insert_chunk_to_graphdb

logger = get_logger()


async def insert_chunks_to_graphdb_async(
    job_id: str,
    chunk_text: str,
    file_metadata: dict,
    page_range: tuple[int, int],
    chunk_id: int,
):
    await WorkerDB.ensure_connection()
    WorkerDB.ensure_graph_db_connection()
    try:
        logger.info(
            f"Starting graph processing for job {job_id}, chunk {chunk_id}, page:{page_range}"
        )

        # Update job status to STARTED
        await update_job_status(
            job_id=job_id, status=JobStatus.STARTED, started_time=datetime.now()
        )

        # Prepare metadata for graph DB
        metadata = dict(file_metadata)
        metadata["page_range"] = page_range
        metadata["chunk_id"] = chunk_id
        metadata["job_id"] = job_id

        logger.info(f"Processing text chunk of length: {len(chunk_text)}")

        # Insert Chunk to Graph DB
        await insert_chunk_to_graphdb(chunk_text, metadata)

        logger.info(f"Successfully inserted chunk {chunk_id} to graph database")

        # Update Job Status to FINISHED
        await update_job_status(
            job_id, JobStatus.FINISHED, completed_time=datetime.now()
        )

    except Exception as e:
        logger.error(f"Error in graph processing for job {job_id}: {str(e)}")

        # Update job status to FAILED
        await update_job_status(
            job_id,
            JobStatus.FAILED,
            completed_time=datetime.now(),
            error_message=str(e),
        )
        raise e


def insert_chunks_to_graphdb(
    job_id: str,
    chunk_text: str,
    file_metadata: dict,
    page_range: tuple[int, int],
    chunk_id: int,
):
    return asyncio.run(
        insert_chunks_to_graphdb_async(
            job_id, chunk_text, file_metadata, page_range, chunk_id
        )
    )
