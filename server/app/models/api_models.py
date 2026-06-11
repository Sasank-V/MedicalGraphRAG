from typing import Optional, Dict, Any
from pydantic import BaseModel


class EmbedRequest(BaseModel):
    user_id: str
    file_id: str
    file_url: str
    file_name: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    batch_size: int = 2


class Message(BaseModel):
    """Represents a chat message with role and content."""

    role: str  # "user" or "assistant"
    content: str


class QueryRequest(BaseModel):
    """Request body for query endpoint.

    - query: user question to answer
    - top_k: number of chunks to retrieve from vector DB
    - model: which LLM to use ("gemini" or "mistral")
    - user_id: optional for tracking
    - previous_messages: optional list of previous conversation messages
    """

    query: str
    top_k: int = 5
    model: Optional[str] = "gemini"
    user_id: Optional[str] = None
    previous_messages: Optional[list[Message]] = None
