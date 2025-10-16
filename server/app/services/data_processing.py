import requests
import fitz
import os
from io import BytesIO
from typing import Generator, Tuple
from llama_cloud_services import LlamaParse
from llama_index.core import Document
from langchain.text_splitter import RecursiveCharacterTextSplitter
from services.vector_db import insert_text_chunk


# Get File bytes stream
def get_file_bytes_stream(file_url: str, chunk_size: int = 8192) -> BytesIO | None:
    try:
        print(f"Downloading from: {file_url}")
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/116.0.0.0 Safari/537.36",
            "Accept": "application/pdf,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        }
        response = requests.get(file_url, stream=True, timeout=30, headers=headers)
        response.raise_for_status()

        # Check content type
        content_type = response.headers.get("content-type", "")
        print(f"Content-Type: {content_type}")

        if (
            "application/pdf" not in content_type.lower()
            and "pdf" not in content_type.lower()
        ):
            print(f"Warning: Content type may not be PDF: {content_type}")

        file_stream = BytesIO()
        total_size = 0
        for chunk in response.iter_content(chunk_size=chunk_size):
            if chunk:
                file_stream.write(chunk)
                total_size += len(chunk)

        print(f"Downloaded {total_size} bytes")
        file_stream.seek(0)  # Reset pointer to start

        # Validate we have content and it looks like a PDF
        if total_size == 0:
            print("Error: Downloaded file is empty")
            return None

        # Check PDF magic number
        pdf_header = file_stream.read(5)
        file_stream.seek(0)
        if not pdf_header.startswith(b"%PDF-"):
            print(f"Warning: File does not start with PDF header. Got: {pdf_header}")

        return file_stream
    except Exception as e:
        print(f"Error during download: {e}")
        return None


# Generate PDF Processing Page Batches
def get_page_batches(
    total_pages: int, batch_size: int
) -> Generator[Tuple[int, int], None, None]:
    for start in range(1, total_pages, batch_size):
        end = min(start + batch_size, total_pages)
        yield (start, end)


# Get PDF Page Range Batch Bytes Stream
def get_batch_stream(doc, page_range):
    new_pdf = fitz.open()
    for i in range(page_range[0] - 1, page_range[1]):
        new_pdf.insert_pdf(doc, from_page=i, to_page=i)
    output_stream = BytesIO()
    new_pdf.save(output_stream)
    output_stream.seek(0)
    return output_stream


# Convert PDF to Markdown using LlamaIndex
async def convert_pdf_to_markdown_async(
    file_stream: BytesIO, page_range: Tuple[int, int], file_name: str
) -> str:
    file_stream.seek(0)
    if file_stream.getvalue() == b"":
        raise ValueError("Empty input stream")

    parser = LlamaParse(
        api_key=os.getenv("LLAMA_CLOUD_API_KEY"),
        result_type="markdown",
        verbose=False,
        # optionally partition_pages, etc.
    )

    # LlamaParse requires a file_name in extra_info when passing bytes
    file_bytes = file_stream.getvalue()
    safe_file_name = file_name or "document.pdf"

    docs = await parser.aload_data(
        file_bytes,
        extra_info={"file_name": safe_file_name},
    )

    if not docs:
        raise Exception("No parsed documents returned")

    parts = [doc.text for doc in docs]
    return "\n\n".join(parts)


# Process PDF
def process_pdf_embed(file_url: str, file_metadata: dict, batch_size: int = 2):
    file_stream = get_file_bytes_stream(file_url)
    if not file_stream:
        raise Exception("Failed to get File byte stream")
    print("Got file stream")

    # Get total pages
    file_stream.seek(0)
    with fitz.open(stream=file_stream, filetype="pdf") as doc:
        total_pages = doc.page_count
    print(f"Total pages detected: {total_pages}")

    # Setup LangChain text splitter
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=750, chunk_overlap=100, length_function=len
    )

    # Process PDF in batches
    for page_range in get_page_batches(total_pages, batch_size):
        markdown_text = convert_pdf_to_markdown(file_stream, page_range)

        # Split text into chunks
        chunks = text_splitter.split_text(markdown_text)
        for idx, chunk_text in enumerate(chunks):
            metadata = dict(file_metadata)
            metadata["page_range"] = page_range
            metadata["chunk_id"] = idx

            insert_text_chunk(chunk_text, metadata)
            print(f"Embedded chunk {idx} from pages {page_range}")
