from langchain.chat_models import init_chat_model
from dotenv import load_dotenv
import os
import getpass

load_dotenv()

# Gemini LLM
if not os.environ.get("GOOGLE_API_KEY"):
    os.environ["GOOGLE_API_KEY"] = getpass.getpass("Enter API key for Google Gemini: ")
gemini_model = init_chat_model("gemini-2.5-flash", model_provider="google_genai")

# Mistral LLM
if not os.environ.get("MISTRAL_API_KEY"):
    os.environ["MISTRAL_API_KEY"] = getpass.getpass("Enter API key for Mistral AI: ")
mistal_model = init_chat_model("ministral-3b-latest", model_provider="mistralai")
