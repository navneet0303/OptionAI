from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# What React sends to Python
class TradeCreate(BaseModel):
    underlying: str
    strategy: str
    entry_price: float
    quantity: int
    notes: Optional[str] = None

# What Python sends back to React
class TradeResponse(TradeCreate):
    id: int
    trade_date: datetime
    exit_price: Optional[float] = None
    pnl: Optional[float] = None

    class Config:
        from_attributes = True