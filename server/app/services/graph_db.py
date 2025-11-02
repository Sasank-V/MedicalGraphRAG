import os
import asyncio
from langchain_neo4j import Neo4jGraph
from langchain_experimental.graph_transformers import LLMGraphTransformer
from langchain_core.documents import Document
from langchain_neo4j import GraphCypherQAChain
from services.llm_models import mistal_model
from lib.graph import allowed_relationships
from core.logger import get_logger

neo4j_connection_url = os.getenv("NEO4J_CONNECTION_URL")
neo4j_username = os.getenv("NEO4J_USERNAME")
neo4j_password = os.getenv("NEO4J_PASSWORD")

graph_db = None
llm_transformer = None

logger = get_logger()


def init_graph_db():
    global graph_db, llm_transformer
    if graph_db and llm_transformer:
        return
    if not neo4j_connection_url or not neo4j_username or not neo4j_password:
        logger.info("Neo4j Credentials Missing")
        return
    try:
        graph_db = Neo4jGraph(
            url=neo4j_connection_url,
            username=neo4j_username,
            password=neo4j_password,
            enhanced_schema=False,
        )
        logger.info("Neo4j connection established")
    except Exception as e:
        logger.info(f"Failed to connect to Neo4j: {e}")
        graph_db = None
        return

    llm_transformer = LLMGraphTransformer(
        llm=mistal_model,
        allowed_relationships=allowed_relationships,
    )


async def query_graphdb_with_text(text: str):
    """Query Neo4j via GraphCypherQAChain and enrich the result with cypher, raw records, and lightweight references.

    Returns a dict:
      {
        'query': str,                 # the user query
        'cypher': str | None,         # generated cypher if available
        'result': str,                # LLM answer
        'records': list[dict],        # raw rows from executing the cypher (best-effort)
        'references': list[dict],     # extracted refs with file metadata when present
      }
    """
    if not graph_db:
        return {"error": "Neo4j not connected"}

    chain = GraphCypherQAChain.from_llm(
        graph=graph_db, llm=mistal_model, verbose=True, allow_dangerous_requests=True
    )

    output = chain.invoke({"query": text})

    # Attempt to extract generated cypher from intermediate steps
    cypher_query = None
    try:
        steps = output.get("intermediate_steps") or []
        if isinstance(steps, list) and steps:
            # Common shapes: {'query': 'MATCH ...'} or {'cypher': '...'}
            last = steps[-1]
            cypher_query = (last.get("query") if isinstance(last, dict) else None) or (
                last.get("cypher") if isinstance(last, dict) else None
            )
    except Exception:
        cypher_query = None

    # Execute cypher to obtain structured records (best-effort)
    records = []
    if cypher_query:
        try:
            records = graph_db.query(cypher_query) or []
        except Exception as e:
            logger.info(f"Failed to execute generated cypher: {e}")
            records = []

    # Extract lightweight references with metadata if available in returned rows
    def _as_props(val):
        try:
            # Neo4j Node/Relationship objects often carry _properties
            props = getattr(val, "_properties", None)
            if props and isinstance(props, dict):
                return props
            # If already a dict (e.g., projected node maps)
            if isinstance(val, dict):
                return val
        except Exception:
            pass
        return None

    refs = []
    seen = set()
    for row in records:
        try:
            if not isinstance(row, dict):
                continue
            for v in row.values():
                props = _as_props(v)
                if not props:
                    continue
                file_url = props.get("file_url")
                file_name = props.get("file_name")
                file_id = props.get("file_id")
                page_range = props.get("page_range")
                chunk_id = props.get("chunk_id")

                # Dedupe on (file_url, page_range)
                key = f"{file_url}|{page_range}"
                if key in seen:
                    continue
                seen.add(key)

                refs.append(
                    {
                        "file_id": file_id,
                        "file_name": file_name,
                        "file_url": file_url,
                        "page_range": page_range,
                        "chunk_id": chunk_id,
                        "score": None,
                        "source": "graph_db",
                        # No direct chunk text from graph rows; client will show the LLM result or omit
                    }
                )
        except Exception:
            continue

    return {
        "query": text,
        "cypher": cypher_query,
        "result": output.get("result") if isinstance(output, dict) else str(output),
        "records": records,
        "references": refs,
    }


GEMINI_RATE_LIMIT_PER_MINUTE = 15
SECONDS_PER_REQUEST = 60 / GEMINI_RATE_LIMIT_PER_MINUTE


async def insert_chunk_to_graphdb(chunk: str, metadata: dict):
    if not graph_db or not llm_transformer:
        print("Neo4j not available, skipping graph insertion")
        return

    try:
        documents = [Document(page_content=chunk, metadata=metadata)]
        await asyncio.sleep(SECONDS_PER_REQUEST)
        graph_document_props = await llm_transformer.aconvert_to_graph_documents(
            documents=documents,
        )
        logger.info(graph_document_props)
        graph_db.add_graph_documents(graph_document_props, baseEntityLabel=True)
        print("Successfully added to graph database")
    except Exception as e:
        print(f"Error adding to graph database: {e}")
