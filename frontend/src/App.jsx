import { useState, useEffect } from 'react'

function App() {
  const [backendMessage, setBackendMessage] = useState('Loading...')
  const [brokerStatus, setBrokerStatus] = useState(null)

  useEffect(() => {
    // Fetch basic backend status
    fetch('http://127.0.0.1:8000/')
      .then(response => response.json())
      .then(data => setBackendMessage(data.message))
      .catch(error => setBackendMessage('Error connecting to backend'))

    // Fetch the new Groww broker status
    fetch('http://127.0.0.1:8000/api/status')
      .then(response => response.json())
      .then(data => setBrokerStatus(data))
      .catch(error => console.error('Error fetching broker status:', error))
  }, [])

  return (
    <div style={{ backgroundColor: '#121212', color: '#ffffff', minHeight: '100vh', padding: '50px', fontFamily: 'sans-serif' }}>
      <h1>OptionAI Trading Terminal</h1>
      
      <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#1e1e1e', borderRadius: '8px', border: '1px solid #333' }}>
        <h2 style={{ marginTop: 0 }}>System Connection Status</h2>
        
        <p>Engine: <span style={{ color: backendMessage.includes('Error') ? '#ef4444' : '#4ade80', fontWeight: 'bold' }}>{backendMessage}</span></p>
        
        {brokerStatus && (
          <p>Broker API ({brokerStatus.broker}): 
            <span style={{ color: brokerStatus.configured ? '#4ade80' : '#fbbf24', marginLeft: '8px', fontWeight: 'bold' }}>
              {brokerStatus.configured ? 'Configured ✅' : 'Missing Credentials in .env ⚠️'}
            </span>
          </p>
        )}
      </div>
    </div>
  )
}

export default App