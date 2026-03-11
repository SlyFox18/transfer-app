# Transfer App

A Progressive Web App (PWA) for delivery drivers at South Plains Implement to record shipment pickups and dropoffs, replacing a prior Power Apps solution. Built on React + Vite, authenticated via Microsoft/Azure AD, and backed by a SharePoint list accessed through the Microsoft Graph API.

---

## What It Does

Drivers use this app on their phones to:

1. **Record a pickup** — scan or enter a container ID and pickup location, along with their name. Creates a new record in SharePoint with status `picked_up`.
2. **Record a dropoff** — scan or enter a container ID and dropoff location. Finds the matching open shipment in SharePoint and updates it to status `delivered`.
3. **View tracking** — see all active (non-delivered) shipments with driver name, pickup/dropoff locations, timestamps, and transit age. Overdue shipments (picked up > 4 hours ago) are highlighted in amber. Drivers can tap "Complete Dropoff" directly from a shipment row to pre-fill the dropoff screen.

The app is installable as a PWA on Android and iPhone — it gets added to the home screen and runs full-screen like a native app.

---

## Project Status

**Live and in use.** Deployed to Netlify, connected to the production SharePoint list.

### Working
- Microsoft sign-in (Azure AD / Microsoft Entra) with silent token refresh
- Pickup recording (create new SharePoint list item)
- Dropoff recording (find open record and PATCH, or create new if not found)
- Shipment tracking list with status pills, transit age, overdue flag
- QR code scanning via device camera
- Driver name persisted to `localStorage` between sessions
- Offline detection banner
- PWA manifest — installable on home screen

### Known Limitations / Deferred
- **Barcode scanning is QR-code only.** 1D barcode formats (Code128, etc.) are not yet enabled because enabling specific format lists caused silent initialization failures in the html5-qrcode library. Will revisit once the exact barcode symbology used by the parts department is confirmed.
- **Haptic feedback (vibration) is Android only.** The `navigator.vibrate` API is not supported on iOS Safari. This is a platform limitation, not a bug.
- **SharePoint list is capped at 500 items per query.** Sufficient for current volume, but will need pagination if the list grows very large without archiving delivered records.

### Planned / Future
- Power BI report on top of the SharePoint list data (shipment volume, driver performance, average transit times, overdue trends)
- 1D barcode support once format is confirmed
- Possibly: photo capture on dropoff for proof of delivery

---

## Architecture

```
Azure AD (Entra ID)
     │
     │  OAuth 2.0 / MSAL token
     ▼
React PWA (Vite)  ──────►  Microsoft Graph API  ──────►  SharePoint List
  Netlify CDN                /sites/.../lists/              "Shipment Tracking"
                             items  (REST)
```

### Data Flow
1. User signs in via Microsoft — MSAL handles the OAuth flow (redirect-based)
2. App silently acquires an access token with scopes `User.Read` and `Sites.ReadWrite.All`
3. All SharePoint operations go through Graph API calls using that bearer token
4. Site ID and List ID are resolved once per session and cached in module-level variables

### Key Files

```
src/
├── authConfig.js          # MSAL config, SharePoint site URL, list name, scopes
├── sharepoint.js          # All Graph API calls (getSiteAndListIds, getShipments, recordPickup, recordDropoff)
├── main.jsx               # MSAL initialization + React root mount
├── App.jsx                # AuthContext, tab navigation, route layout, sign-in/out logic
├── App.css                # All styles (dark navy theme, green accent, mobile-first)
└── screens/
│   ├── ShipmentPickup.jsx     # Pickup form (container, location, driver name, scanner)
│   ├── ShipmentDropoff.jsx    # Dropoff form (container, location, scanner, pre-fill from tracking)
│   └── ShipmentTracking.jsx   # Live shipment list (filters, overdue flag, complete dropoff button)
└── components/
    └── BarcodeScanner.jsx     # Camera-based QR scanner using html5-qrcode
```

---

## SharePoint List Schema

**List name:** `Shipment Tracking`
**Site:** `https://spitractor.sharepoint.com/sites/SouthPlainsImplement-ReportSite`

| Display Name      | Internal Field Name | Type     | Notes                                     |
|-------------------|---------------------|----------|-------------------------------------------|
| Title             | `Title`             | Text     | Container ID                              |
| Driver Name       | `field_10`          | Text     | Driver who performed the pickup           |
| Pickup Location   | `PickupLocation`    | Text     | Where the container was picked up from    |
| Dropoff Location  | `field_2`           | Text     | Where the container was delivered to      |
| Pickup Date       | `PickupDate`        | DateTime | ISO timestamp of pickup                   |
| Dropoff Date      | `DropoffDate`       | DateTime | ISO timestamp of delivery                 |
| Status            | `field_4`           | Number   | `1` = picked_up, `2` = delivered          |

> **Note:** Internal field names like `field_2`, `field_4`, `field_10` are assigned by SharePoint and cannot be changed after column creation. These are referenced directly in `sharepoint.js`.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + Vite 7 |
| PWA | vite-plugin-pwa (Workbox service worker) |
| Auth | @azure/msal-browser v5, @azure/msal-react v2 |
| Routing | React Router v7 |
| Barcode scanning | html5-qrcode |
| Backend | Microsoft Graph API → SharePoint List |
| Hosting | Netlify (free tier, GitHub-connected CI/CD) |

---

## Azure AD App Registration

**App:** South Plains Implement - Transfer App
**Tenant:** `8a02a2b8-0092-4de5-8f76-4700d099feb1`
**Client ID:** `2ebdf28d-b21e-4eec-803e-53354f68dada`
**Type:** Single-Page Application (SPA)

Required redirect URIs (both must be registered):
- `http://localhost:5173` (local development)
- `https://<your-netlify-domain>.netlify.app` (production)

Required API permissions:
- `User.Read` (delegated)
- `Sites.ReadWrite.All` (delegated)

---

## Local Development

### Prerequisites
- Node.js 18+
- Access to the SPI Microsoft 365 tenant (to authenticate and hit SharePoint)

### Setup

```bash
git clone <repo-url>
cd transfer-app
npm install
npm run dev
```

App runs at `http://localhost:5173`. Sign in with a Microsoft account that has access to the SharePoint site.

No `.env` file is needed — the MSAL config and SharePoint site URL are hardcoded in `src/authConfig.js` since they are not secrets (the OAuth flow is user-delegated, not service-account).

### Build

```bash
npm run build
```

Output goes to `dist/`. The PWA service worker and manifest are generated automatically by `vite-plugin-pwa`.

---

## Deployment (Netlify)

The app is deployed to Netlify and connected to this GitHub repository. Every push to `main` triggers an automatic deploy.

**Key configuration:**
- `public/_redirects` contains `/* /index.html 200` for SPA client-side routing
- Build command: `npm run build`
- Publish directory: `dist`

To deploy manually or connect a new Netlify site:
1. Push this repo to GitHub
2. Connect the repo in Netlify
3. Set build command to `npm run build` and publish directory to `dist`
4. Add the Netlify URL to the Azure AD app registration redirect URIs

---

## Notes for Future Power BI Report

The SharePoint list is the source of truth for all shipment activity. When building a Power BI report on top of this data:

- Connect via SharePoint Online connector or Graph API connector
- Key metrics to consider: shipment volume by driver, average transit time (DropoffDate - PickupDate), overdue rate (pickups > 4 hours without delivery), busiest pickup/dropoff locations
- Status field values: `1` = picked_up, `2` = delivered (no value / null = open, but the app always sets status on create)
- Records are never deleted — delivered records accumulate over time, giving a full historical dataset
