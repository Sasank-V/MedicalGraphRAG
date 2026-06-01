from sklearn.metrics.pairwise import cosine_similarity
from langchain_huggingface import HuggingFaceEmbeddings

# Vector Embedding Model
embedding_model = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")


# Get embeddings
def get_vector_embedding(text: str):
    return embedding_model.embed_query(text)


# Compute cosine similarity
def find_cosine_similarity(text1: str, text2: str) -> float:
    vec1 = get_vector_embedding(text1)
    vec2 = get_vector_embedding(text2)
    sim = cosine_similarity([vec1], [vec2])[0][0]
    return float(sim)
