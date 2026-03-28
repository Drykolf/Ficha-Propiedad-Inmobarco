import { fetchWasiProperty } from '~/server/utils/wasi-client'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Property ID is required' })
  }

  // If encrypted, decrypt server-side
  let propertyId = id
  if (isEncryptedId(id)) {
    const config = useRuntimeConfig()
    const decrypted = decryptPropertyId(id, config.encryption.key, config.encryption.salt)
    if (!decrypted) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid encrypted property ID' })
    }
    propertyId = decrypted
  }

  try {
    const property = await fetchWasiProperty(propertyId)

    // Validate property is active
    if (
      parseInt(String(property.id_availability)) !== 1
      || ![1, 3].includes(parseInt(String(property.id_status_on_page)))
    ) {
      throw createError({ statusCode: 404, statusMessage: 'La propiedad no esta disponible', data: { propertyId } })
    }

    return property
  }
  catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    throw createError({ statusCode: 502, statusMessage: 'Error al obtener datos de WASI' })
  }
})
