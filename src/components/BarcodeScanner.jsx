import { useEffect, useRef, useState } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'

function BarcodeScanner({ onScan }) {
  const [active, setActive] = useState(false)
  const scannerRef = useRef(null)
  const containerId = 'transfer-app-scanner'

  useEffect(() => {
    if (!active) {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {})
        scannerRef.current = null
      }
      return
    }

    const config = {
      fps: 10,
      qrbox: { width: 240, height: 240 },
      aspectRatio: 1,
    }

    const scanner = new Html5QrcodeScanner(containerId, config, false)

    scanner.render(
      (decodedText) => {
        onScan?.(decodedText)
        navigator.vibrate?.(60)
        setActive(false)
      },
      () => {
        // ignore scan failure, will retry automatically
      },
    )

    scannerRef.current = scanner

    return () => {
      scanner.clear().catch(() => {})
      scannerRef.current = null
    }
  }, [active, onScan])

  return (
    <div className="scanner-container">
      <button
        type="button"
        className={active ? 'secondary-button' : 'secondary-button-ghost'}
        onClick={() => setActive((prev) => !prev)}
      >
        {active ? 'Stop Camera' : 'Scan Barcode'}
      </button>

      {active && (
        <div className="scanner-preview">
          <div id={containerId} />
        </div>
      )}

      {!active && (
        <p className="helper-text">
          Tap <span className="inline-code">Scan Barcode</span> to activate the
          camera. Point at the container or location code.
        </p>
      )}
    </div>
  )
}

export default BarcodeScanner

