import { useContext, useState } from 'react'
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
      setMessage('Pickup recorded.')
      localStorage.setItem('transfer_app_driver', driverName)
      setContainerId('')
      setPickupLocation('')
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
        </div>

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
              setPickupLocation(value)
              setMessage('Pickup location scanned.')
            }
          }}
        />

        <div>
          <div className="field-label">Pickup Location</div>
          <input
            className="text-input"
            type="text"
            placeholder="Scan or type pickup location"
            value={pickupLocation}
            onChange={(e) => setPickupLocation(e.target.value)}
          />
        </div>

        <button type="submit" className="primary-button" disabled={saving}>
          {saving ? 'Saving...' : 'Record Pickup'}
        </button>

        {message && <p className="helper-text">{message}</p>}
      </form>
    </section>
  )
}

export default ShipmentPickup

