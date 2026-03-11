import { useContext, useEffect, useState } from 'react'
import { getShipments } from '../sharepoint'
import { AuthContext } from '../App.jsx'

function statusLabel(status) {
  if (status === 'picked_up') return 'Picked Up'
  if (status === 'delivered') return 'Delivered'
  return 'Open'
}

function statusClass(status) {
  if (status === 'picked_up') return 'status-pill status-pill-picked'
  if (status === 'delivered') return 'status-pill status-pill-delivered'
  return 'status-pill status-pill-open'
}

function formatTime(iso) {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

function ShipmentTracking() {
  const [shipments, setShipments] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { accessToken } = useContext(AuthContext) || {}

  const loadShipments = async () => {
    if (!accessToken) return
    setLoading(true)
    setError(null)
    try {
      const data = await getShipments(accessToken)
      setShipments(data)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadShipments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken])

  return (
    <section className="screen-card">
      <div className="screen-heading">
        <h2 className="screen-title">Active Shipments</h2>
        {!loading && !error && (
          <span className="screen-meta">
            {shipments.length ? `${shipments.length} total` : 'No records yet'}
          </span>
        )}
      </div>

      {loading ? (
        <p className="empty-state">Loading...</p>
      ) : error ? (
        <div className="empty-state">
          <p>Could not load shipments from SharePoint.</p>
          <button
            type="button"
            className="primary-button"
            style={{ marginTop: '0.75rem' }}
            onClick={loadShipments}
          >
            Retry
          </button>
        </div>
      ) : shipments.length === 0 ? (
        <p className="empty-state">
          New pickups and dropoffs will appear here as you scan them.
        </p>
      ) : (
        <div className="shipments-list">
          {shipments.map((s) => (
            <article key={s.id} className="shipment-row">
              <div className="shipment-row-header">
                <div>
                  <div className="shipment-label">Container</div>
                  <div className="shipment-value">{s.containerId}</div>
                </div>
                <span className={statusClass(s.status)}>
                  {statusLabel(s.status)}
                </span>
              </div>

              <div className="two-column">
                <div>
                  <div className="shipment-label">Pickup</div>
                  <div className="shipment-value">
                    {s.pickupLocation || '—'}
                  </div>
                </div>
                <div>
                  <div className="shipment-label">Dropoff</div>
                  <div className="shipment-value">
                    {s.dropoffLocation || '—'}
                  </div>
                </div>
              </div>

              <div className="shipment-meta">
                <span>
                  {s.driverName ? `Driver: ${s.driverName}` : 'Unassigned'}
                </span>
                <span>
                  {s.dropoffTime
                    ? `Done ${formatTime(s.dropoffTime)}`
                    : s.pickupTime
                    ? `Picked ${formatTime(s.pickupTime)}`
                    : ''}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

export default ShipmentTracking

