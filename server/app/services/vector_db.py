from pinecone.grpc import PineconeGRPC
from dotenv import load_dotenv

load_dotenv()
import os

pc_api_key = os.getenv("PINECONE_API_KEY")
pc_host_index = os.getenv("PINECONE_HOST_INDEX")
if not pc_api_key or not pc_host_index:
    raise Exception("Pinecone env variables not found")

pc = Pinecone(api_key=pc_api_key)
index = pc.Index(host=pc_host_index)


def get_chunk_id(file_id: str, page_range: str, chunk_id: int):
    return f"{file_id}_{page_range}_chunk_{chunk_id}"


def insert_text_chunk(text: str, metadata: dict):

    record = metadata.copy()
    page_range = record["page_range"]
    record["page_range"] = f"{page_range[0]}_{page_range[1]}"
    record["text"] = text
    record["_id"] = get_chunk_id(
        metadata["file_id"], metadata["page_range"], chunk_id=metadata["chunk_id"]
    )

    index.upsert_records(namespace="__default__", records=[record])


def query_vector_store(query: str, top_k: int = 5):
    results = index.search(
        namespace="__default__",
        query={"inputs": {"text": query}, "top_k": 5},
    )
    return results
