from langchain_neo4j import Neo4jGraph
from langchain_experimental.graph_transformers import LLMGraphTransformer
from langchain_core.documents import Document
from langchain_neo4j import GraphCypherQAChain
from .llm_models import gemini_model
from ..lib.graph import allowed_relationships
import os
import asyncio

neo4j_connection_url = os.getenv("NEO4J_CONNECTION_URL")
neo4j_username = os.getenv("NEO4J_USERNAME")
neo4j_password = os.getenv("NEO4J_PASSWORD")

graph_db = None
llm_transformer = None


def init_graph_db():
    global graph_db, llm_transformer

    if not neo4j_connection_url or not neo4j_username or not neo4j_password:
        print("Neo4j Credentials Missing")
    try:
        graph_db = Neo4jGraph(
            url=neo4j_connection_url,
            username=neo4j_username,
            password=neo4j_password,
            enhanced_schema=False,
        )
        print("Neo4j connection established")
    except Exception as e:
        print(f"Failed to connect to Neo4j: {e}")
        graph_db = None

    if graph_db:
        llm_transformer = LLMGraphTransformer(
            llm=gemini_model,
            allowed_relationships=allowed_relationships,
        )


async def query_graphdb_with_text(text: str):
    if not graph_db:
        return {"error": "Neo4j not connected"}

    chain = GraphCypherQAChain.from_llm(
        graph=graph_db, llm=gemini_model, verbose=True, allow_dangerous_requests=True
    )
    return chain.invoke({"query": text})


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
        print(graph_document_props)
        graph_db.add_graph_documents(graph_document_props, baseEntityLabel=True)
        print("Successfully added to graph database")
    except Exception as e:
        print(f"Error adding to graph database: {e}")
