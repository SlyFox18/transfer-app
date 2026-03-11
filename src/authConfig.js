export const msalConfig = {
  auth: {
    clientId: '2ebdf28d-b21e-4eec-803e-53354f68dada',
    authority:
      'https://login.microsoftonline.com/8a02a2b8-0092-4de5-8f76-4700d099feb1',
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: true,
  },
}

export const loginRequest = {
  scopes: ['User.Read', 'Sites.ReadWrite.All'],
}

export const SHAREPOINT_SITE =
  'https://spitractor.sharepoint.com/sites/SouthPlainsImplement-ReportSite'
export const LIST_NAME = 'Shipment Tracking'
