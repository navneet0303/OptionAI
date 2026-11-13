from sqlalchemy import Column, Integer, String, Float, DateTime
from datetime import datetime
from database import Base

class TradeRecord(Base):
    __tablename__ = "trades"

    id = Column(Integer, primary_key=True, index=True)
    trade_date = Column(DateTime, default=datetime.utcnow)
    underlying = Column(String, index=True)
    strategy = Column(String)
    entry_price = Column(Float)
    exit_price = Column(Float, nullable=True)
    quantity = Column(Integer)
    pnl = Column(Float, nullable=True)
    notes = Column(String, nullable=True)