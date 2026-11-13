import { useState, useEffect } from 'react'

function App() {
  const [marketData, setMarketData] = useState(null)
  const [brokerStatus, setBrokerStatus] = useState(null)
  const [connectionError, setConnectionError] = useState(false)
  
  // New state for the trade form
  const [tradeForm, setTradeForm] = useState({
    underlying: 'NIFTY 50',
    strategy: 'Long Call',
    entry_price: '',
    quantity: 50,
    notes: ''
  })
  const [tradeStatus, setTradeStatus] = useState(null)

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

  useEffect(() => {
    fetchSystemData()
    const intervalId = setInterval(fetchSystemData, 3000)
    return () => clearInterval(intervalId)
  }, [])

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(num)
  }

  // Handle Form Input Changes
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setTradeForm({
      ...tradeForm,
      [name]: name === 'entry_price' || name === 'quantity' ? Number(value) : value
    })
  }

  // Submit Trade to Database
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
      // Reset form fields after successful save
      setTradeForm({ ...tradeForm, entry_price: '', notes: '' })
      setTimeout(() => setTradeStatus(null), 3000) // Clear message after 3 seconds
    })
    .catch(error => {
      setTradeStatus('Error saving trade ❌')
      console.error(error)
    })
  }

  return (
    <div style={{ backgroundColor: '#0b0e14', color: '#d1d5db', minHeight: '100vh', padding: '20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1f2937', paddingBottom: '15px', marginBottom: '25px' }}>
        <h1 style={{ color: '#ffffff', margin: 0, fontSize: '24px', letterSpacing: '1px' }}>OptionAI <span style={{ color: '#3b82f6' }}>Terminal</span></h1>
        <div style={{ display: 'flex', gap: '15px', fontSize: '14px' }}>
          <div style={{ backgroundColor: '#151b24', padding: '6px 12px', borderRadius: '4px', border: '1px solid #1f2937' }}>
            Market: <span style={{ color: marketData?.market_status === 'OPEN' ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>{marketData ? marketData.market_status : 'LOADING'}</span>
          </div>
          <div style={{ backgroundColor: '#151b24', padding: '6px 12px', borderRadius: '4px', border: '1px solid #1f2937' }}>
            Engine: <span style={{ color: connectionError ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>{connectionError ? 'DISCONNECTED' : 'ONLINE'}</span>
          </div>
        </div>
      </div>

      {/* MARKET OVERVIEW CARDS */}
      {marketData ? (
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '30px' }}>
          {/* NIFTY 50 */}
          <div style={{ backgroundColor: '#151b24', padding: '20px', borderRadius: '8px', border: '1px solid #1f2937', flex: '1', minWidth: '250px' }}>
            <h2 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#9ca3af' }}>NIFTY 50</h2>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ffffff', marginBottom: '5px' }}>{formatNumber(marketData.indices["NIFTY 50"].ltp)}</div>
            <div style={{ display: 'flex', gap: '10px', fontSize: '15px', fontWeight: '500', color: marketData.indices["NIFTY 50"].change >= 0 ? '#10b981' : '#ef4444' }}>
              <span>{marketData.indices["NIFTY 50"].change >= 0 ? '+' : ''}{formatNumber(marketData.indices["NIFTY 50"].change)}</span>
            </div>
          </div>

          {/* NIFTY BANK */}
          <div style={{ backgroundColor: '#151b24', padding: '20px', borderRadius: '8px', border: '1px solid #1f2937', flex: '1', minWidth: '250px' }}>
            <h2 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#9ca3af' }}>NIFTY BANK</h2>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ffffff', marginBottom: '5px' }}>{formatNumber(marketData.indices["NIFTY BANK"].ltp)}</div>
            <div style={{ display: 'flex', gap: '10px', fontSize: '15px', fontWeight: '500', color: marketData.indices["NIFTY BANK"].change >= 0 ? '#10b981' : '#ef4444' }}>
              <span>{marketData.indices["NIFTY BANK"].change >= 0 ? '+' : ''}{formatNumber(marketData.indices["NIFTY BANK"].change)}</span>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '50px', color: '#6b7280' }}>Loading market data...</div>
      )}

      {/* NEW: TRADE ENTRY FORM */}
      <div style={{ backgroundColor: '#151b24', padding: '25px', borderRadius: '8px', border: '1px solid #1f2937', maxWidth: '800px' }}>
        <h2 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#ffffff', borderBottom: '1px solid #1f2937', paddingBottom: '10px' }}>Manual Trade Entry</h2>
        
        <form onSubmit={submitTrade} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
            
            <div style={{ flex: 1, minWidth: '150px' }}>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px', color: '#9ca3af' }}>Underlying</label>
              <select name="underlying" value={tradeForm.underlying} onChange={handleInputChange} style={{ width: '100%', padding: '10px', backgroundColor: '#0b0e14', color: '#fff', border: '1px solid #374151', borderRadius: '4px' }}>
                <option value="NIFTY 50">NIFTY 50</option>
                <option value="NIFTY BANK">NIFTY BANK</option>
              </select>
            </div>

            <div style={{ flex: 1, minWidth: '150px' }}>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px', color: '#9ca3af' }}>Strategy</label>
              <select name="strategy" value={tradeForm.strategy} onChange={handleInputChange} style={{ width: '100%', padding: '10px', backgroundColor: '#0b0e14', color: '#fff', border: '1px solid #374151', borderRadius: '4px' }}>
                <option value="Long Call">Long Call</option>
                <option value="Long Put">Long Put</option>
                <option value="Short Straddle">Short Straddle</option>
              </select>
            </div>

            <div style={{ flex: 1, minWidth: '150px' }}>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px', color: '#9ca3af' }}>Entry Price (₹)</label>
              <input type="number" step="0.05" required name="entry_price" value={tradeForm.entry_price} onChange={handleInputChange} style={{ width: '100%', padding: '10px', backgroundColor: '#0b0e14', color: '#fff', border: '1px solid #374151', borderRadius: '4px', boxSizing: 'border-box' }} />
            </div>

            <div style={{ flex: 1, minWidth: '150px' }}>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px', color: '#9ca3af' }}>Quantity</label>
              <input type="number" required name="quantity" value={tradeForm.quantity} onChange={handleInputChange} style={{ width: '100%', padding: '10px', backgroundColor: '#0b0e14', color: '#fff', border: '1px solid #374151', borderRadius: '4px', boxSizing: 'border-box' }} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px', color: '#9ca3af' }}>Trade Notes / Rationale</label>
            <input type="text" name="notes" value={tradeForm.notes} onChange={handleInputChange} placeholder="Why are you taking this trade?" style={{ width: '100%', padding: '10px', backgroundColor: '#0b0e14', color: '#fff', border: '1px solid #374151', borderRadius: '4px', boxSizing: 'border-box' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '10px' }}>
            <button type="submit" style={{ backgroundColor: '#3b82f6', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>
              Save Trade
            </button>
            {tradeStatus && <span style={{ color: tradeStatus.includes('Error') ? '#ef4444' : '#10b981', fontSize: '14px' }}>{tradeStatus}</span>}
          </div>
        </form>
      </div>

    </div>
  )
}

export default App