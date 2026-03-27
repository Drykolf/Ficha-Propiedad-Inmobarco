<template>
  <div v-if="property.observations" class="property-description">
    <h2>Descripción</h2>
    <div v-html="property.observations" />
  </div>
</template>

<script setup lang="ts">
import type { WasiProperty } from '~/server/utils/wasi-client'

defineProps<{ property: WasiProperty }>()
</script>
