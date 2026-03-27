<template>
  <div v-if="coords" class="property-map">
    <h2 class="map-title">Acerca del barrio</h2>

    <!-- Location search -->
    <div class="location-search-container">
      <div class="search-input-wrapper">
        <span class="search-icon">🔍</span>
        <input
          v-model="searchQuery"
          type="text"
          class="location-search-input"
          placeholder="Buscar lugar (ej: Centro Comercial, Estación Metro...)"
          autocomplete="off"
          @input="onSearchInput"
          @keydown.enter="selectFirstSuggestion"
        >
        <button v-if="searchQuery" class="clear-search-btn" @click="clearSearch">&times;</button>
      </div>

      <!-- Suggestions -->
      <div v-if="suggestions.length > 0" class="search-suggestions" style="display: block;">
        <div
          v-for="place in suggestions"
          :key="`${place.lat}-${place.lng}`"
          class="suggestion-item"
          @click="selectPlace(place)"
        >
          <span class="suggestion-icon">{{ place.icon }}</span>
          <div class="suggestion-text">
            <span class="suggestion-name">{{ place.name }}</span>
            <span class="suggestion-address">{{ place.address }}</span>
          </div>
          <span class="suggestion-distance">{{ place.distanceLabel }}</span>
        </div>
      </div>

      <!-- Travel time results -->
      <div v-if="selectedPlace" class="travel-time-results" style="display: block;">
        <div class="travel-time-header">
          <span class="destination-name">{{ selectedPlace.name }}</span>
          <button class="close-travel-results" @click="clearSearchResults">&times;</button>
        </div>
        <div class="travel-modes">
          <div class="travel-mode walking">
            <span class="mode-icon">🚶</span>
            <div class="mode-info">
              <span class="mode-label">A pie</span>
              <span class="mode-time">{{ travelTimes.walking.time }}</span>
              <span class="mode-distance">{{ travelTimes.walking.distance }}</span>
            </div>
          </div>
          <div class="travel-mode driving">
            <span class="mode-icon">🚗</span>
            <div class="mode-info">
              <span class="mode-label">En carro</span>
              <span class="mode-time">{{ travelTimes.driving.time }}</span>
              <span class="mode-distance">{{ travelTimes.driving.distance }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div ref="mapEl" class="map-container">
      <div class="map-loading">Cargando mapa...</div>
    </div>

    <div class="map-info">
      <div class="map-address">
        <span class="location-icon">📍</span>
        <span>{{ property.zone_label }}, {{ property.city_label }}</span>
      </div>
    </div>

    <!-- Nearby places -->
    <div v-if="nearbyPlaces.length > 0" class="nearby-places">
      <h2 class="nearby-places-title">Lugares Cercanos</h2>
      <ul class="nearby-places-list">
        <li v-for="place in nearbyPlaces" :key="place.name" class="nearby-place-item">
          <div class="place-icon">{{ place.icon }}</div>
          <div class="place-info">
            <span class="place-name">{{ place.name }}</span>
            <span class="place-category">{{ place.category }}</span>
          </div>
          <div class="place-distance">
            <span class="distance-value">{{ place.distanceLabel }}</span>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { WasiProperty } from '~/server/utils/wasi-client'

const props = defineProps<{ property: WasiProperty }>()

// Parse coordinates
const coords = computed(() => {
  const m = props.property.map
  if (!m) return null
  let lat: number, lng: number
  if (typeof m === 'string') {
    const parts = m.split(',')
    if (parts.length !== 2) return null
    lat = parseFloat(parts[0])
    lng = parseFloat(parts[1])
  } else {
    lat = parseFloat(m.latitude)
    lng = parseFloat(m.longitude)
  }
  if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) return null
  return { lat, lng }
})

// Privacy offset
function addPrivacyOffset(c: { lat: number; lng: number }) {
  const offset = 0.003
  return {
    lat: c.lat + (Math.random() - 0.5) * offset,
    lng: c.lng + (Math.random() - 0.5) * offset,
  }
}

// Haversine
function calcDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function formatDuration(seconds: number) {
  if (!seconds || seconds <= 0) return 'N/A'
  const h = Math.floor(seconds / 3600)
  const m = Math.ceil((seconds % 3600) / 60)
  return h > 0 ? `${h} h ${m} min` : `${m} min`
}

function formatDistance(meters: number) {
  if (!meters || meters <= 0) return ''
  return meters < 1000 ? `(${Math.round(meters)} m)` : `(${(meters / 1000).toFixed(1)} km)`
}

