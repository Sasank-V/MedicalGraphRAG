import asyncio
import logging
from app.models.db_models import init_db
from app.services.graph_db import init_graph_db
from app.services.vector_db import init_vector_db

logger = logging.getLogger(__name__)


class WorkerDB:
    _db_initialized = False
    _vector_db_initialized = False
    _graph_db_initialized = False

    @classmethod
    async def ensure_connection(cls):
        if not cls._db_initialized:
            await init_db()
            cls._db_initialized = True
            logger.info("Worker MongoDB connection established")

    @classmethod
    def ensure_connection_sync(cls):
        if not cls._db_initialized:
            asyncio.run(cls.ensure_connection())

    @classmethod
    def ensure_vector_db_connection(cls):
        if not cls._vector_db_initialized:
            init_vector_db()
            cls._vector_db_initialized = True
            logger.info("Worker VectorDB connection established")

    @classmethod
    def ensure_graph_db_connection(cls):
        if not cls._graph_db_initialized:
            init_graph_db()
            cls._graph_db_initialized = True
            logger.info("Worker GraphDB (Neo4j) connection established")

    @classmethod
    async def ensure_all_connections(cls):
        await cls.ensure_connection()
        cls.ensure_vector_db_connection()
        cls.ensure_graph_db_connection()

    @classmethod
    def ensure_all_connections_sync(cls):
        asyncio.run(cls.ensure_all_connections())
