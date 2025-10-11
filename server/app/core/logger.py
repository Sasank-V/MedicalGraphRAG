import logging


def get_logger():
    logger = logging.getLogger("uvicorn.error")
    logger.setLevel(logging.DEBUG)
    return logger
