import { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BarcodeScanner from '../components/BarcodeScanner.jsx'
import { recordPickup } from '../sharepoint'
import { AuthContext } from '../App.jsx'

function ShipmentPickup() {
  const [containerId, setContainerId] = useState('')
  const [pickupLocation, setPickupLocation] = useState('')
  const [driverName, setDriverName] = useState(
    () => localStorage.getItem('transfer_app_driver') || '',
  )
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const { accessToken } = useContext(AuthContext) || {}
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!containerId || !pickupLocation || !driverName) {
      setMessage('Container, pickup location, and driver name are required.')
      return
    }

    if (!accessToken) {
      setMessage('Missing access token. Please sign in again.')
      return
    }

    setSaving(true)
    setMessage('')
    try {
      await recordPickup(accessToken, { containerId, pickupLocation, driverName })
      localStorage.setItem('transfer_app_driver', driverName)
      setContainerId('')
      setPickupLocation('')
      setMessage('success')
    } catch {
      setMessage('Could not record pickup. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="screen-card">
      <div className="screen-heading">
        <h2 className="screen-title">Shipment Pickup</h2>
        <span className="screen-meta">Scan container + pickup location</span>
      </div>

      <form onSubmit={handleSubmit} className="form-grid">
        <div>
          <div className="field-label">Driver Name</div>
          <input
            className="text-input"
            type="text"
            placeholder="Who is picking up?"
            value={driverName}
            onChange={(e) => setDriverName(e.target.value)}
          />
          {!driverName && (
            <p className="helper-text" style={{ marginTop: '0.25rem' }}>
              Enter your name once — it will be saved for next time.
            </p>
          )}
        </div>

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
        </div>

        <BarcodeScanner
          onScan={(value) => {
            if (!containerId) {
              setContainerId(value)
              setMessage('Container scanned.')
            } else {
              setPickupLocation(value)
              setMessage('Pickup location scanned.')
            }
          }}
          scanHint={
            !containerId
              ? 'Next scan \u2192 Container ID'
              : 'Next scan \u2192 Pickup Location'
          }
        />

        <div>
          <div className="field-label">Pickup Location</div>
          <div style={{ position: 'relative' }}>
            <input
              className="text-input"
              type="text"
              placeholder="Scan or type pickup location"
              value={pickupLocation}
              onChange={(e) => setPickupLocation(e.target.value)}
              style={pickupLocation ? { paddingRight: '2.5rem' } : {}}
            />
            {pickupLocation && (
              <button
                type="button"
                onClick={() => setPickupLocation('')}
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
          {saving ? 'Saving...' : 'Record Pickup'}
        </button>

        {message === 'success' && (
          <div className="success-banner">✓ Pickup recorded!</div>
        )}
        {message && message !== 'success' && (
          <p className="helper-text">{message}</p>
        )}
      </form>
    </section>
  )
}

export default ShipmentPickup

