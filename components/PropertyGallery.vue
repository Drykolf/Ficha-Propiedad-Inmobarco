<template>
  <div class="property-images">
    <div class="image-gallery-container">
      <!-- Main image -->
      <div class="main-image-container">
        <img
          :src="currentImage?.imagen"
          :alt="altText"
          class="main-image"
          loading="lazy"
          @click="openModal(currentIndex)"
        >
        <div class="image-counter">{{ currentIndex + 1 }} / {{ images.length }}</div>
        <template v-if="images.length > 1">
          <button class="gallery-nav prev" aria-label="Imagen anterior" @click.stop="changeImage(-1)">&#8249;</button>
          <button class="gallery-nav next" aria-label="Imagen siguiente" @click.stop="changeImage(1)">&#8250;</button>
        </template>
      </div>

      <!-- Thumbnails -->
      <div v-if="thumbnails.length > 0" class="thumbnail-grid">
        <div
          v-for="(img, index) in thumbnails"
          :key="img.id"
          class="thumbnail-item"
          @click="setMainImage(index + 1)"
        >
          <img
            :src="img.url_thumbnail || img.imagen"
            :alt="`Imagen ${index + 2}`"
            class="thumbnail-image"
            loading="lazy"
          >
          <div v-if="index === thumbnails.length - 1 && remainingCount > 0" class="thumbnail-overlay">
            +{{ remainingCount }}
          </div>
          <button
            v-if="index === thumbnails.length - 1 && images.length >= 3"
            class="download-photos-btn"
            aria-label="Descargar todas las fotos"
            title="Descargar fotos"
            @click.stop="$emit('download')"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Descargar fotos
          </button>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <div v-if="modalOpen" class="gallery-modal active" @click.self="closeModal">
      <div class="modal-content">
        <button class="modal-close" @click="closeModal">&times;</button>
        <img :src="images[modalIndex]?.imagen" :alt="`Imagen ${modalIndex + 1}`" class="modal-image">
        <button class="modal-nav prev" @click="changeModalImage(-1)">&#8249;</button>
        <button class="modal-nav next" @click="changeModalImage(1)">&#8250;</button>
        <div class="modal-counter">{{ modalIndex + 1 }} / {{ images.length }}</div>
        <div class="modal-thumbnail-strip">
          <img
            v-for="(img, i) in images"
            :key="img.id"
            :src="img.url_thumbnail || img.imagen"
            :alt="`Imagen ${i + 1}`"
            class="modal-thumbnail"
            :class="{ active: i === modalIndex }"
            @click="modalIndex = i"
          >
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { WasiPropertyGallery } from '~/server/utils/wasi-client'

interface NormalizedImage {
  id: string
  imagen: string
  url_original: string
  url_thumbnail: string
  description: string
  filename: string
  position: number
}

const props = defineProps<{
  galleries: WasiPropertyGallery[]
  altText: string
}>()

defineEmits<{ download: [] }>()

const images = computed<NormalizedImage[]>(() => {
  const result: NormalizedImage[] = []
  for (const gallery of (props.galleries || [])) {
    for (const key of Object.keys(gallery)) {
      if (key === 'id' || isNaN(Number(key))) continue
      const img = gallery[key] as Record<string, string>
      result.push({
        id: img.id,
        imagen: img.url_big || img.url,
        url_original: img.url_original,
        url_thumbnail: img.url,
        description: img.description || '',
        filename: img.filename || '',
        position: Number(img.position) || Number(key) + 1,
      })
    }
  }
  return result.sort((a, b) => a.position - b.position)
})

const isMobile = ref(false)

onMounted(() => {
  isMobile.value = window.innerWidth <= 768
  window.addEventListener('resize', () => { isMobile.value = window.innerWidth <= 768 }, { passive: true })
})

const thumbnailCount = computed(() => isMobile.value ? 3 : 2)
const thumbnails = computed(() => images.value.slice(1, thumbnailCount.value + 1))
const remainingCount = computed(() => Math.max(0, images.value.length - thumbnailCount.value - 1))

const currentIndex = ref(0)
const currentImage = computed(() => images.value[currentIndex.value])

function changeImage(direction: number) {
  if (images.value.length <= 1) return
  currentIndex.value = (currentIndex.value + direction + images.value.length) % images.value.length
}

function setMainImage(index: number) {
  if (index >= 0 && index < images.value.length) {
    currentIndex.value = index
  }
}

// Modal
const modalOpen = ref(false)
const modalIndex = ref(0)

function openModal(index: number) {
  modalIndex.value = index
  modalOpen.value = true
  document.body.classList.add('modal-open')
}

function closeModal() {
  modalOpen.value = false
  document.body.classList.remove('modal-open')
}

function changeModalImage(direction: number) {
  modalIndex.value = (modalIndex.value + direction + images.value.length) % images.value.length
}

function handleKeydown(e: KeyboardEvent) {
  if (!modalOpen.value) return
  if (e.key === 'ArrowLeft') changeModalImage(-1)
  else if (e.key === 'ArrowRight') changeModalImage(1)
  else if (e.key === 'Escape') closeModal()
}

onMounted(() => document.addEventListener('keydown', handleKeydown))
onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.body.classList.remove('modal-open')
})

// Expose images for parent (download)
defineExpose({ images })
</script>
