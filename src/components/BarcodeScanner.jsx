import { useEffect, useRef, useState } from 'react'
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode'

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
      qrbox: { width: 280, height: 120 },
      aspectRatio: 1.5,
      formatsToSupport: [
        Html5QrcodeSupportedFormats.QR_CODE,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
      ],
    }

    const scanner = new Html5QrcodeScanner(containerId, config, false)

    scanner.render(
      (decodedText) => {
        onScan?.(decodedText)
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

