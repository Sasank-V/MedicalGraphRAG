import os
import redis
from rq import Queue
from dotenv import load_dotenv

load_dotenv()

redis_conn_host = os.getenv("REDIS_HOST")
redis_conn_port = os.getenv("REDIS_PORT")
redis_conn_pass = os.getenv("REDIS_PASSWORD")

if not redis_conn_host or not redis_conn_port:
    raise Exception("REDIS env variables not found")

redis_conn = redis.Redis(
    host=redis_conn_host,
    port=int(redis_conn_port),
    password=redis_conn_pass,
    decode_responses=True,
)

pdf_queue = Queue("pdf-jobs", connection=redis_conn)
markdown_queue = Queue("markdown-jobs", connection=redis_conn)
vectorDB_queue = Queue("vectordb-jobs", connection=redis_conn)
graphDB_queue = Queue("graphdb-jobs", connection=redis_conn)
query_queue = Queue("queries", connection=redis_conn)


print("Queues initialized successfully:")
print(f" - {pdf_queue.name}")
print(f" - {markdown_queue.name}")
print(f" - {vectorDB_queue.name}")
print(f" - {graphDB_queue.name}")
print(f" - {query_queue.name}")
