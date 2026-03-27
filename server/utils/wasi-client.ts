/**
 * Server-side WASI API client.
 * Runs on Nitro — no CORS, no fallbacks, credentials never reach the browser.
 */

export interface WasiPropertyImage {
  id: string
  url: string
  url_big: string
  url_original: string
  filename: string
  description: string
  position: number
}

export interface WasiPropertyGallery {
  id: string
  [key: string]: WasiPropertyImage | string
}

export interface WasiProperty {
  id_property: string
  title: string
  observations: string
  for_rent: string
  for_sale: string
  rent_price: number
  sale_price: number
  rent_price_label: string
  sale_price_label: string
  id_property_type: number
  stratum: number
  id_availability: number
  id_status_on_page: number
  bedrooms: number
  bathrooms: number
  area: number
  garages: number
  city_label: string
  zone_label: string
  municipio: string
  barrio: string
  map: string | { latitude: string; longitude: string }
  galleries: WasiPropertyGallery[]
  features: {
    internal: Array<{ id: string; nombre: string; name: string }>
    external: Array<{ id: string; nombre: string; name: string }>
  }
  clase_inmueble: string
  [key: string]: unknown
}

export async function fetchWasiProperty(propertyId: string): Promise<WasiProperty> {
  const config = useRuntimeConfig()
  const { apiUrl, apiToken, apiId } = config.wasi

  if (!apiToken || !apiId) {
    throw createError({ statusCode: 500, statusMessage: 'WASI API not configured' })
  }

  const url = `${apiUrl}/property/get/${propertyId}`

  const data = await $fetch<WasiProperty>(url, {
    params: {
      id_company: apiId,
      wasi_token: apiToken,
    },
    headers: {
      Accept: 'application/json',
    },
    timeout: 10000,
  })

  return data
}

export async function searchWasiProperties(filters: Record<string, string> = {}): Promise<unknown> {
  const config = useRuntimeConfig()
  const { apiUrl, apiToken, apiId } = config.wasi

  if (!apiToken || !apiId) {
    throw createError({ statusCode: 500, statusMessage: 'WASI API not configured' })
  }

  const url = `${apiUrl}/property/search`

  const data = await $fetch(url, {
    params: {
      id_company: apiId,
      wasi_token: apiToken,
      ...filters,
    },
    headers: {
      Accept: 'application/json',
    },
    timeout: 15000,
  })

  return data
}
