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

    # Filter metadata to only include simple types (string, number, boolean, list of strings)
    # Pinecone doesn't accept nested objects or dicts
    def is_valid_pinecone_value(value):
        if isinstance(value, (str, int, float, bool)):
            return True
        if isinstance(value, list):
            return all(isinstance(item, str) for item in value)
        return False

    # Clean metadata
    cleaned_metadata = {}
    for key, value in metadata.items():
        if key == "page_range":
            # Handle page_range separately
            continue
        if is_valid_pinecone_value(value):
            cleaned_metadata[key] = value
        elif isinstance(value, (list, tuple)) and len(value) > 0:
            # Try to convert to list of strings
            try:
                cleaned_metadata[key] = [str(v) for v in value]
            except:
                pass
        elif value is not None and not isinstance(value, dict):
            # Convert other simple values to string
            cleaned_metadata[key] = str(value)

    # Add required fields
    page_range = metadata["page_range"]
    cleaned_metadata["page_range"] = f"{page_range[0]}_{page_range[1]}"
    cleaned_metadata["text"] = text
    cleaned_metadata["_id"] = get_chunk_id(
        metadata["file_id"],
        cleaned_metadata["page_range"],
        chunk_id=metadata["chunk_id"],
    )

    # Pinecone text index upsert (serverless text search)
    index.upsert_records(namespace="__default__", records=[cleaned_metadata])


def query_vector_store(query: str, top_k: int = 5):
    index = _ensure_index()
    return index.search(
        namespace="__default__",
        query={"inputs": {"text": query}, "top_k": top_k},
    )
