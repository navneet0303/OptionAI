import os
from dotenv import load_dotenv

# Load the secret variables from the .env file
load_dotenv()

class Settings:
    GROWW_USERNAME = os.getenv("GROWW_USERNAME")
    GROWW_PASSWORD = os.getenv("GROWW_PASSWORD")
    GROWW_PIN = os.getenv("GROWW_PIN")
    
    # EXACT VARIABLE NAME LOAD KAR RAHE HAIN
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

settings = Settings()