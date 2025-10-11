from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from app.models.db_models import init_db
from app.models.api_models import EmbedRequest
from app.models.db_models import QueueJob, JobStatus
from app.workers.queue import pdf_queue
from app.workers.pdf_worker import pdf_download_and_batch
from beanie import PydanticObjectId


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(lifespan=lifespan)


@app.post("/embed")
async def embed_document(payload: EmbedRequest):
    try:
        file_metadata = {
            **(payload.metadata or {}),
            "user_id": payload.user_id,
            "file_id": payload.file_id,
            "file_url": payload.file_url,
        }
        if payload.file_name:
            file_metadata["file_name"] = payload.file_name

        # Create parent QueueJob
        pdf_job = QueueJob(
            user_id=payload.user_id,
            status=JobStatus.QUEUED,
            action="pdf_processing",
            file_id=payload.file_id,
            file_metadata=file_metadata,
        )
        await pdf_job.insert()

        # Enqueue PDF Job
        rq_job = pdf_queue.enqueue(
            pdf_download_and_batch,
            job_id=str(pdf_job.id),
            user_id=payload.user_id,
            file_id=payload.file_id,
            file_url=payload.file_url,
            file_metadata=file_metadata,
            batch_size=payload.batch_size,
        )

        return JSONResponse(
            status_code=202,
            content={
                "message": "Document processing started",
                "job_id": str(pdf_job.id),
                "rq_job_id": rq_job.id,
            },
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


app.get("/job/{job_id}")


async def get_job_details(job_id: str):
    try:
        # Validate ObjectId
        try:
            oid = PydanticObjectId(job_id)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid job id")

        job = await QueueJob.get(oid)
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")

        # return {
        #     "id": str(job.id),
        #     "user_id": job.user_id,
        #     "status": job.status,
        #     "action": job.action,
        #     "parent_job_id": job.parent_job_id,
        #     "child_job_ids": job.child_job_ids or [],
        #     "enqueued_at": job.enqueued_at,
        #     "started_at": job.started_at,
        #     "completed_at": job.completed_at,
        #     "error_message": job.error_message,
        #     "file_id": job.file_id,
        #     "file_metadata": job.file_metadata,
        #     "page_range": job.page_range,
        #     "chunk_id": job.chunk_id,
        # }
        return job
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/query")
def generate_response(request):
    print(
        "Query the Vector DB , Augment Results and Return the response with References"
    )


@app.get("/health")
def check_server_health(request):
    try:
        print("Check Vector DB connection Health")
        print("Check Redis Connection Health")
        return JSONResponse(
            status_code=200,
            content={"status": "ok", "redis": "connected", "vector_db": "connected"},
        )
    except Exception as e:
        return JSONResponse(
            status_code=503, content={"status": "error", "message": str(e)}
        )
