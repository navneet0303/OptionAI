from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import requests

import models
import schemas
from database import engine, SessionLocal, Base
from config import settings
from services.groww import groww_broker

# Initialize Database
Base.metadata.create_all(bind=engine)

app = FastAPI(title="OptionAI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def read_root():
    return {"message": "OptionAI Backend is connected and running!"}

@app.get("/api/status")
def broker_status():
    login_response = groww_broker.login()
    return {
        "broker": "Groww", 
        "configured": groww_broker.is_logged_in,
        "message": login_response.get("message", "Status checked")
    }

@app.get("/api/engine/status")
def engine_status():
    if settings.GEMINI_API_KEY:
        return {"engine": "Gemini REST API", "status": "ACTIVE", "message": "API Key is valid and Engine is ready."}
    return {"engine": "Gemini REST API", "status": "DISCONNECTED", "message": "API Key missing."}

@app.get("/api/market-data")
def get_market_data():
    return groww_broker.get_live_market_data()

@app.get("/api/ai-insight")
def get_ai_insight():
    market_data = groww_broker.get_live_market_data()
    nifty = market_data.get("indices", {}).get("NIFTY 50", {})
    banknifty = market_data.get("indices", {}).get("NIFTY BANK", {})
    
    if not nifty or not nifty.get("ltp"):
        return {"insight": "Waiting for live market data to generate AI insights..."}

    if not settings.GEMINI_API_KEY:
        return {"insight": "GEMINI_API_KEY is not configured in backend/.env"}

    # Quantitative Trader Prompt
    prompt = f"""
    You are an elite Quantitative Options Trading Assistant. Analyze this live market data:
    - NIFTY 50: Price={nifty.get('ltp')}, RSI(14)={nifty.get('rsi_14')}, 9-EMA={nifty.get('ema_9')}
    - NIFTY BANK: Price={banknifty.get('ltp')}, RSI(14)={banknifty.get('rsi_14')}, 9-EMA={banknifty.get('ema_9')}
    
    Trading Rules:
    1. Price > 9-EMA indicates short-term bullish momentum.
    2. RSI > 70 is overbought (look for reversal/puts), RSI < 30 is oversold (look for bounce/calls).
    3. Always prioritize risk management.
    
    Task: Provide a structured, highly actionable options trading setup. 
    Format your response EXACTLY like this (use plain text only, no markdown):
    Market View: [Bullish / Bearish / Neutral]
    Action: [Buy Call (CE) / Buy Put (PE) / Wait]
    Logic: [1 sentence technical reason based on EMA and RSI]
    Levels: Entry near [X], Target [Y], Stop Loss [Z]
    """
    
    # Models to try (handles deprecated or overloaded models automatically)
    candidate_models = []
    for m in [settings.GEMINI_MODEL, "gemini-flash-lite-latest", "gemini-3.5-flash-lite", "gemini-flash-latest"]:
        if m and m not in candidate_models:
            candidate_models.append(m)

    payload = {"contents": [{"parts": [{"text": prompt}]}]}
    headers = {"Content-Type": "application/json"}
    
    last_error = "Unknown API Error"
    for model_name in candidate_models:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={settings.GEMINI_API_KEY}"
            response = requests.post(url, json=payload, headers=headers, timeout=12)
            data = response.json()
            
            if response.status_code == 200:
                candidates = data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    text_parts = [p.get("text", "") for p in parts if p.get("text") and not p.get("thought", False)]
                    insight_text = "\n".join(text_parts).strip() if text_parts else (parts[0].get("text", "").strip() if parts else "")
                    if insight_text:
                        return {"insight": insight_text}
                return {"insight": "AI generated an empty response. Please retry."}
            else:
                last_error = data.get("error", {}).get("message", f"HTTP {response.status_code}")
                continue
        except Exception as e:
            last_error = str(e)
            continue
            
    return {"insight": f"Google API Error: {last_error}"}

# NEW: Trade Analytics Dashboard API
@app.get("/api/trades/summary")
def get_trades_summary(db: Session = Depends(get_db)):
    trades = db.query(models.TradeRecord).all()
    total_trades = len(trades)
    
    winning_trades = sum(1 for t in trades if t.pnl and t.pnl > 0)
    losing_trades = sum(1 for t in trades if t.pnl and t.pnl < 0)
    total_pnl = sum(t.pnl for t in trades if t.pnl)
    
    win_rate = round((winning_trades / total_trades * 100), 2) if total_trades > 0 else 0
    
    return {
        "performance": {
            "total_trades": total_trades,
            "winning_trades": winning_trades,
            "losing_trades": losing_trades,
            "win_rate_percentage": win_rate,
            "net_pnl": round(total_pnl, 2),
            "status": "Profitable 🚀" if total_pnl > 0 else "In Loss 📉" if total_pnl < 0 else "Breakeven ⚖️"
        }
    }

@app.get("/trades", response_model=list[schemas.TradeResponse])
def get_trades(db: Session = Depends(get_db)):
    return db.query(models.TradeRecord).all()

@app.post("/trades", response_model=schemas.TradeResponse)
def create_trade(trade: schemas.TradeCreate, db: Session = Depends(get_db)):
    db_trade = models.TradeRecord(**trade.model_dump())
    db.add(db_trade)
    db.commit()
    db.refresh(db_trade)
    return db_trade

@app.put("/trades/{trade_id}/close", response_model=schemas.TradeResponse)
def close_trade(trade_id: int, exit_price: float, db: Session = Depends(get_db)):
    trade = db.query(models.TradeRecord).filter(models.TradeRecord.id == trade_id).first()
    if not trade:
        raise HTTPException(status_code=404, detail="Trade not found")
    
    trade.exit_price = exit_price
    if "Long" in trade.strategy:
        trade.pnl = round((exit_price - trade.entry_price) * trade.quantity, 2)
    elif "Short" in trade.strategy:
        trade.pnl = round((trade.entry_price - exit_price) * trade.quantity, 2)
    else:
        trade.pnl = 0.0
        
    db.commit()
    db.refresh(trade)
    return trade