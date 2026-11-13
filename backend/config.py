import os
from dotenv import load_dotenv

# Load the secret variables from the .env file
load_dotenv()

class Settings:
    GROWW_USERNAME = os.getenv("GROWW_USERNAME")
    GROWW_PASSWORD = os.getenv("GROWW_PASSWORD")
    GROWW_PIN = os.getenv("GROWW_PIN")

settings = Settings()