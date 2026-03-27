<template>
  <div v-if="features.length > 0" class="property-features">
    <div v-for="feature in features" :key="feature.label" class="feature-item">
      <div class="feature-icon">{{ feature.icon }}</div>
      <div class="feature-value">{{ feature.value }}</div>
      <div class="feature-label">{{ feature.label }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { WasiProperty } from '~/server/utils/wasi-client'

const props = defineProps<{ property: WasiProperty }>()

const features = computed(() => {
  const items = [
    { label: 'Habitaciones', value: props.property.bedrooms, icon: '🛏️' },
    { label: 'Baños', value: props.property.bathrooms, icon: '🚿' },
    { label: 'Área', value: props.property.area ? `${props.property.area} m²` : null, icon: '📐' },
    { label: 'Parqueaderos', value: props.property.garages || '0', icon: '🚗' },
  ]
  return items.filter(f => f.value && f.value !== 'N/A')
})
</script>
