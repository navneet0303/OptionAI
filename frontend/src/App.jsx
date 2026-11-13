import { useState, useEffect } from 'react'

function App() {
  const [marketData, setMarketData] = useState(null)
  const [brokerStatus, setBrokerStatus] = useState(null)
  const [connectionError, setConnectionError] = useState(false)

  const fetchSystemData = () => {
    // Fetch live market data
    fetch('http://127.0.0.1:8000/api/market-data')
      .then(response => {
        if (!response.ok) throw new Error("Network response was not ok")
        return response.json()
      })
      .then(data => {
        setMarketData(data)
        setConnectionError(false)
      })
      .catch(error => {
        console.error('Market data error:', error)
        setConnectionError(true)
      })

    // Fetch broker configuration status
    fetch('http://127.0.0.1:8000/api/status')
      .then(response => response.json())
      .then(data => setBrokerStatus(data))
      .catch(error => console.error('Broker status error:', error))
  }

  useEffect(() => {
    fetchSystemData() // Initial fetch
    
    // Set up auto-refresh every 3 seconds for live data simulation
    const intervalId = setInterval(fetchSystemData, 3000)
    
    // Clean up the interval when the component unmounts
    return () => clearInterval(intervalId)
  }, [])

  // Helper function to format numbers with commas (e.g., 22,100.50)
  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(num)
  }

  return (
    <div style={{ backgroundColor: '#0b0e14', color: '#d1d5db', minHeight: '100vh', padding: '20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1f2937', paddingBottom: '15px', marginBottom: '25px' }}>
        <h1 style={{ color: '#ffffff', margin: 0, fontSize: '24px', letterSpacing: '1px' }}>OptionAI <span style={{ color: '#3b82f6' }}>Terminal</span></h1>
        
        <div style={{ display: 'flex', gap: '15px', fontSize: '14px' }}>
          {/* Market Status Indicator */}
          <div style={{ backgroundColor: '#151b24', padding: '6px 12px', borderRadius: '4px', border: '1px solid #1f2937' }}>
            Market: <span style={{ color: marketData?.market_status === 'OPEN' ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>
              {marketData ? marketData.market_status : 'LOADING'}
            </span>
          </div>
          
          {/* Connection Status Indicator */}
          <div style={{ backgroundColor: '#151b24', padding: '6px 12px', borderRadius: '4px', border: '1px solid #1f2937' }}>
            Engine: <span style={{ color: connectionError ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>
              {connectionError ? 'DISCONNECTED' : 'ONLINE'}
            </span>
          </div>
        </div>
      </div>

      {/* WARNING BANNER FOR DEMO DATA */}
      {marketData?.is_demo_data && (
        <div style={{ backgroundColor: '#3f2c00', color: '#fbbf24', padding: '10px 15px', borderRadius: '6px', marginBottom: '25px', fontSize: '14px', border: '1px solid #78350f', display: 'flex', justifyContent: 'space-between' }}>
          <strong>⚠️ SIMULATED DEMO DATA:</strong> Do not use these prices for real trading. Connect real Groww credentials in .env for live data.
          <span>{marketData.timestamp}</span>
        </div>
      )}

      {/* MARKET OVERVIEW CARDS */}
      {marketData ? (
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          
          {/* NIFTY 50 Card */}
          <div style={{ backgroundColor: '#151b24', padding: '20px', borderRadius: '8px', border: '1px solid #1f2937', flex: '1', minWidth: '250px' }}>
            <h2 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#9ca3af' }}>NIFTY 50</h2>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ffffff', marginBottom: '5px' }}>
              {formatNumber(marketData.indices["NIFTY 50"].ltp)}
            </div>
            <div style={{ display: 'flex', gap: '10px', fontSize: '15px', fontWeight: '500', color: marketData.indices["NIFTY 50"].change >= 0 ? '#10b981' : '#ef4444' }}>
              <span>{marketData.indices["NIFTY 50"].change >= 0 ? '+' : ''}{formatNumber(marketData.indices["NIFTY 50"].change)}</span>
              <span>({marketData.indices["NIFTY 50"].change >= 0 ? '+' : ''}{marketData.indices["NIFTY 50"].percent_change}%)</span>
            </div>
          </div>

          {/* BANKNIFTY Card */}
          <div style={{ backgroundColor: '#151b24', padding: '20px', borderRadius: '8px', border: '1px solid #1f2937', flex: '1', minWidth: '250px' }}>
            <h2 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#9ca3af' }}>NIFTY BANK</h2>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ffffff', marginBottom: '5px' }}>
              {formatNumber(marketData.indices["NIFTY BANK"].ltp)}
            </div>
            <div style={{ display: 'flex', gap: '10px', fontSize: '15px', fontWeight: '500', color: marketData.indices["NIFTY BANK"].change >= 0 ? '#10b981' : '#ef4444' }}>
              <span>{marketData.indices["NIFTY BANK"].change >= 0 ? '+' : ''}{formatNumber(marketData.indices["NIFTY BANK"].change)}</span>
              <span>({marketData.indices["NIFTY BANK"].change >= 0 ? '+' : ''}{marketData.indices["NIFTY BANK"].percent_change}%)</span>
            </div>
          </div>

          {/* VIX & Broker Card */}
          <div style={{ backgroundColor: '#151b24', padding: '20px', borderRadius: '8px', border: '1px solid #1f2937', flex: '1', minWidth: '250px' }}>
            <h2 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#9ca3af' }}>Market Volatility</h2>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <span style={{ fontSize: '20px', color: '#ffffff' }}>India VIX</span>
              <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>{marketData.india_vix}</span>
            </div>
            <div style={{ borderTop: '1px solid #1f2937', paddingTop: '15px', fontSize: '14px' }}>
              Broker API: <span style={{ color: brokerStatus?.configured ? '#10b981' : '#fbbf24', float: 'right' }}>
                {brokerStatus?.configured ? 'Active' : 'Missing Credentials'}
              </span>
            </div>
          </div>

        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '50px', color: '#6b7280' }}>
          {connectionError ? 'Failed to load market data. Is the backend running?' : 'Loading market data...'}
        </div>
      )}

    </div>
  )
}

export default App