import { useContext, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import BarcodeScanner from '../components/BarcodeScanner.jsx'
import { recordDropoff } from '../sharepoint'
import { AuthContext } from '../App.jsx'

function ShipmentDropoff() {
  const location = useLocation()
  const [containerId, setContainerId] = useState(
    () => location.state?.containerId || '',
  )
  const [dropoffLocation, setDropoffLocation] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const { accessToken } = useContext(AuthContext) || {}
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!containerId || !dropoffLocation) {
      setMessage('Container and dropoff location are required.')
      return
    }

    if (!accessToken) {
      setMessage('Missing access token. Please sign in again.')
      return
    }

    setSaving(true)
    setMessage('')
    try {
      await recordDropoff(accessToken, { containerId, dropoffLocation })
      setContainerId('')
      setDropoffLocation('')
      setMessage('Dropoff recorded. Going to Tracking...')
      setTimeout(() => navigate('/shipments'), 1500)
    } catch {
      setMessage('Could not record dropoff. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="screen-card">
      <div className="screen-heading">
        <h2 className="screen-title">Shipment Dropoff</h2>
        <span className="screen-meta">Scan container + dropoff location</span>
      </div>

      <form onSubmit={handleSubmit} className="form-grid">
        <div>
          <div className="field-label">Container ID</div>
          <div style={{ position: 'relative' }}>
            <input
              className="text-input"
              type="text"
              placeholder="Scan or type container"
              value={containerId}
              onChange={(e) => setContainerId(e.target.value)}
              style={containerId ? { paddingRight: '2.5rem' } : {}}
            />
            {containerId && (
              <button
                type="button"
                onClick={() => setContainerId('')}
                style={{
                  position: 'absolute',
                  right: '0.6rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#9ca3af',
                  fontSize: '1.1rem',
                  lineHeight: 1,
                  padding: '0.2rem',
                }}
              >
                ×
              </button>
            )}
          </div>
          {location.state?.containerId && (
            <p className="helper-text">
              Container pre-filled from tracking — scan or enter the dropoff
              location.
            </p>
          )}
        </div>

        <BarcodeScanner
          onScan={(value) => {
            if (!containerId) {
              setContainerId(value)
              setMessage('Container scanned.')
            } else {
              setDropoffLocation(value)
              setMessage('Dropoff location scanned.')
            }
          }}
          scanHint={
            !containerId
              ? 'Next scan \u2192 Container ID'
              : 'Next scan \u2192 Dropoff Location'
          }
        />

        <div>
          <div className="field-label">Dropoff Location</div>
          <div style={{ position: 'relative' }}>
            <input
              className="text-input"
              type="text"
              placeholder="Scan or type dropoff location"
              value={dropoffLocation}
              onChange={(e) => setDropoffLocation(e.target.value)}
              style={dropoffLocation ? { paddingRight: '2.5rem' } : {}}
            />
            {dropoffLocation && (
              <button
                type="button"
                onClick={() => setDropoffLocation('')}
                style={{
                  position: 'absolute',
                  right: '0.6rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#9ca3af',
                  fontSize: '1.1rem',
                  lineHeight: 1,
                  padding: '0.2rem',
                }}
              >
                ×
              </button>
            )}
          </div>
        </div>

        <button type="submit" className="primary-button" disabled={saving}>
          {saving ? 'Saving...' : 'Complete Delivery'}
        </button>

        {message && <p className="helper-text">{message}</p>}
      </form>
    </section>
  )
}

export default ShipmentDropoff

