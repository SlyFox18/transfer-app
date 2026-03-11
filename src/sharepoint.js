import { LIST_NAME, SHAREPOINT_SITE } from './authConfig'

const GRAPH_BASE_URL = 'https://graph.microsoft.com/v1.0'

let cachedSiteId = null
let cachedListId = null

async function graphRequest(path, accessToken, options = {}) {
  const response = await fetch(`${GRAPH_BASE_URL}${path}`, {
    method: options.method || 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    const error = new Error(
      `Graph request failed: ${response.status} ${response.statusText}`,
    )
    error.status = response.status
    error.responseText = text
    throw error
  }

  if (response.status === 204) return null
  return response.json()
}

export async function getSiteAndListIds(accessToken) {
  if (cachedSiteId && cachedListId) {
    return { siteId: cachedSiteId, listId: cachedListId }
  }

  const url = new URL(SHAREPOINT_SITE)
  const hostname = url.hostname
  const pathname = url.pathname

  const site = await graphRequest(
    `/sites/${hostname}:${pathname}`,
    accessToken,
  )

  const siteId = site.id

  const lists = await graphRequest(
    `/sites/${siteId}/lists?$filter=displayName eq '${LIST_NAME}'`,
    accessToken,
  )

  const list = lists.value?.[0]

  if (!list) {
    throw new Error(`List '${LIST_NAME}' not found on site.`)
  }

  cachedSiteId = siteId
  cachedListId = list.id

  return { siteId, listId: list.id }
}

function mapStatus(field4) {
  if (field4 === 1) return 'picked_up'
  if (field4 === 2) return 'delivered'
  return 'open'
}

export async function getShipments(accessToken) {
  const { siteId, listId } = await getSiteAndListIds(accessToken)

  const data = await graphRequest(
    `/sites/${siteId}/lists/${listId}/items?$expand=fields&$orderby=createdDateTime desc&$top=500`,
    accessToken,
  )

  const items = data.value || []

  return items.map((item) => {
    const fields = item.fields || {}

    return {
      id: item.id,
      spItemId: item.id,
      containerId: fields.Title || '',
      driverName: fields.field_10 || '',
      pickupLocation: fields.PickupLocation || '',
      dropoffLocation: fields.field_2 || '',
      pickupTime: fields.PickupDate || null,
      dropoffTime: fields.DropoffDate || null,
      status: mapStatus(fields.field_4),
    }
  })
}

export async function recordPickup(
  accessToken,
  { containerId, pickupLocation, driverName },
) {
  const { siteId, listId } = await getSiteAndListIds(accessToken)
  const now = new Date().toISOString()

  const body = {
    fields: {
      Title: containerId,
      field_10: driverName,
      PickupLocation: pickupLocation,
      PickupDate: now,
      field_4: 1,
    },
  }

  return graphRequest(
    `/sites/${siteId}/lists/${listId}/items`,
    accessToken,
    {
      method: 'POST',
      body,
    },
  )
}

export async function recordDropoff(
  accessToken,
  { containerId, dropoffLocation },
) {
  const { siteId, listId } = await getSiteAndListIds(accessToken)
  const data = await graphRequest(
    `/sites/${siteId}/lists/${listId}/items?$expand=fields&$orderby=createdDateTime desc&$top=50`,
    accessToken,
  )

  const items = data.value || []

  const match = items.find((item) => {
    const fields = item.fields || {}
    const status = fields.field_4
    return fields.Title === containerId && status !== 2
  })

  const now = new Date().toISOString()

  if (!match) {
    const body = {
      fields: {
        Title: containerId,
        field_2: dropoffLocation,
        DropoffDate: now,
        field_4: 2,
      },
    }

      return graphRequest(
      `/sites/${siteId}/lists/${listId}/items`,
      accessToken,
      {
        method: 'POST',
        body,
      },
    )
  }

  const updateBody = {
    field_2: dropoffLocation,
    DropoffDate: now,
    field_4: 2,
  }

  return graphRequest(
    `/sites/${siteId}/lists/${listId}/items/${match.id}/fields`,
    accessToken,
    {
      method: 'PATCH',
      body: updateBody,
    },
  )
}

