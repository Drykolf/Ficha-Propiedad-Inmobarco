<template>
  <div>
    <PropertyHeader />

    <div class="container">
      <!-- Loading -->
      <div v-if="status === 'pending'" class="loading">
        Cargando detalles de la propiedad...
      </div>

      <!-- Error -->
      <div v-else-if="error" class="error" style="display: block;">
        {{ errorMessage }}
      </div>

      <!-- Property content -->
      <div v-else-if="property" id="property-content" style="display: block;">
        <div class="property-layout">
          <PropertyGallery
            ref="galleryRef"
            :galleries="property.galleries || []"
            :alt-text="`${property.clase_inmueble || 'Inmueble'} en ${property.municipio || ''}`"
            @download="downloadPhotos"
          />

          <div class="property-main">
            <div class="property-content">
              <div class="property-info">
                <h1 class="property-title">{{ property.title || 'Propiedad' }}</h1>

                <div v-if="property.for_rent === 'true'" class="property-price">
                  <span class="price-label">Precio Arriendo</span>
                  {{ property.rent_price_label }}
                </div>
                <div v-if="property.for_sale === 'true'" class="property-price">
                  <span class="price-label">Precio Venta</span>
                  {{ property.sale_price_label }}
                </div>

                <div class="property-badges">
                  <span class="property-badge type">{{ propertyTypeLabel }}</span>
                  <span v-if="property.for_rent === 'true'" class="property-badge primary">Arriendo</span>
                  <span v-if="property.for_sale === 'true'" class="property-badge primary">Venta</span>
                  <span v-if="property.stratum" class="property-badge">Estrato {{ property.stratum }}</span>
                </div>

                <PropertyFeatures :property="property" />
              </div>

              <PropertyDescription :property="property" />
              <PropertyCharacteristics :property="property" />
              <PropertyMap :property="property" />
            </div>
          </div>
        </div>

        <PropertyContact :property="property" />
      </div>

      <!-- No property ID -->
      <div v-else class="error" style="display: block;">
        No se proporcionó un ID de propiedad válido.
      </div>
    </div>

    <PropertyDownload
      ref="downloadRef"
      :images="galleryImages"
      :property-ref="String(property?.id_property || 'propiedad')"
    />
  </div>
</template>

<script setup lang="ts">
import type { Ref } from 'vue'
import { getPropertyTypeLabel } from '~/data/wasi-types'
import type { WasiProperty } from '~/server/utils/wasi-client'

const route = useRoute()
const config = useRuntimeConfig()

// Pass the encrypted ID directly to the server route — it handles decryption server-side.
// config.encryption is server-only and must NOT be accessed on the client.
const encryptedId = computed(() => (route.query.id as string) || null)

// Fetch property data (SSR + hydration — single fetch, no double loading)
// Cast data explicitly: useAsyncData's ts-plugin inference resolves to PickFrom<ResT, KeysOf<DataT>>
// instead of WasiProperty, so we assert the correct type after destructuring.
const { data: _property, error, status } = await useAsyncData(
  `property-${encryptedId.value}`,
  () => {
    if (!encryptedId.value) {
      throw createError({ statusCode: 400, statusMessage: 'ID de propiedad no proporcionado' })
    }
    return $fetch<WasiProperty>(`/api/wasi/property/${encryptedId.value}`)
  },
)
const property = _property as Ref<WasiProperty | null>

// Property type label
const propertyTypeLabel = computed(() =>
  getPropertyTypeLabel(property.value?.id_property_type || ''),
)

// Error message in Spanish
const errorMessage = computed(() => {
  if (!error.value) return ''
  const msg = error.value.statusMessage || error.value.message || ''
  if (msg.includes('disponible') || msg.includes('404')) {
    return 'La propiedad solicitada no existe o no está disponible.'
  }
  if (msg.includes('401') || msg.includes('unauthorized')) {
    return 'Error de autenticación. Verifica la configuración del token API.'
  }
  return 'La propiedad solicitada no existe o no está disponible.'
})

// SEO Meta tags (SSR — replaces hello.js completely)
const pageTitle = computed(() => {
  if (!property.value) return 'Propiedad en Inmobarco'
  return `🏠 ${property.value.title || 'Propiedad'} - Inmobarco`
})

const pageDescription = computed(() => {
  if (!property.value) return 'Encuentra la propiedad perfecta | Tu hogar ideal te está esperando'
  const p = property.value
  const parts: string[] = []
  if (p.bedrooms) parts.push(`${p.bedrooms} hab`)
  if (p.bathrooms) parts.push(`${p.bathrooms} baños`)
  if (p.area) parts.push(`${p.area} m²`)
  const details = parts.join(' • ') || 'Hermosa propiedad'
  const price = p.for_rent === 'true' ? p.rent_price_label : p.sale_price_label
  const location = [p.zone_label, p.city_label].filter(Boolean).join(', ')
  return `${details} | ${price || 'Consultar precio'} | ${location || 'Excelente ubicación'}`
})

const ogImage = computed(() => {
  const fallback = `${config.public.siteUrl}/assets/images/Logo.png`
  if (!property.value?.galleries?.length) return fallback
  const firstEntry = property.value.galleries[0]?.['0']
  if (!firstEntry || typeof firstEntry === 'string') return fallback
  return firstEntry.url_big || firstEntry.url || fallback
})

useHead({
  title: pageTitle,
  meta: [
    { name: 'description', content: pageDescription },
    { name: 'keywords', content: 'inmuebles, propiedades, venta, arriendo, Inmobarco' },
    // Open Graph
    { property: 'og:type', content: 'article' },
    { property: 'og:site_name', content: 'Inmobarco' },
    { property: 'og:title', content: pageTitle },
    { property: 'og:description', content: pageDescription },
    { property: 'og:image', content: ogImage },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { property: 'og:locale', content: 'es_CO' },
    // Twitter
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:site', content: '@Inmobarco' },
    { name: 'twitter:title', content: pageTitle },
    { name: 'twitter:description', content: pageDescription },
    { name: 'twitter:image', content: ogImage },
  ],
})

// Structured data (JSON-LD)
useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: computed(() => JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'RealEstate',
        'name': property.value?.title || 'Propiedad en Inmobarco',
        'description': pageDescription.value,
        'provider': {
          '@type': 'RealEstateAgent',
          'name': 'Inmobarco',
          'url': 'https://inmobarco.com',
          'telephone': '+57 304 525 8750',
          'email': 'comercial@inmobarco.com',
        },
      })),
    },
  ],
})

// Gallery images for download
const galleryRef = ref<{ images: { value: Array<{ imagen: string; url_original: string; filename: string }> } } | null>(null)
const downloadRef = ref<{ downloadAllPhotos: () => void } | null>(null)

const galleryImages = computed(() => galleryRef.value?.images.value || [])

function downloadPhotos() {
  downloadRef.value?.downloadAllPhotos()
}
</script>
