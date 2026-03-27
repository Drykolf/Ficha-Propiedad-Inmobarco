<template>
  <div v-if="downloading" class="download-overlay">
    <div class="download-content">
      <div style="font-size: 24px; margin-bottom: 20px;">📦 Preparando descarga</div>
      <div style="font-size: 18px; margin-bottom: 15px;">{{ progressText }}</div>
      <div style="width: 300px; height: 8px; background: rgba(255,255,255,0.2); border-radius: 4px; overflow: hidden;">
        <div :style="{ width: progressPercent + '%', height: '100%', background: '#1B99D3', transition: 'width 0.3s' }" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  images: Array<{ imagen: string; url_original: string; filename: string }>
  propertyRef: string
}>()

const downloading = ref(false)
const progressText = ref('')
const progressPercent = ref(0)

async function loadJSZip() {
  if (typeof (window as any).JSZip !== 'undefined') return (window as any).JSZip
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js'
    script.onload = () => resolve((window as any).JSZip)
    script.onerror = () => reject(new Error('Failed to load JSZip'))
    document.head.appendChild(script)
  })
}

async function downloadAllPhotos() {
  if (!props.images?.length) return
  downloading.value = true
  progressText.value = `Procesando imágenes: 0/${props.images.length}`
  progressPercent.value = 0

  try {
    const JSZip = await loadJSZip()
    const zip = new JSZip()
    const folder = zip.folder('fotos')
    const total = props.images.length

    for (let i = 0; i < total; i++) {
      const img = props.images[i]
      const imageUrl = img.url_original || img.imagen
      progressText.value = `Procesando imágenes: ${i + 1}/${total}`
      progressPercent.value = ((i + 1) / total) * 100

      try {
        // Use server-side image proxy to avoid CORS
        const res = await fetch(`/api/wasi/image-proxy?url=${encodeURIComponent(imageUrl)}`)
        if (res.ok) {
          const blob = await res.blob()
          const ext = imageUrl.split('.').pop()?.split('?')[0] || 'jpg'
          folder.file(`${props.propertyRef}_foto_${i + 1}.${ext}`, blob)
        }
      }
      catch { /* skip failed images */ }
    }

    progressText.value = 'Generando archivo ZIP...'

    const zipBlob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    })

    const url = window.URL.createObjectURL(zipBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${props.propertyRef}_fotos.zip`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    progressText.value = `¡Descarga completada! (${total} fotos)`
    setTimeout(() => { downloading.value = false }, 1500)
  }
  catch {
    downloading.value = false
    alert('Error al crear el archivo ZIP. Por favor, inténtalo de nuevo.')
  }
}

defineExpose({ downloadAllPhotos })
</script>

<style scoped>
.download-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  color: white;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
}

.download-content {
  text-align: center;
}
</style>
