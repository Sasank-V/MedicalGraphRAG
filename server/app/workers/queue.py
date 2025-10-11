import redis
from rq import Queue
from dotenv import load_dotenv
import os

load_dotenv()

redis_conn_host = os.getenv("REDIS_HOST")
redis_conn_port = os.getenv("REDIS_PORT")
redis_conn_pass = os.getenv("REDIS_PASSWORD")

if not redis_conn_host or not redis_conn_port or not redis_conn_pass:
    raise Exception("REDIS env variables not found")

redis_conn = redis.Redis(
    host=redis_conn_host, port=redis_conn_port, password=redis_conn_pass, db=0
)

pdf_queue = Queue("pdf-jobs", connection=redis_conn)
vectorDB_queue = Queue("vectordb-jobs", connection=redis_conn)
graphDB_queue = Queue("graphdb-jobs", connection=redis_conn)
