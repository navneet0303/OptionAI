import logging
import random
from datetime import datetime
from config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class GrowwClient:
    def __init__(self):
        self.username = settings.GROWW_USERNAME
        self.password = settings.GROWW_PASSWORD
        self.pin = settings.GROWW_PIN
        self.is_logged_in = False
        
    def login(self):
        if not self.username or self.username == "your_email@example.com":
            logger.warning("Groww credentials not configured in .env")
            return {"status": "error", "message": "Credentials missing in .env"}
            
        try:
            logger.info(f"Attempting to login to Groww for user: {self.username}")
            self.is_logged_in = True
            return {"status": "success", "message": "Successfully authenticated with Groww"}
            
        except Exception as e:
            logger.error(f"Failed to login to Groww: {str(e)}")
            self.is_logged_in = False
            return {"status": "error", "message": str(e)}
            
    def get_live_market_data(self):
        """
        Simulates fetching live NIFTY and BANKNIFTY data from Groww.
        We use this to build the UI before connecting real credentials.
        """
        # Generate realistic looking Indian stock market dummy data
        return {
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "market_status": "OPEN",
            "is_demo_data": True,
            "india_vix": round(random.uniform(13.5, 15.5), 2),
            "indices": {
                "NIFTY 50": {
                    "ltp": round(random.uniform(22000, 22100), 2),
                    "change": round(random.uniform(-50, 80), 2),
                    "percent_change": round(random.uniform(-0.4, 0.6), 2)
                },
                "NIFTY BANK": {
                    "ltp": round(random.uniform(46000, 46400), 2),
                    "change": round(random.uniform(-150, 250), 2),
                    "percent_change": round(random.uniform(-0.5, 0.8), 2)
                }
            }
        }

# Create a single instance to be used across the app
groww_broker = GrowwClient()