<template>
  <div class="property-code-discrete">
    <span v-if="property.id_property" class="code-ref">Ref: {{ property.id_property }}</span>
  </div>
</template>

<script setup lang="ts">
import type { WasiProperty } from '~/server/utils/wasi-client'

defineProps<{ property: WasiProperty }>()
</script>
