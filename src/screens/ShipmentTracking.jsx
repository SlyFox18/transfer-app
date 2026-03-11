import { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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

function formatDateTime(iso) {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    const now = new Date()
    const isToday =
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    if (isToday) return `Today ${time}`
    const date = d.toLocaleDateString([], { month: 'short', day: 'numeric' })
    return `${date} ${time}`
  } catch {
    return ''
  }
}

function ShipmentTracking() {
  const [shipments, setShipments] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [activeOnly, setActiveOnly] = useState(true)
  const [mineOnly, setMineOnly] = useState(false)
  const { accessToken } = useContext(AuthContext) || {}
  const navigate = useNavigate()
  const myName = localStorage.getItem('transfer_app_driver') || ''

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

  const filtered = shipments
    .filter((s) => !activeOnly || s.status !== 'delivered')
    .filter((s) => !mineOnly || !myName || s.driverName === myName)

  return (
    <section className="screen-card">
      <div className="screen-heading">
        <h2 className="screen-title">Shipments</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {!loading && !error && (
            <span className="screen-meta">
              {filtered.length} {activeOnly ? 'active' : 'total'}
            </span>
          )}
          <button
            type="button"
            className="secondary-button-ghost"
            style={{ padding: '0.2rem 0.6rem', fontSize: 12 }}
            onClick={() => setActiveOnly((v) => !v)}
          >
            {activeOnly ? 'Show All' : 'Active Only'}
          </button>
          {myName && (
            <button
              type="button"
              className="secondary-button-ghost"
              style={{ padding: '0.2rem 0.6rem', fontSize: 12 }}
              onClick={() => setMineOnly((v) => !v)}
            >
              {mineOnly ? 'All Drivers' : 'Mine Only'}
            </button>
          )}
          <button
            type="button"
            className="secondary-button-ghost"
            style={{ padding: '0.2rem 0.6rem', fontSize: 12 }}
            onClick={loadShipments}
            disabled={loading}
          >
            {loading ? '…' : 'Refresh'}
          </button>
        </div>
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
      ) : filtered.length === 0 ? (
        <p className="empty-state">
          {activeOnly
            ? 'No active shipments. Tap "Show All" to see delivered ones.'
            : 'No shipments recorded yet.'}
        </p>
      ) : (
        <div className="shipments-list">
          {filtered.map((s) => {
            const isPickedUp = s.status === 'picked_up'
            return (
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
                    ? `Done ${formatDateTime(s.dropoffTime)}`
                    : s.pickupTime
                    ? `Picked ${formatDateTime(s.pickupTime)}`
                    : ''}
                </span>
              </div>
              {isPickedUp && (
                <button
                  type="button"
                  className="complete-dropoff-button"
                  onClick={() =>
                    navigate('/dropoff', {
                      state: { containerId: s.containerId },
                    })
                  }
                >
                  Complete Dropoff
                </button>
              )}
            </article>
            )
          })}
        </div>
      )}
    </section>
  )
}

export default ShipmentTracking

