import {
  NavLink,
  Route,
  Routes,
  Navigate,
  useLocation,
} from 'react-router-dom'
import { createContext, useEffect, useMemo, useState } from 'react'
import { useIsAuthenticated, useMsal } from '@azure/msal-react'
import './App.css'
import ShipmentTracking from './screens/ShipmentTracking.jsx'
import ShipmentPickup from './screens/ShipmentPickup.jsx'
import ShipmentDropoff from './screens/ShipmentDropoff.jsx'
import { loginRequest } from './authConfig'

export const AuthContext = createContext(null)

function AppShell({ children, onSignOut, isOffline }) {
  const location = useLocation()

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-brand">
          <img
            src="/spi-logo.png"
            alt="South Plains Implement"
            className="app-logo"
          />
          <p className="app-subtitle">Transfer App</p>
        </div>
      </header>

      {isOffline && (
        <div className="offline-banner">
          No internet connection — changes won't save until you're back online.
        </div>
      )}

      <nav className="tab-nav">
        <NavLink
          to="/shipments"
          className={({ isActive }) =>
            `tab-link ${isActive ? 'tab-link-active' : ''}`
          }
        >
          Tracking
        </NavLink>
        <NavLink
          to="/pickup"
          className={({ isActive }) =>
            `tab-link ${isActive ? 'tab-link-active' : ''}`
          }
        >
          Pickup
        </NavLink>
        <NavLink
          to="/dropoff"
          className={({ isActive }) =>
            `tab-link ${isActive ? 'tab-link-active' : ''}`
          }
        >
          Dropoff
        </NavLink>
      </nav>

      <main className="app-main" key={location.pathname}>
        {children}
      </main>
      <footer className="app-footer">
        <button
          type="button"
          className="sign-out-button"
          onClick={onSignOut}
        >
          Sign out
        </button>
      </footer>
    </div>
  )
}

function App() {
  const { instance, accounts } = useMsal()
  const isAuthenticated = useIsAuthenticated()
  const [accessToken, setAccessToken] = useState(null)
  const [tokenError, setTokenError] = useState(null)
  const [isOffline, setIsOffline] = useState(!navigator.onLine)

  useEffect(() => {
    const goOffline = () => setIsOffline(true)
    const goOnline = () => setIsOffline(false)
    window.addEventListener('offline', goOffline)
    window.addEventListener('online', goOnline)
    return () => {
      window.removeEventListener('offline', goOffline)
      window.removeEventListener('online', goOnline)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function fetchToken() {
      if (!isAuthenticated || accounts.length === 0) {
        setAccessToken(null)
        return
      }

      try {
        const response = await instance.acquireTokenSilent({
          ...loginRequest,
          account: accounts[0],
        })
        if (!cancelled) {
          setAccessToken(response.accessToken)
          setTokenError(null)
        }
      } catch (error) {
        if (!cancelled) {
          setTokenError(error)
          setAccessToken(null)
        }
      }
    }

    fetchToken()

    return () => {
      cancelled = true
    }
  }, [instance, accounts, isAuthenticated])

  const authContextValue = useMemo(
    () => ({
      accessToken,
    }),
    [accessToken],
  )

  const handleSignIn = () => {
    instance.loginRedirect(loginRequest)
  }

  const handleSignOut = () => {
    if (accounts[0]) {
      instance.logoutRedirect({ account: accounts[0] })
    } else {
      instance.logoutRedirect()
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="app-shell">
        <header className="app-header">
          <div className="app-header-brand">
            <img
              src="/spi-logo.png"
              alt="South Plains Implement"
              className="app-logo"
            />
            <p className="app-subtitle">Transfer App</p>
          </div>
        </header>
        <main className="app-main">
          <section className="screen-card" style={{ textAlign: 'center' }}>
            <h2 className="screen-title">Sign in required</h2>
            <p className="screen-meta">
              Use your Microsoft account to access shipment tracking.
            </p>
            <button
              type="button"
              className="primary-button"
              style={{ marginTop: '1.5rem' }}
              onClick={handleSignIn}
            >
              Sign in with Microsoft
            </button>
          </section>
        </main>
      </div>
    )
  }

  if (!accessToken && !tokenError) {
    return (
      <div className="app-shell">
        <header className="app-header">
          <div className="app-header-brand">
            <img
              src="/spi-logo.png"
              alt="South Plains Implement"
              className="app-logo"
            />
            <p className="app-subtitle">Transfer App</p>
          </div>
        </header>
        <main className="app-main">
          <section className="screen-card" style={{ textAlign: 'center' }}>
            <h2 className="screen-title">Loading...</h2>
            <p className="screen-meta">
              Preparing your session with Microsoft 365.
            </p>
          </section>
        </main>
      </div>
    )
  }

  if (!accessToken && tokenError) {
    return (
      <div className="app-shell">
        <header className="app-header">
          <div className="app-header-brand">
            <img
              src="/spi-logo.png"
              alt="South Plains Implement"
              className="app-logo"
            />
            <p className="app-subtitle">Transfer App</p>
          </div>
        </header>
        <main className="app-main">
          <section className="screen-card" style={{ textAlign: 'center' }}>
            <h2 className="screen-title">Authentication error</h2>
            <p className="screen-meta">
              We could not get an access token. Please try signing in again.
            </p>
            <button
              type="button"
              className="primary-button"
              style={{ marginTop: '1.5rem' }}
              onClick={handleSignIn}
            >
              Sign in with Microsoft
            </button>
          </section>
        </main>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={authContextValue}>
      <AppShell onSignOut={handleSignOut} isOffline={isOffline}>
        <Routes>
          <Route path="/" element={<Navigate to="/shipments" replace />} />
          <Route path="/shipments" element={<ShipmentTracking />} />
          <Route path="/pickup" element={<ShipmentPickup />} />
          <Route path="/dropoff" element={<ShipmentDropoff />} />
          <Route path="*" element={<Navigate to="/shipments" replace />} />
        </Routes>
      </AppShell>
    </AuthContext.Provider>
  )
}

export default App
