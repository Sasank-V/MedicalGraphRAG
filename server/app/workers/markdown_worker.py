import asyncio
from io import BytesIO
from datetime import datetime
from langchain.text_splitter import RecursiveCharacterTextSplitter
from app.services.data_processing import convert_pdf_to_markdown
from app.models.worker_db import WorkerDB
from app.models.db_models import update_job_status, JobStatus, QueueJob
from app.core.logger import get_logger
from app.workers.queue import vectorDB_queue
from app.workers.vectordb_worker import insert_chunks_to_vectordb

logger = get_logger()


async def extract_markdown_and_embed_async(
    user_id: str,
    job_id: str,
    file_id: str,
    file_stream: BytesIO,
    page_range: tuple[int, int],
    file_metadata: dict[str, any],
):
    await WorkerDB.ensure_connection()
    try:
        logger.info(
            f"Starting markdown conversion for job {job_id}, pages: {page_range}"
        )
        # Update job status to STARTED
        await update_job_status(job_id, JobStatus.STARTED, started_time=datetime.now())

        # Setup LangChain text splitter
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=750, chunk_overlap=100, length_function=len
        )

        # Get Markdown Text
        markdown_text = convert_pdf_to_markdown(file_stream, page_range)

        # Split text into chunks
        chunks = text_splitter.split_text(markdown_text)
        child_job_ids = []

        for chunk_id, chunk_text in enumerate(chunks):
            metadata = dict(file_metadata)
            metadata["page_range"] = page_range
            metadata["chunk_id"] = chunk_id

            # Create VectorDB job for this chunk
            vectordb_job = QueueJob(
                user_id=user_id,
                status=JobStatus.QUEUED,
                action="vectordb_insert",
                parent_job_id=job_id,
                file_id=file_id,
                file_metadata=file_metadata,
                page_range=page_range,
                chunk_id=chunk_id,
            )
            await vectordb_job.insert()
            child_job_ids.append(str(vectordb_job.id))

            # Enqueue VectorDB jobs
            vectorDB_queue.enqueue(
                insert_chunks_to_vectordb,
                job_id=str(vectordb_job.id),
                user_id=user_id,
            )

            # insert_text_chunk(chunk_text, metadata)
            # print(f"Embedded chunk {idx} from pages {page_range}")
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
def extract_markdown_and_embed(
    job_id: str,
    file_stream: BytesIO,
    page_range: tuple[int, int],
    file_metadata: dict[str, any],
):
    return asyncio.run(
        extract_markdown_and_embed_async(job_id, file_stream, page_range, file_metadata)
    )
