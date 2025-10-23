import asyncio
import os
import requests
from io import BytesIO
from datetime import datetime
from services.data_processing import convert_pdf_to_markdown
from models.worker_db import WorkerDB
from models.db_models import update_job_status, JobStatus
from core.logger import get_logger

logger = get_logger()

# Next.js service URL for webhook
NEXTJS_SERVICE_URL = os.getenv("NEXTJS_SERVICE_URL", "http://localhost:3000")


async def process_markdown_batch_async(
    job_id: str,
    file_stream: BytesIO,
    page_range: tuple[int, int],
    file_metadata: dict[str, any],
):
    """
    Convert PDF batch to markdown and send to Next.js service.
    Next.js will handle Vector DB and Graph DB embedding.
    """
    await WorkerDB.ensure_connection()
    try:
        logger.info(
            f"Starting markdown conversion for job {job_id}, pages: {page_range}"
        )
        # Update job status to STARTED
        await update_job_status(job_id, JobStatus.STARTED, started_time=datetime.now())

        # Convert PDF pages to Markdown
        markdown_text = convert_pdf_to_markdown(file_stream, page_range)
        logger.info(
            f"Converted pages {page_range} to markdown ({len(markdown_text)} chars)"
        )

        # Send markdown to Next.js webhook for Vector/Graph DB processing
        try:
            response = requests.post(
                f"{NEXTJS_SERVICE_URL}/api/webhook/process-markdown",
                json={
                    "job_id": job_id,
                    "page_range": list(page_range),
                    "markdown_content": markdown_text,
                    "file_metadata": file_metadata,
                },
                timeout=30,
            )
            response.raise_for_status()
            logger.info(
                f"Successfully sent markdown batch (pages {page_range}) to Next.js service"
            )
        except requests.exceptions.RequestException as req_err:
            logger.error(f"Failed to send markdown to Next.js: {req_err}")
            raise Exception(f"Webhook failed: {req_err}")

        # Update job status to FINISHED
        await update_job_status(
            job_id,
            JobStatus.FINISHED,
            completed_time=datetime.now(),
        )
        logger.info(f"Completed markdown processing for job {job_id}")

    except Exception as e:
        logger.error(f"Error in markdown worker for job {job_id}: {e}")
        await update_job_status(
            job_id,
            JobStatus.FAILED,
            completed_time=datetime.now(),
            error_message=str(e),
        )
        raise e


# Sync wrapper for RQ compatibility
def process_markdown_batch(
    job_id: str,
    file_stream: BytesIO,
    page_range: tuple[int, int],
    file_metadata: dict[str, any],
):
    """Sync wrapper to run async function in RQ worker."""
    return asyncio.run(
        process_markdown_batch_async(
            job_id=job_id,
            file_stream=file_stream,
            page_range=page_range,
            file_metadata=file_metadata,
        )
    )
