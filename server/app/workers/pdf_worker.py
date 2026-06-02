import fitz
import asyncio
from datetime import datetime
from app.services.data_processing import (
    get_file_bytes_stream,
    get_page_batches,
    get_batch_stream,
)
from app.core.logger import get_logger
from app.models.worker_db import WorkerDB
from app.models.db_models import update_job_status, QueueJob, JobStatus
from app.workers.queue import markdown_queue
from app.workers.markdown_worker import extract_markdown_and_embed


logger = get_logger()


# PDF Job Worker
async def pdf_download_and_batch_async(
    job_id: str,
    user_id: str,
    file_id: str,
    file_url: str,
    file_metadata: dict,
    batch_size: int = 2,
):
    await WorkerDB.ensure_connection()
    try:
        logger.info(f"Starting PDF Processing for Job: {job_id}")

        # Update Job Status to STARTED
        await update_job_status(job_id, JobStatus.STARTED, started_time=datetime.now())

        # Get File Bytes Stream
        file_stream = get_file_bytes_stream(file_url)
        if not file_stream:
            raise Exception("Failed to get File byte stream")
        logger.info("Got file stream")

        # Get total pages
        file_stream.seek(0)
        with fitz.open(stream=file_stream, filetype="pdf") as doc:
            total_pages = doc.page_count
        logger.info(f"Total pages detected: {total_pages}")

        child_job_ids = []

        # Process PDF in batches
        for page_range in get_page_batches(total_pages, batch_size):
            logger.info(f"Processing batch: pages {page_range}")

            batch_stream = get_batch_stream(file_stream, page_range)

            markdown_job = QueueJob(
                user_id=user_id,
                status=JobStatus.QUEUED,
                action="markdown_converion_and_embed",
                parent_job_id=job_id,
                file_id=file_id,
                file_metadata=file_metadata,
                page_range=page_range,
            )
            await markdown_job.insert()
            child_job_ids.append(markdown_job.id)

            # Enqueue markdown job with batch stream
            markdown_queue.enqueue(
                extract_markdown_and_embed,
                job_id=str(markdown_job.id),
                file_stream=batch_stream,
                page_range=page_range,
                file_metadata=file_metadata,
                job_timeout=600,
            )
            logger.info(f"Enqueued markdown job for pages {page_range}")
        # Update Parent Job with the child IDs
        parent_job = await QueueJob.get(job_id)
        parent_job.child_job_ids = child_job_ids
        await parent_job.save()

        # Update Job Status to FINISHED
        await update_job_status(
            job_id, JobStatus.FINISHED, completed_time=datetime.now()
        )

        logger.info(
            f"PDF processing completed. Created {len(child_job_ids)} child jobs"
        )

    except Exception as e:
        logger.error(f"Error in PDF worker for job {job_id}: {e}")
        await update_job_status(
            job_id,
            JobStatus.FAILED,
            completed_time=datetime.now(),
            error_message=str(e),
        )
        raise e


# Sync wrapper for RQ compatibility
def pdf_download_and_batch(
    job_id: str,
    user_id: str,
    file_id: str,
    file_url: str,
    file_metadata: dict,
    batch_size: int = 2,
):
    return asyncio.run(
        pdf_download_and_batch_async(
            job_id, user_id, file_id, file_url, file_metadata, batch_size
        )
    )
