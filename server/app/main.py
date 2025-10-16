import asyncio
import fitz
from fastapi import FastAPI
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from langchain.text_splitter import RecursiveCharacterTextSplitter
from models.db_models import init_db
from models.api_models import EmbedRequest, QueryRequest
from services.data_processing import (
    get_file_bytes_stream,
    get_page_batches,
    convert_pdf_to_markdown_async,
)
from services.vector_db import insert_text_chunk, query_vector_store, init_vector_db
from services.graph_db import (
    insert_chunk_to_graphdb,
    init_graph_db,
    query_graphdb_with_text,
)
from services.llm_models import gemini_model, mistal_model
import json


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    init_vector_db()
    init_graph_db()
    yield


app = FastAPI(
    title="PDF to Markdown Service",
    description="Microservice for converting PDFs to Markdown",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware for Next.js communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
    ],  # Add your Next.js URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/embed-pdf-stream")
async def embed_pdf_stream(payload: EmbedRequest):
    """
    Embed PDF directly with streaming status updates.
    Processes PDF, converts to markdown, chunks text, and embeds into vector and graph databases.
    Streams progress updates at each checkpoint.
    """

    async def generate_status():
        try:
            # Prepare metadata
            file_metadata = {
                **(payload.metadata or {}),
                "user_id": payload.user_id,
                "file_id": payload.file_id,
                "file_url": payload.file_url,
            }
            if payload.file_name:
                file_metadata["file_name"] = payload.file_name

            # Checkpoint 1: Start processing
            yield f"data: {json.dumps({'status': 'started', 'message': 'Starting PDF processing'})}\n\n"
            await asyncio.sleep(0)

            # Checkpoint 2: Download PDF
            yield f"data: {json.dumps({'status': 'downloading', 'message': 'Downloading PDF file'})}\n\n"
            file_stream = get_file_bytes_stream(payload.file_url)
            if not file_stream:
                yield f"data: {json.dumps({'status': 'error', 'message': 'Failed to download PDF file'})}\n\n"
                return

            yield f"data: {json.dumps({'status': 'downloaded', 'message': 'PDF downloaded successfully'})}\n\n"
            await asyncio.sleep(0)

            # Checkpoint 3: Get total pages
            file_stream.seek(0)
            with fitz.open(stream=file_stream, filetype="pdf") as doc:
                total_pages = doc.page_count

            yield f"data: {json.dumps({'status': 'pages_detected', 'message': f'Detected {total_pages} pages', 'total_pages': total_pages})}\n\n"
            await asyncio.sleep(0)

            # Setup text splitter
            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=750, chunk_overlap=100, length_function=len
            )

            batch_size = payload.batch_size or 2
            total_batches = (total_pages + batch_size - 1) // batch_size
            batch_num = 0

            # Process each batch
            for page_range in get_page_batches(total_pages, batch_size):
                batch_num += 1

                # Checkpoint 4: Converting batch to markdown
                yield f"data: {json.dumps({'status': 'converting_batch', 'message': f'Converting pages {page_range[0]}-{page_range[1]} to markdown', 'batch': batch_num, 'total_batches': total_batches, 'page_range': page_range})}\n\n"
                await asyncio.sleep(0)

                markdown_text = await convert_pdf_to_markdown_async(
                    file_stream, page_range, file_name=payload.file_name
                )

                yield f"data: {json.dumps({'status': 'batch_converted', 'message': f'Converted {len(markdown_text)} characters', 'batch': batch_num})}\n\n"
                await asyncio.sleep(0)

                # Checkpoint 5: Chunking text
                yield f"data: {json.dumps({'status': 'chunking', 'message': f'Splitting batch {batch_num} into chunks', 'batch': batch_num})}\n\n"
                chunks = text_splitter.split_text(markdown_text)

                yield f"data: {json.dumps({'status': 'chunked', 'message': f'Created {len(chunks)} chunks', 'batch': batch_num, 'chunk_count': len(chunks)})}\n\n"
                await asyncio.sleep(0)

                # Process each chunk
                for idx, chunk_text in enumerate(chunks):
                    metadata = dict(file_metadata)
                    metadata["page_range"] = page_range
                    metadata["chunk_id"] = idx

                    # Checkpoint 6: Embedding to vector DB
                    yield f"data: {json.dumps({'status': 'embedding_vector', 'message': f'Embedding chunk {idx+1}/{len(chunks)} to vector DB', 'batch': batch_num, 'chunk': idx+1})}\n\n"
                    await asyncio.sleep(0)

                    insert_text_chunk(chunk_text, metadata)

                    yield f"data: {json.dumps({'status': 'embedded_vector', 'message': f'Chunk {idx+1} embedded to vector DB', 'batch': batch_num, 'chunk': idx+1})}\n\n"
                    await asyncio.sleep(0)

                    # Checkpoint 7: Embedding to graph DB
                    yield f"data: {json.dumps({'status': 'embedding_graph', 'message': f'Embedding chunk {idx+1}/{len(chunks)} to graph DB', 'batch': batch_num, 'chunk': idx+1})}\n\n"
                    await asyncio.sleep(0)

                    await insert_chunk_to_graphdb(chunk_text, metadata)

                    yield f"data: {json.dumps({'status': 'embedded_graph', 'message': f'Chunk {idx+1} embedded to graph DB', 'batch': batch_num, 'chunk': idx+1})}\n\n"
                    await asyncio.sleep(0)

                yield f"data: {json.dumps({'status': 'batch_complete', 'message': f'Batch {batch_num}/{total_batches} completed', 'batch': batch_num})}\n\n"
                await asyncio.sleep(0)

            # Final checkpoint: Complete
            yield f"data: {json.dumps({'status': 'completed', 'message': 'PDF embedding completed successfully', 'total_pages': total_pages, 'total_batches': total_batches})}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'status': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(generate_status(), media_type="text/event-stream")


