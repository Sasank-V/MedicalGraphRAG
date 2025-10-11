from typing import Optional, Dict, Any
from pydantic import BaseModel


class EmbedRequest(BaseModel):
    user_id: str
    file_id: str
    file_url: str
    file_name: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    batch_size: int = 2