function distanceLabel(meters: number) {
  return meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(1)} km`
}

// Map reference
const mapEl = ref<HTMLElement | null>(null)
let leafletMap: any = null
let displayCoords: { lat: number; lng: number } | null = null
let searchMarker: any = null

// Nearby places
const nearbyPlaces = ref<Array<{ name: string; category: string; icon: string; distanceLabel: string }>>([])

// Search
const searchQuery = ref('')
const suggestions = ref<Array<{ name: string; address: string; icon: string; lat: number; lng: number; distanceLabel: string }>>([])
const selectedPlace = ref<{ name: string } | null>(null)
const travelTimes = ref({
  walking: { time: '--', distance: '' },
  driving: { time: '--', distance: '' },
})

let searchDebounce: ReturnType<typeof setTimeout> | null = null

const categoryIcons: Record<string, { name: string; icon: string; type: string }> = {
  restaurant: { name: 'Restaurante', icon: '🍽️', type: 'amenity' },
  cafe: { name: 'Café', icon: '☕', type: 'amenity' },
  bank: { name: 'Banco', icon: '🏦', type: 'amenity' },
  pharmacy: { name: 'Farmacia', icon: '💊', type: 'amenity' },
  hospital: { name: 'Hospital', icon: '🏥', type: 'amenity' },
  school: { name: 'Colegio', icon: '🏫', type: 'amenity' },
  university: { name: 'Universidad', icon: '🎓', type: 'amenity' },
  supermarket: { name: 'Supermercado', icon: '🛒', type: 'amenity' },
  shopping_mall: { name: 'Centro Comercial', icon: '🏬', type: 'amenity' },
  mall: { name: 'Centro Comercial', icon: '🏬', type: 'shop' },
  convenience: { name: 'Tienda', icon: '🏪', type: 'shop' },
  park: { name: 'Parque', icon: '🌳', type: 'leisure' },
  fitness_centre: { name: 'Gimnasio', icon: '💪', type: 'leisure' },
  sports_centre: { name: 'Centro Deportivo', icon: '⚽', type: 'leisure' },
  museum: { name: 'Museo', icon: '🏛️', type: 'tourism' },
  attraction: { name: 'Atracción', icon: '🎡', type: 'tourism' },
  hotel: { name: 'Hotel', icon: '🏨', type: 'tourism' },
}

const placeSearchIcons: Record<string, string> = {
  station: '🚇', subway: '🚇', bus_station: '🚌', hospital: '🏥', pharmacy: '💊',
  school: '🏫', university: '🎓', restaurant: '🍽️', cafe: '☕', supermarket: '🛒',
  mall: '🏬', park: '🌳', bank: '🏦', cinema: '🎬', library: '📚',
  city: '🏙️', town: '🏘️', neighbourhood: '🏘️', street: '🛣️',
}

async function loadLeaflet() {
  if (typeof window !== 'undefined' && (window as any).L) return (window as any).L
  await new Promise<void>((resolve) => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(link)

    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.onload = () => resolve()
    document.head.appendChild(script)
  })
  return (window as any).L
}

async function initMap() {
  if (!coords.value || !mapEl.value) return
  const L = await loadLeaflet()
  displayCoords = addPrivacyOffset(coords.value)

  mapEl.value.innerHTML = ''
  leafletMap = L.map(mapEl.value).setView([displayCoords.lat, displayCoords.lng], 16)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors',
  }).addTo(leafletMap)

  L.circle([displayCoords.lat, displayCoords.lng], {
    color: '#1B99D3', fillColor: '#48BFF7', fillOpacity: 0.2, radius: 200,
  }).addTo(leafletMap)

  // Fetch nearby places
  fetchNearbyPlaces()
}

async function fetchNearbyPlaces() {
  if (!coords.value) return
  const { lat, lng } = coords.value
  try {
    const query = `[out:json][timeout:10];(node["amenity"~"restaurant|cafe|bank|pharmacy|hospital|school|university|supermarket|shopping_mall"](around:1000,${lat},${lng});node["shop"~"supermarket|mall|convenience"](around:1000,${lat},${lng});node["leisure"~"park|fitness_centre|sports_centre"](around:1000,${lat},${lng});node["tourism"~"museum|attraction|hotel"](around:1000,${lat},${lng}););out body 10;`
    const body = `data=${encodeURIComponent(query)}`
    const headers = { 'Content-Type': 'application/x-www-form-urlencoded' }
    const endpoints = [
      'https://overpass-api.de/api/interpreter',
      'https://overpass.kumi.systems/api/interpreter',
    ]

    let data: any = null
    for (const url of endpoints) {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 8000)
      try {
        const res = await fetch(url, { method: 'POST', body, headers, signal: controller.signal })
        clearTimeout(timer)
        if (res.ok) { data = await res.json(); break }
      }
      catch { clearTimeout(timer) }
    }
    if (!data) return

    const places = data.elements
      .filter((el: any) => el.tags?.name)
      .map((el: any) => {
        const d = calcDistance(lat, lng, el.lat, el.lon)
        const cat = getCategoryInfo(el.tags)
        return { name: el.tags.name, category: cat.name, categoryType: cat.type, icon: cat.icon, distance: d, distanceLabel: distanceLabel(d) }
      })
      .sort((a: any, b: any) => a.distance - b.distance)

    const selected: typeof places = []
    const used = new Set<string>()
    for (const p of places) {
      if (!used.has(p.categoryType)) {
        selected.push(p)
        used.add(p.categoryType)
      }
      if (selected.length >= 4) break
    }
    nearbyPlaces.value = selected
  }
  catch { /* ignore */ }
}

function getCategoryInfo(tags: any) {
  for (const key of ['amenity', 'shop', 'leisure', 'tourism']) {
    if (tags[key] && categoryIcons[tags[key]]) return categoryIcons[tags[key]]
  }
  return { name: 'Lugar', icon: '📍', type: 'other' }
}

// Search logic
function onSearchInput() {
  if (searchDebounce) clearTimeout(searchDebounce)
  if (searchQuery.value.length < 3) {
    suggestions.value = []
    return
  }
  searchDebounce = setTimeout(() => searchPlaces(), 300)
}

async function searchPlaces() {
  if (!displayCoords) return
  try {
    const res = await fetch(
      `https://photon.komoot.io/api/?q=${encodeURIComponent(searchQuery.value)}&lat=${displayCoords.lat}&lon=${displayCoords.lng}&limit=5&lang=default`,
    )
    if (!res.ok) return
    const data = await res.json()
    const maxDist = 15000

    suggestions.value = (data.features || [])
      .filter((f: any) => {
        const [lon, lat] = f.geometry.coordinates
        return calcDistance(displayCoords!.lat, displayCoords!.lng, lat, lon) <= maxDist
      })
      .map((f: any) => {
        const [lon, lat] = f.geometry.coordinates
        const d = calcDistance(displayCoords!.lat, displayCoords!.lng, lat, lon)
        const p = f.properties
        return {
          name: p.name || p.street || 'Sin nombre',
          address: [p.street, p.district, p.city].filter(Boolean).slice(0, 3).join(', '),
          icon: placeSearchIcons[p.osm_value] || placeSearchIcons[p.osm_key] || '📍',
          lat, lng: lon,
          distanceLabel: distanceLabel(d),
        }
      })
  }
  catch { /* ignore */ }
}