@app.post("/query-stream")
async def query_stream(payload: QueryRequest):
    """
    Query the vector database and generate LLM response with streaming.
    Streams status updates and LLM tokens as they are generated.
    """

    async def generate_response():
        try:
            # Checkpoint 1: Start query
            yield f"data: {json.dumps({'event': 'status', 'data': 'Query started'})}\n\n"
            await asyncio.sleep(0)

            # Checkpoint 2: Search vector DB
            yield f"data: {json.dumps({'event': 'status', 'data': 'Searching vector database'})}\n\n"
            await asyncio.sleep(0)

            vector_results = query_vector_store(payload.query, top_k=payload.top_k)

            vector_records = vector_results.result.hits

            # Ensure records is a list
            if vector_records is None:
                vector_records = []

            yield f"data: {json.dumps({'event': 'status', 'data': f'Found {len(vector_records)} results from vector DB'})}\n\n"
            await asyncio.sleep(0)

            # Checkpoint 3: Search graph DB
            yield f"data: {json.dumps({'event': 'status', 'data': 'Searching graph database'})}\n\n"
            await asyncio.sleep(0)

            graph_context = ""
            try:
                graph_result = await query_graphdb_with_text(payload.query)
                if graph_result and not graph_result.get("error"):
                    # Extract the result from GraphDB
                    graph_answer = graph_result.get("result", "")
                    if graph_answer:
                        graph_context = f"\n\nGraph Database Insights:\n{graph_answer}"
                        yield f"data: {json.dumps({'event': 'status', 'data': 'Found relevant graph relationships'})}\n\n"
                    else:
                        yield f"data: {json.dumps({'event': 'status', 'data': 'No graph relationships found'})}\n\n"
                else:
                    yield f"data: {json.dumps({'event': 'status', 'data': 'Graph DB unavailable or no results'})}\n\n"
            except Exception as e:
                yield f"data: {json.dumps({'event': 'status', 'data': f'Graph DB search skipped: {str(e)}'})}\n\n"
                graph_context = ""

            await asyncio.sleep(0)

            # Checkpoint 4: Process vector DB results
            yield f"data: {json.dumps({'event': 'status', 'data': 'Processing search results'})}\n\n"
            await asyncio.sleep(0)

            references = []
            vector_contexts = []

            for rec in vector_records:
                # Handle Pinecone inference API format where data is in 'fields'
                if "fields" in rec:
                    fields = rec["fields"]
                    text = fields.get("text", "")
                    file_id = fields.get("file_id")
                    file_name = fields.get("file_name")
                    file_url = fields.get("file_url")
                    page_range = fields.get("page_range")
                    chunk_id = fields.get("chunk_id")
                    score = rec.get("_score")
                else:
                    # Fallback to direct access
                    text = rec.get("text") or rec.get("values") or ""
                    file_id = rec.get("file_id")
                    file_name = rec.get("file_name")
                    file_url = rec.get("file_url")
                    page_range = rec.get("page_range")
                    chunk_id = rec.get("chunk_id")
                    score = rec.get("score")

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
                        "score": score,
                        "source": "vector_db",
                    }
                )
                if text:
                    vector_contexts.append(text)

            # Checkpoint 5: Send references
            yield f"data: {json.dumps({'event': 'references', 'data': references})}\n\n"
            await asyncio.sleep(0)

            yield f"data: {json.dumps({'event': 'status', 'data': 'Generating LLM response'})}\n\n"
            await asyncio.sleep(0)

            # Checkpoint 6: Generate LLM response
            model_obj = (
                gemini_model
                if (payload.model or "gemini").lower().startswith("gem")
                else mistal_model
            )

            system_prompt = (
                "You are a helpful medical assistant. Use the provided context from both vector database and graph database to answer the question. "
                "The vector database provides relevant document chunks, while the graph database provides entity relationships and connections. "
                "IMPORTANT: When citing sources, always include the file_name, file_url (as a clickable link), and page_range. "
                "Format citations like: [Source: {file_name}, Pages {start}-{end}, URL: {file_url}]. "
                "If unsure about any information, say you don't know."
            )

            # Combine vector contexts with reference metadata
            vector_context_parts = []
            for idx, (context, ref) in enumerate(
                zip(vector_contexts[: payload.top_k], references[: payload.top_k]), 1
            ):
                ref_info = f"[Reference {idx}]\n"
                if ref.get("file_name"):
                    ref_info += f"File: {ref['file_name']}\n"
                if ref.get("file_url"):
                    ref_info += f"URL: {ref['file_url']}\n"
                if ref.get("page_range"):
                    ref_info += (
                        f"Pages: {ref['page_range'][0]}-{ref['page_range'][1]}\n"
                    )
                ref_info += f"Content: {context}"
                vector_context_parts.append(ref_info)

            vector_context_blob = "\n\n---\n\n".join(vector_context_parts)

            # Build complete context
            complete_context = f"Vector Database Context:\n{vector_context_blob}"
            if graph_context:
                complete_context += f"\n\n{graph_context}"

            # Build conversation history with context
            messages = [{"role": "system", "content": system_prompt}]

            # Add previous messages if provided
            if payload.previous_messages:
                for prev_msg in payload.previous_messages:
                    # Normalize role to LangChain-compatible values
                    role = prev_msg.role.lower()
                    # Map common role names to LangChain-compatible ones
                    if role in ["assistant", "ai", "bot"]:
                        role = "assistant"
                    elif role in ["user", "human"]:
                        role = "user"
                    elif role in ["system"]:
                        role = "system"
                    else:
                        # Skip invalid roles or default to user
                        role = "user"

                    messages.append({"role": role, "content": prev_msg.content})

            # Add current query with complete context (vector + graph)
            user_prompt = f"Question: {payload.query}\n\n{complete_context}"
            messages.append({"role": "user", "content": user_prompt})

            # Stream LLM tokens
            try:
                if hasattr(model_obj, "astream"):
                    async for chunk in model_obj.astream(messages):
                        content = getattr(chunk, "content", None) or str(chunk)
                        yield f"data: {json.dumps({'event': 'token', 'data': content})}\n\n"
                        await asyncio.sleep(0)
                elif hasattr(model_obj, "stream"):

                    def _run_stream():
                        result_content = ""
                        for chunk in model_obj.stream(messages):
                            content = getattr(chunk, "content", None) or str(chunk)
                            result_content += content
                        return result_content

                    content = await asyncio.to_thread(_run_stream)
                    # Chunk the response
                    if content:
                        for i in range(0, len(content), 32):
                            yield f"data: {json.dumps({'event': 'token', 'data': content[i:i+32]})}\n\n"
                            await asyncio.sleep(0)
                else:
                    # Non-streaming fallback
                    def _invoke():
                        resp = model_obj.invoke(messages)
                        return getattr(resp, "content", None) or str(resp)

                    content = await asyncio.to_thread(_invoke)
                    # Chunk the response
                    if content:
                        for i in range(0, len(content), 32):
                            yield f"data: {json.dumps({'event': 'token', 'data': content[i:i+32]})}\n\n"
                            await asyncio.sleep(0)

            except Exception as e:
                yield f"data: {json.dumps({'event': 'error', 'data': str(e)})}\n\n"
                return

            # Checkpoint 7: Complete
            yield f"data: {json.dumps({'event': 'done', 'data': {'vector_results': len(vector_records), 'graph_searched': bool(graph_context)}})}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'event': 'error', 'data': str(e)})}\n\n"

    return StreamingResponse(generate_response(), media_type="text/event-stream")


# @app.get("/health")
# def check_server_health():
#     """
#     Health check endpoint.
#     """
#     try:
#         # Check Redis connection
#         from workers.queue import redis_conn

#         redis_conn.ping()

#         return JSONResponse(
#             status_code=200,
#             content={
#                 "status": "ok",
#                 "service": "PDF to Markdown",
#                 "redis": "connected",
#             },
#         )
#     except Exception as e:
#         return JSONResponse(
#             status_code=503, content={"status": "error", "message": str(e)}
#         )
