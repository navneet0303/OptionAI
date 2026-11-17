import { useState, useEffect } from 'react'

function App() {
  const [marketData, setMarketData] = useState(null)
  const [brokerStatus, setBrokerStatus] = useState(null)
  const [connectionError, setConnectionError] = useState(false)
  
  const [tradeForm, setTradeForm] = useState({
    underlying: 'NIFTY 50',
    strategy: 'Long Call',
    entry_price: '',
    quantity: 50,
    notes: ''
  })
  const [tradeStatus, setTradeStatus] = useState(null)
  const [tradeHistory, setTradeHistory] = useState([])

  const fetchSystemData = () => {
    fetch('http://127.0.0.1:8000/api/market-data')
      .then(response => {
        if (!response.ok) throw new Error("Network response was not ok")
        return response.json()
      })
      .then(data => {
        setMarketData(data)
        setConnectionError(false)
      })
      .catch(error => setConnectionError(true))

    fetch('http://127.0.0.1:8000/api/status')
      .then(response => response.json())
      .then(data => setBrokerStatus(data))
      .catch(error => console.error(error))
  }

  const fetchTrades = () => {
    fetch('http://127.0.0.1:8000/trades')
      .then(response => response.json())
      .then(data => setTradeHistory(data))
      .catch(error => console.error('Error fetching trades:', error))
  }

  useEffect(() => {
    fetchSystemData()
    fetchTrades()
    const intervalId = setInterval(fetchSystemData, 15000) // Slowed to 15s to prevent Yahoo Finance rate limits
    return () => clearInterval(intervalId)
  }, [])

  const formatNumber = (num) => {
    if (num === null || num === undefined) return '-'
    return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(num)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setTradeForm({
      ...tradeForm,
      [name]: name === 'entry_price' || name === 'quantity' ? Number(value) : value
    })
  }

  const submitTrade = (e) => {
    e.preventDefault()
    setTradeStatus('Submitting...')
    
    fetch('http://127.0.0.1:8000/trades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tradeForm)
    })
    .then(response => response.json())
    .then(data => {
      setTradeStatus('Trade saved successfully! ✅')
      setTradeForm({ ...tradeForm, entry_price: '', notes: '' })
      fetchTrades()
      setTimeout(() => setTradeStatus(null), 3000)
    })
    .catch(error => {
      setTradeStatus('Error saving trade ❌')
      console.error(error)
    })
  }

  const handleCloseTrade = (tradeId) => {
    const exitPriceStr = window.prompt("Enter your exit price:")
    if (!exitPriceStr) return 
    
    const exitPrice = parseFloat(exitPriceStr)
    if (isNaN(exitPrice)) {
      alert("Please enter a valid number.")
      return
    }

    fetch(`http://127.0.0.1:8000/trades/${tradeId}/close?exit_price=${exitPrice}`, {
      method: 'PUT',
    })
    .then(response => response.json())
    .then(data => {
      alert(`Trade closed successfully! P&L: ₹${data.pnl}`)
      fetchTrades() 
    })
    .catch(error => console.error('Error closing trade:', error))
  }

  // Analytics Metrics
  const closedTrades = tradeHistory.filter(t => t.exit_price !== null)
  const totalPnL = closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0)
  const winningTrades = closedTrades.filter(t => (t.pnl || 0) > 0).length
  const winRate = closedTrades.length > 0 ? Math.round((winningTrades / closedTrades.length) * 100) : 0

  // NEW: Basic Rule-Based AI Insight Generation
  const generateAIInsight = () => {
    if (!marketData || !marketData.indices["NIFTY 50"].rsi_14) return "Analyzing market structure..."
    
    const rsi = marketData.indices["NIFTY 50"].rsi_14
    const ltp = marketData.indices["NIFTY 50"].ltp
    const ema = marketData.indices["NIFTY 50"].ema_9

    let insight = ""
    if (rsi > 70) {
      insight = "🚨 NIFTY is currently OVERBOUGHT (RSI > 70). The upward momentum is stretched. Consider looking for Short/Put opportunities if price action shows rejection."
    } else if (rsi < 30) {
      insight = "🟢 NIFTY is currently OVERSOLD (RSI < 30). The downward momentum is stretched. Watch for a bounce or Long/Call setups upon reversal confirmation."
    } else {
      insight = `⚖️ NIFTY is in a NEUTRAL momentum zone (RSI: ${rsi}). Current price is ${ltp > ema ? 'above' : 'below'} the 9 EMA, indicating a short-term ${ltp > ema ? 'bullish' : 'bearish'} trend. Wait for high-probability setups at key support/resistance levels.`
    }
    return insight
  }

  return (
    <div style={{ backgroundColor: '#0b0e14', color: '#d1d5db', minHeight: '100vh', padding: '20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1f2937', paddingBottom: '15px', marginBottom: '20px' }}>
        <h1 style={{ color: '#ffffff', margin: 0, fontSize: '24px', letterSpacing: '1px' }}>OptionAI <span style={{ color: '#3b82f6' }}>Terminal</span></h1>
        <div style={{ display: 'flex', gap: '15px', fontSize: '14px' }}>
          <div style={{ backgroundColor: '#151b24', padding: '6px 12px', borderRadius: '4px', border: '1px solid #1f2937' }}>
            Broker: <span style={{ color: brokerStatus?.configured ? '#10b981' : '#fbbf24', fontWeight: 'bold' }}>{brokerStatus?.configured ? 'ACTIVE' : 'MISSING .ENV'}</span>
          </div>
          <div style={{ backgroundColor: '#151b24', padding: '6px 12px', borderRadius: '4px', border: '1px solid #1f2937' }}>
            Market: <span style={{ color: marketData?.market_status === 'OPEN' ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>{marketData ? marketData.market_status : 'LOADING'}</span>
          </div>
          <div style={{ backgroundColor: '#151b24', padding: '6px 12px', borderRadius: '4px', border: '1px solid #1f2937' }}>
            Engine: <span style={{ color: connectionError ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>{connectionError ? 'DISCONNECTED' : 'ONLINE'}</span>
          </div>
        </div>
      </div>

      {/* NEW: AI TRADING ASSISTANT PANEL */}
      <div style={{ backgroundColor: '#1e1b4b', padding: '20px', borderRadius: '8px', border: '1px solid #3730a3', marginBottom: '20px' }}>
        <h2 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#818cf8', display: 'flex', alignItems: 'center', gap: '8px' }}>
          ✨ AI Trade Assistant
        </h2>
        <p style={{ margin: 0, fontSize: '15px', color: '#c7d2fe', lineHeight: '1.5' }}>
          {generateAIInsight()}
        </p>
      </div>

      {/* MARKET OVERVIEW CARDS WITH TECHNICALS */}
      {marketData ? (
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '20px' }}>
          <div style={{ backgroundColor: '#151b24', padding: '20px', borderRadius: '8px', border: '1px solid #1f2937', flex: '1', minWidth: '250px' }}>
            <h2 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#9ca3af' }}>NIFTY 50</h2>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ffffff', marginBottom: '5px' }}>{formatNumber(marketData.indices["NIFTY 50"].ltp)}</div>
            <div style={{ display: 'flex', gap: '10px', fontSize: '15px', fontWeight: '500', color: marketData.indices["NIFTY 50"].change >= 0 ? '#10b981' : '#ef4444', marginBottom: '15px' }}>
              <span>{marketData.indices["NIFTY 50"].change >= 0 ? '+' : ''}{formatNumber(marketData.indices["NIFTY 50"].change)}</span>
            </div>
            {/* NEW: Technical Indicators Display */}
            <div style={{ display: 'flex', gap: '20px', borderTop: '1px solid #374151', paddingTop: '10px', fontSize: '13px', color: '#9ca3af' }}>
              <div>RSI (14): <span style={{ color: '#fff', fontWeight: 'bold' }}>{marketData.indices["NIFTY 50"].rsi_14 || '-'}</span></div>
              <div>EMA (9): <span style={{ color: '#fff', fontWeight: 'bold' }}>{marketData.indices["NIFTY 50"].ema_9 || '-'}</span></div>
            </div>
          </div>

          <div style={{ backgroundColor: '#151b24', padding: '20px', borderRadius: '8px', border: '1px solid #1f2937', flex: '1', minWidth: '250px' }}>
            <h2 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#9ca3af' }}>NIFTY BANK</h2>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ffffff', marginBottom: '5px' }}>{formatNumber(marketData.indices["NIFTY BANK"].ltp)}</div>
            <div style={{ display: 'flex', gap: '10px', fontSize: '15px', fontWeight: '500', color: marketData.indices["NIFTY BANK"].change >= 0 ? '#10b981' : '#ef4444', marginBottom: '15px' }}>
              <span>{marketData.indices["NIFTY BANK"].change >= 0 ? '+' : ''}{formatNumber(marketData.indices["NIFTY BANK"].change)}</span>
            </div>
            {/* NEW: Technical Indicators Display */}
            <div style={{ display: 'flex', gap: '20px', borderTop: '1px solid #374151', paddingTop: '10px', fontSize: '13px', color: '#9ca3af' }}>
              <div>RSI (14): <span style={{ color: '#fff', fontWeight: 'bold' }}>{marketData.indices["NIFTY BANK"].rsi_14 || '-'}</span></div>
              <div>EMA (9): <span style={{ color: '#fff', fontWeight: 'bold' }}>{marketData.indices["NIFTY BANK"].ema_9 || '-'}</span></div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '50px', color: '#6b7280' }}>Loading market data...</div>
      )}

      {/* TRADE ENTRY FORM AND LEDGER CONTAINER */}
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        
        {/* LEFT COLUMN: TRADE ENTRY FORM */}
        <div style={{ backgroundColor: '#151b24', padding: '25px', borderRadius: '8px', border: '1px solid #1f2937', flex: '1', minWidth: '350px' }}>
          <h2 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#ffffff', borderBottom: '1px solid #1f2937', paddingBottom: '10px' }}>Manual Trade Entry</h2>
          <form onSubmit={submitTrade} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '120px' }}>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px', color: '#9ca3af' }}>Underlying</label>
                <select name="underlying" value={tradeForm.underlying} onChange={handleInputChange} style={{ width: '100%', padding: '10px', backgroundColor: '#0b0e14', color: '#fff', border: '1px solid #374151', borderRadius: '4px' }}>
                  <option value="NIFTY 50">NIFTY 50</option>
                  <option value="NIFTY BANK">NIFTY BANK</option>
                </select>
              </div>
              <div style={{ flex: 1, minWidth: '120px' }}>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px', color: '#9ca3af' }}>Strategy</label>
                <select name="strategy" value={tradeForm.strategy} onChange={handleInputChange} style={{ width: '100%', padding: '10px', backgroundColor: '#0b0e14', color: '#fff', border: '1px solid #374151', borderRadius: '4px' }}>
                  <option value="Long Call">Long Call</option>
                  <option value="Long Put">Long Put</option>
                  <option value="Short Straddle">Short Straddle</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '120px' }}>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px', color: '#9ca3af' }}>Entry Price (₹)</label>
                <input type="number" step="0.05" required name="entry_price" value={tradeForm.entry_price} onChange={handleInputChange} style={{ width: '100%', padding: '10px', backgroundColor: '#0b0e14', color: '#fff', border: '1px solid #374151', borderRadius: '4px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ flex: 1, minWidth: '120px' }}>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px', color: '#9ca3af' }}>Quantity</label>
                <input type="number" required name="quantity" value={tradeForm.quantity} onChange={handleInputChange} style={{ width: '100%', padding: '10px', backgroundColor: '#0b0e14', color: '#fff', border: '1px solid #374151', borderRadius: '4px', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px', color: '#9ca3af' }}>Trade Notes</label>
              <input type="text" name="notes" value={tradeForm.notes} onChange={handleInputChange} placeholder="Why are you taking this trade?" style={{ width: '100%', padding: '10px', backgroundColor: '#0b0e14', color: '#fff', border: '1px solid #374151', borderRadius: '4px', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '10px' }}>
              <button type="submit" style={{ backgroundColor: '#3b82f6', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>Save Trade</button>
              {tradeStatus && <span style={{ color: tradeStatus.includes('Error') ? '#ef4444' : '#10b981', fontSize: '14px' }}>{tradeStatus}</span>}
            </div>
          </form>
        </div>

        {/* RIGHT COLUMN: TRADE LEDGER & ANALYTICS */}
        <div style={{ backgroundColor: '#151b24', padding: '25px', borderRadius: '8px', border: '1px solid #1f2937', flex: '2', minWidth: '400px', overflowX: 'auto' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1f2937', paddingBottom: '15px', marginBottom: '20px' }}>
            <h2 style={{ margin: '0', fontSize: '18px', color: '#ffffff' }}>Trade Ledger</h2>
            
            {/* Analytics Ribbon */}
            <div style={{ display: 'flex', gap: '15px', fontSize: '13px' }}>
              <div style={{ backgroundColor: '#0b0e14', padding: '6px 12px', borderRadius: '4px', border: '1px solid #374151' }}>
                Closed: <span style={{ color: '#fff', fontWeight: 'bold' }}>{closedTrades.length}</span>
              </div>
              <div style={{ backgroundColor: '#0b0e14', padding: '6px 12px', borderRadius: '4px', border: '1px solid #374151' }}>
                Win Rate: <span style={{ color: winRate >= 50 ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>{winRate}%</span>
              </div>
              <div style={{ backgroundColor: '#0b0e14', padding: '6px 12px', borderRadius: '4px', border: '1px solid #374151' }}>
                Net P&L: <span style={{ color: totalPnL >= 0 ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>{totalPnL >= 0 ? '+' : ''}₹{formatNumber(totalPnL)}</span>
              </div>
            </div>
          </div>
          
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ color: '#9ca3af', borderBottom: '1px solid #374151' }}>
                <th style={{ padding: '10px' }}>ID</th>
                <th style={{ padding: '10px' }}>Underlying</th>
                <th style={{ padding: '10px' }}>Strategy</th>
                <th style={{ padding: '10px' }}>Entry</th>
                <th style={{ padding: '10px' }}>Exit</th>
                <th style={{ padding: '10px' }}>P&L (₹)</th>
                <th style={{ padding: '10px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {tradeHistory.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>No trades recorded yet.</td>
                </tr>
              ) : (
                tradeHistory.map(trade => (
                  <tr key={trade.id} style={{ borderBottom: '1px solid #1f2937' }}>
                    <td style={{ padding: '10px', color: '#6b7280' }}>#{trade.id}</td>
                    <td style={{ padding: '10px', fontWeight: 'bold', color: '#fff' }}>{trade.underlying}</td>
                    <td style={{ padding: '10px' }}>
                      <span style={{ backgroundColor: trade.strategy.includes('Call') ? '#064e3b' : trade.strategy.includes('Put') ? '#7f1d1d' : '#4b5563', color: trade.strategy.includes('Call') ? '#34d399' : trade.strategy.includes('Put') ? '#f87171' : '#d1d5db', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>
                        {trade.strategy}
                      </span>
                    </td>
                    <td style={{ padding: '10px' }}>₹{formatNumber(trade.entry_price)}</td>
                    <td style={{ padding: '10px' }}>{trade.exit_price ? `₹${formatNumber(trade.exit_price)}` : '-'}</td>
                    <td style={{ padding: '10px', fontWeight: 'bold', color: trade.pnl > 0 ? '#10b981' : trade.pnl < 0 ? '#ef4444' : '#9ca3af' }}>
                      {trade.pnl !== null ? `${trade.pnl > 0 ? '+' : ''}${formatNumber(trade.pnl)}` : '-'}
                    </td>
                    <td style={{ padding: '10px' }}>
                      {trade.exit_price === null ? (
                        <button 
                          onClick={() => handleCloseTrade(trade.id)}
                          style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                          Close
                        </button>
                      ) : (
                        <span style={{ color: '#6b7280', fontSize: '12px' }}>Closed</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  )
}

export default App