import asyncio
import json
from datetime import datetime
from workers.queue import redis_conn
from services.vector_db import query_vector_store
from services.llm_models import gemini_model, mistal_model
from models.db_models import update_job_status, JobStatus
from core.logger import get_logger
from models.worker_db import WorkerDB


logger = get_logger()


def publish(job_id: str, event: str, data: dict | str | None = None):
    payload = {"event": event}
    if data is not None:
        payload["data"] = data
    redis_conn.publish(job_id, json.dumps(payload))


async def process_query_async(
    job_id: str,
    query: str,
    model: str = "gemini",
    top_k: int = 5,
):
    await WorkerDB.ensure_connection()
    try:
        logger.info(f"Starting Query Processing for Job: {job_id}")
        await update_job_status(job_id, JobStatus.STARTED, started_time=datetime.now())

        publish(job_id, "status", "Job started")
        await asyncio.sleep(0)

        # Vector search (skip GraphDB)
        publish(job_id, "status", "Searching vectorDB")
        results = query_vector_store(query, top_k=top_k)
        # Normalize results to a list of records
        if isinstance(results, dict):
            records = results.get("records") or results.get("matches") or []
        else:
            records = getattr(results, "records", None) or getattr(
                results, "matches", []
            )

        references: list[dict] = []
        contexts: list[str] = []
        for rec in records:
            meta = rec
            text = rec.get("text") or rec.get("values") or ""
            file_id = meta.get("file_id")
            file_name = meta.get("file_name")
            file_url = meta.get("file_url")
            page_range = meta.get("page_range")
            chunk_id = meta.get("chunk_id")
            # Normalize page range
            page_tuple = None
            try:
                if isinstance(page_range, str) and "_" in page_range:
                    s, e = page_range.split("_", 1)
                    page_tuple = (int(s), int(e))
                elif isinstance(page_range, (list, tuple)) and len(page_range) == 2:
                    page_tuple = (int(page_range[0]), int(page_range[1]))
            except Exception:
                page_tuple = None

            references.append(
                {
                    "file_id": file_id,
                    "file_name": file_name,
                    "file_url": file_url,
                    "page_range": page_tuple,
                    "chunk_id": chunk_id,
                }
            )
            if text:
                contexts.append(text)

        publish(job_id, "references", references)
        publish(job_id, "status", "Finished searching vectorDB")

        # LLM generation
        publish(job_id, "status", "Generating LLM response")
        model_obj = (
            gemini_model
            if (model or "gemini").lower().startswith("gem")
            else mistal_model
        )
        system_prompt = (
            "You are a helpful medical assistant. Use the provided context to answer the question. "
            "Cite the references by file_name and page_range when relevant. If unsure, say you don't know."
        )
        context_blob = "\n\n---\n\n".join(contexts[:top_k])
        user_prompt = f"Question: {query}\n\nContext:\n{context_blob}"

        # Try async streaming if available, else run sync in a thread
        try:
            if hasattr(model_obj, "astream"):
                async for chunk in model_obj.astream(
                    [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ]
                ):
                    content = getattr(chunk, "content", None) or str(chunk)
                    publish(job_id, "token", content)
                    await asyncio.sleep(0)
            elif hasattr(model_obj, "stream"):

                def _run_stream():
                    for chunk in model_obj.stream(
                        [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_prompt},
                        ]
                    ):
                        content = getattr(chunk, "content", None) or str(chunk)
                        publish(job_id, "token", content)

                await asyncio.to_thread(_run_stream)
            else:
                # Non-streaming fallback: invoke then chunk
                def _invoke():
                    resp = model_obj.invoke(
                        [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_prompt},
                        ]
                    )
                    return getattr(resp, "content", None) or str(resp)

                content = await asyncio.to_thread(_invoke)
                for i in range(0, len(content), 512):
                    publish(job_id, "token", content[i : i + 512])
                    await asyncio.sleep(0)
        except Exception as e:
            publish(job_id, "error", str(e))
            await update_job_status(
                job_id,
                JobStatus.FAILED,
                completed_time=datetime.now(),
                error_message=str(e),
            )
            return

        publish(job_id, "done", {})
        await update_job_status(
            job_id, JobStatus.FINISHED, completed_time=datetime.now()
        )
        logger.info(f"Query processing completed for Job: {job_id}")
    except Exception as e:
        logger.error(f"Error in Query worker for job {job_id}: {e}")
        publish(job_id, "error", str(e))
        await update_job_status(
            job_id,
            JobStatus.FAILED,
            completed_time=datetime.now(),
            error_message=str(e),
        )
        raise


def process_query(
    job_id: str,
    query: str,
    model: str = "gemini",
    top_k: int = 5,
):
    """Sync wrapper for RQ compatibility."""
    return asyncio.run(
        process_query_async(job_id=job_id, query=query, model=model, top_k=top_k)
    )
