<template>
  <div v-if="groups.length > 0" class="property-characteristics">
    <h2 class="characteristics-title">Características</h2>
    <div v-for="group in groups" :key="group.name" class="characteristic-group">
      <h3 class="group-title">{{ group.name }}</h3>
      <div class="characteristics-grid">
        <div v-for="item in group.items" :key="item.id" class="characteristic-item checkbox-item">
          <span class="check-icon">✓</span>
          <span class="characteristic-name">{{ item.nombre || item.name }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { WasiProperty } from '~/server/utils/wasi-client'

const props = defineProps<{ property: WasiProperty }>()

const groups = computed(() => {
  const result: Array<{ name: string; items: Array<{ id: string; nombre: string; name: string }> }> = []
  const features = props.property.features
  if (!features) return result

  if (features.internal?.length) {
    result.push({ name: 'Características Internas', items: features.internal })
  }
  if (features.external?.length) {
    result.push({ name: 'Características Externas', items: features.external })
  }
  return result
})
</script>
