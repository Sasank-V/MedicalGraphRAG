import os
from pinecone import Pinecone
from dotenv import load_dotenv

load_dotenv()

_pc = None
_index = None
_vectordb_initialized = False


def init_vector_db():
    global _pc, _index, _vectordb_initialized
    if _vectordb_initialized:
        return _index

    api_key = os.getenv("PINECONE_API_KEY")
    host_index = os.getenv("PINECONE_HOST_INDEX")
    if not api_key or not host_index:
        raise Exception("Pinecone env variables not found")

    _pc = Pinecone(api_key=api_key)
    _index = _pc.Index(host=host_index)
    _vectordb_initialized = True
    return _index


def _ensure_index():
    if _index is None:
        init_vector_db()
    return _index


def get_chunk_id(file_id: str, page_range: str, chunk_id: int):
    return f"{file_id}_{page_range}_chunk_{chunk_id}"


def insert_text_chunk(text: str, metadata: dict):
    index = _ensure_index()

    record = metadata.copy()
    page_range = record["page_range"]
    record["page_range"] = f"{page_range[0]}_{page_range[1]}"
    record["text"] = text
    record["_id"] = get_chunk_id(
        metadata["file_id"], record["page_range"], chunk_id=metadata["chunk_id"]
    )

    # Pinecone text index upsert (serverless text search)
    index.upsert_records(namespace="__default__", records=[record])


def query_vector_store(query: str, top_k: int = 5):
    index = _ensure_index()
    return index.search(
        namespace="__default__",
        query={"inputs": {"text": query}, "top_k": top_k},
    )
