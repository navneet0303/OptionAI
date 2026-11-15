from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import models
import schemas
from database import engine, SessionLocal, Base
from config import settings
from services.groww import groww_broker

# This line creates the actual optionai.db file and tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="OptionAI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", 
        "http://localhost:5174"
    ], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def read_root():
    return {"message": "OptionAI Backend is connected and running!"}

# Secure Broker Status Endpoint
@app.get("/api/status")
def broker_status():
    # Attempt to login using the service
    login_response = groww_broker.login()
    
    return {
        "broker": "Groww", 
        "configured": groww_broker.is_logged_in,
        "message": login_response["message"]
    }

# Get live market data for the dashboard
@app.get("/api/market-data")
def get_market_data():
    return groww_broker.get_live_market_data()

# Get all trades
@app.get("/trades", response_model=list[schemas.TradeResponse])
def get_trades(db: Session = Depends(get_db)):
    trades = db.query(models.TradeRecord).all()
    return trades

# Create a new trade
@app.post("/trades", response_model=schemas.TradeResponse)
def create_trade(trade: schemas.TradeCreate, db: Session = Depends(get_db)):
    db_trade = models.TradeRecord(**trade.model_dump())
    db.add(db_trade)
    db.commit()
    db.refresh(db_trade)
    return db_trade

# NEW: Exit a trade and calculate P&L
@app.put("/trades/{trade_id}/close", response_model=schemas.TradeResponse)
def close_trade(trade_id: int, exit_price: float, db: Session = Depends(get_db)):
    # Find the trade in the database
    trade = db.query(models.TradeRecord).filter(models.TradeRecord.id == trade_id).first()
    
    if not trade:
        raise HTTPException(status_code=404, detail="Trade not found")
    
    # Update the exit price
    trade.exit_price = exit_price
    
    # Calculate Profit & Loss (P&L)
    if "Long" in trade.strategy:
        trade.pnl = round((exit_price - trade.entry_price) * trade.quantity, 2)
    elif "Short" in trade.strategy:
        trade.pnl = round((trade.entry_price - exit_price) * trade.quantity, 2)
    else:
        trade.pnl = 0.0
        
    db.commit()
    db.refresh(trade)
    return trade