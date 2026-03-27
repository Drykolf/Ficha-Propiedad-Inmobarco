import { searchWasiProperties } from '~/server/utils/wasi-client'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const filters = body || {}

  try {
    return await searchWasiProperties(filters)
  }
  catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    throw createError({ statusCode: 502, statusMessage: 'Error al buscar propiedades en WASI' })
  }
})
