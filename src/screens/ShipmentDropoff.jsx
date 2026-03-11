import { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BarcodeScanner from '../components/BarcodeScanner.jsx'
import { recordDropoff } from '../sharepoint'
import { AuthContext } from '../App.jsx'

function ShipmentDropoff() {
  const [containerId, setContainerId] = useState('')
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
          <input
            className="text-input"
            type="text"
            placeholder="Scan or type container"
            value={containerId}
            onChange={(e) => setContainerId(e.target.value)}
          />
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
        />

        <div>
          <div className="field-label">Dropoff Location</div>
          <input
            className="text-input"
            type="text"
            placeholder="Scan or type dropoff location"
            value={dropoffLocation}
            onChange={(e) => setDropoffLocation(e.target.value)}
          />
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

