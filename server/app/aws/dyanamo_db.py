import os
import uuid
from datetime import datetime
from typing import Any, Dict, Optional

import boto3
from botocore.config import Config
from boto3.dynamodb.conditions import Key
from decimal import Decimal


_dynamodb = None
_table = None


def _get_table_name() -> str:
    return os.getenv("DDB_JOBS_TABLE") or os.getenv("RAG_JOBS_TABLE") or "rag_jobs"


def _get_pk_name() -> str:
    """Return the DynamoDB partition key attribute name from env, default 'job_id'."""
    return os.getenv("DDB_JOBS_TABLE_PK") or "job_id"


def get_table():
    global _dynamodb, _table
    if _table is not None:
        return _table

    region = os.getenv("AWS_REGION") or os.getenv("AWS_DEFAULT_REGION") or "us-east-1"
    _dynamodb = boto3.resource("dynamodb", config=Config(region_name=region))
    _table = _dynamodb.Table(_get_table_name())
    return _table


def iso_now() -> str:
    return datetime.utcnow().isoformat() + "Z"


def _to_dynamodb(value: Any) -> Any:
    """Recursively convert Python objects to DynamoDB-friendly types.
    - float -> Decimal
    - list/tuple -> list with converted elements
    - dict -> dict with converted values
    Other types are returned as-is.
    """
    if isinstance(value, float):
        # Use string to avoid binary floating point issues
        return Decimal(str(value))
    if isinstance(value, dict):
        return {k: _to_dynamodb(v) for k, v in value.items()}
    if isinstance(value, (list, tuple)):
        return [_to_dynamodb(v) for v in value]
    return value


def create_job(
    user_id: str,
    action: str,
    input_payload: Dict[str, Any],
    job_id: Optional[str] = None,
) -> str:
    """Create a new job record in DynamoDB and return job_id."""
    table = get_table()
    job_id = job_id or str(uuid.uuid4())

    pk_name = _get_pk_name()
    item = {
        "user_id": user_id,
        "action": action,
        "status": "queued",
        "progress": 0,
        "message": "Queued",
        "messages": [],
        "error_message": None,
        "created_at": iso_now(),
        "started_at": None,
        "completed_at": None,
        "input": input_payload,
        "result": None,
    }
    # Set the partition key field
    item[pk_name] = job_id
    # Optionally also store a common 'job_id' attribute for clients if pk isn't 'job_id'
    if pk_name != "job_id":
        item["job_id"] = job_id

    # Convert any floats to Decimal for DynamoDB
    item = _to_dynamodb(item)
    table.put_item(Item=item)
    return job_id


def update_job(job_id: str, fields: Dict[str, Any]):
    """Update arbitrary fields of a job."""
    table = get_table()
    pk_name = _get_pk_name()
    # Build UpdateExpression
    expr_parts = []
    expr_attr_vals = {}
    expr_attr_names = {}
    for k, v in fields.items():
        name_key = f"#n_{k}"
        val_key = f":v_{k}"
        expr_parts.append(f"{name_key} = {val_key}")
        expr_attr_vals[val_key] = _to_dynamodb(v)
        expr_attr_names[name_key] = k
    update_expr = "SET " + ", ".join(expr_parts)

    table.update_item(
        Key={pk_name: job_id},
        UpdateExpression=update_expr,
        ExpressionAttributeValues=expr_attr_vals,
        ExpressionAttributeNames=expr_attr_names,
    )


def append_message(job_id: str, message: str):
    table = get_table()
    pk_name = _get_pk_name()
    table.update_item(
        Key={pk_name: job_id},
        UpdateExpression="SET #msgs = list_append(if_not_exists(#msgs, :empty), :m), #last = :last",
        ExpressionAttributeNames={"#msgs": "messages", "#last": "message"},
        ExpressionAttributeValues={":m": [message], ":empty": [], ":last": message},
    )


def set_status(
    job_id: str,
    status: str,
    message: Optional[str] = None,
    progress: Optional[int] = None,
):
    fields: Dict[str, Any] = {"status": status}
    if message is not None:
        fields["message"] = message
    if progress is not None:
        fields["progress"] = progress
    if status == "started":
        fields["started_at"] = iso_now()
    if status in ("finished", "failed"):
        fields["completed_at"] = iso_now()
    update_job(job_id, fields)
    if message:
        append_message(job_id, message)


def get_job(job_id: str) -> Optional[Dict[str, Any]]:
    table = get_table()
    pk_name = _get_pk_name()
    res = table.get_item(Key={pk_name: job_id})
    return res.get("Item")