function selectFirstSuggestion() {
  if (suggestions.value.length > 0) selectPlace(suggestions.value[0])
}

async function selectPlace(place: { name: string; lat: number; lng: number }) {
  if (!leafletMap || !displayCoords) return
  const L = (window as any).L
  suggestions.value = []
  searchQuery.value = place.name
  selectedPlace.value = { name: place.name }

  if (searchMarker) leafletMap.removeLayer(searchMarker)
  const redIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
  })
  searchMarker = L.marker([place.lat, place.lng], { icon: redIcon }).addTo(leafletMap).bindPopup(`<strong>${place.name}</strong>`).openPopup()
  leafletMap.fitBounds(L.latLngBounds([displayCoords.lat, displayCoords.lng], [place.lat, place.lng]), { padding: [50, 50] })

  // Travel times
  travelTimes.value.walking = { time: 'Calculando...', distance: '' }
  travelTimes.value.driving = { time: 'Calculando...', distance: '' }

  const origin = `${displayCoords.lng},${displayCoords.lat}`
  const dest = `${place.lng},${place.lat}`

  try {
    const drivingRes = await fetch(`https://router.project-osrm.org/route/v1/driving/${origin};${dest}?overview=false`)
    const drivingData = await drivingRes.json()
    if (drivingData.code === 'Ok' && drivingData.routes?.length) {
      travelTimes.value.driving = {
        time: formatDuration(drivingData.routes[0].duration),
        distance: formatDistance(drivingData.routes[0].distance),
      }
    }
  }
  catch { travelTimes.value.driving = { time: 'Error', distance: '' } }

  // Walking estimate
  const walkDist = calcDistance(displayCoords.lat, displayCoords.lng, place.lat, place.lng) * 1.3
  travelTimes.value.walking = {
    time: formatDuration((walkDist / 1000) * 12 * 60),
    distance: formatDistance(walkDist),
  }
}

function clearSearch() {
  searchQuery.value = ''
  suggestions.value = []
  clearSearchResults()
}

function clearSearchResults() {
  selectedPlace.value = null
  if (searchMarker && leafletMap) {
    leafletMap.removeLayer(searchMarker)
    searchMarker = null
  }
  if (leafletMap && displayCoords) {
    leafletMap.setView([displayCoords.lat, displayCoords.lng], 16)
  }
}

// Lazy-load map with IntersectionObserver
onMounted(() => {
  if (!mapEl.value) return
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        initMap()
        observer.disconnect()
      }
    },
    { threshold: 0.1 },
  )
  observer.observe(mapEl.value)
})
</script>
