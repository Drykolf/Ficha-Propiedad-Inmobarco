/**
 * Server-side image proxy for downloading WASI property images without CORS issues.
 * Used by the ZIP download feature.
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const imageUrl = query.url as string

  if (!imageUrl) {
    throw createError({ statusCode: 400, statusMessage: 'Image URL is required' })
  }

  try {
    const response = await $fetch.raw(imageUrl, {
      responseType: 'arrayBuffer',
      timeout: 15000,
    })

    const contentType = response.headers.get('content-type') || 'image/jpeg'

    setResponseHeaders(event, {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400',
    })

    return response._data
  }
  catch {
    throw createError({ statusCode: 502, statusMessage: 'Failed to fetch image' })
  }
})
