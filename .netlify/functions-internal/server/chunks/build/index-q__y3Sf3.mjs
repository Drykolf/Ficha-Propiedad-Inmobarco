import { defineComponent, computed, withAsyncContext, ref, unref, toValue, getCurrentInstance, onServerPrefetch, mergeProps, shallowRef, nextTick, toRef, useSSRContext, createElementBlock, provide, cloneVNode, h } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderStyle, ssrInterpolate, ssrRenderAttr, ssrRenderList, ssrRenderClass } from 'vue/server-renderer';
import { p as publicAssetsURL } from '../routes/renderer.mjs';
import { g as useRoute, a as useNuxtApp, d as asyncDataDefaults, f as createError, b as useRuntimeConfig, _ as _export_sfc } from './server.mjs';
import { u as useHead } from './v3-CntMljfk.mjs';
import 'vue-bundle-renderer/runtime';
import '../_/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'unhead/server';
import 'devalue';
import 'unhead/utils';
import 'unhead/plugins';
import 'vue-router';

//#region src/index.ts
const DEBOUNCE_DEFAULTS = { trailing: true };
/**
Debounce functions
@param fn - Promise-returning/async function to debounce.
@param wait - Milliseconds to wait before calling `fn`. Default value is 25ms
@returns A function that delays calling `fn` until after `wait` milliseconds have elapsed since the last time it was called.
@example
```
import { debounce } from 'perfect-debounce';
const expensiveCall = async input => input;
const debouncedFn = debounce(expensiveCall, 200);
for (const number of [1, 2, 3]) {
console.log(await debouncedFn(number));
}
//=> 1
//=> 2
//=> 3
```
*/
function debounce(fn, wait = 25, options = {}) {
	options = {
		...DEBOUNCE_DEFAULTS,
		...options
	};
	if (!Number.isFinite(wait)) throw new TypeError("Expected `wait` to be a finite number");
	let leadingValue;
	let timeout;
	let resolveList = [];
	let currentPromise;
	let trailingArgs;
	const applyFn = (_this, args) => {
		currentPromise = _applyPromised(fn, _this, args);
		currentPromise.finally(() => {
			currentPromise = null;
			if (options.trailing && trailingArgs && !timeout) {
				const promise = applyFn(_this, trailingArgs);
				trailingArgs = null;
				return promise;
			}
		});
		return currentPromise;
	};
	const debounced = function(...args) {
		if (options.trailing) trailingArgs = args;
		if (currentPromise) return currentPromise;
		return new Promise((resolve) => {
			const shouldCallNow = !timeout && options.leading;
			clearTimeout(timeout);
			timeout = setTimeout(() => {
				timeout = null;
				const promise = options.leading ? leadingValue : applyFn(this, args);
				trailingArgs = null;
				for (const _resolve of resolveList) _resolve(promise);
				resolveList = [];
			}, wait);
			if (shouldCallNow) {
				leadingValue = applyFn(this, args);
				resolve(leadingValue);
			} else resolveList.push(resolve);
		});
	};
	const _clearTimeout = (timer) => {
		if (timer) {
			clearTimeout(timer);
			timeout = null;
		}
	};
	debounced.isPending = () => !!timeout;
	debounced.cancel = () => {
		_clearTimeout(timeout);
		resolveList = [];
		trailingArgs = null;
	};
	debounced.flush = () => {
		_clearTimeout(timeout);
		if (!trailingArgs || currentPromise) return;
		const args = trailingArgs;
		trailingArgs = null;
		return applyFn(this, args);
	};
	return debounced;
}
async function _applyPromised(fn, _this, args) {
	return await fn.apply(_this, args);
}

const _imports_0 = publicAssetsURL("/assets/images/Logo.png");
const _sfc_main$8 = {};
function _sfc_ssrRender(_ctx, _push, _parent, _attrs) {
  _push(`<header${ssrRenderAttrs(mergeProps({ class: "property-header-with-logo" }, _attrs))}><div class="header-content"><div class="logo-section"><img${ssrRenderAttr("src", _imports_0)} alt="Inmobarco - Inmobiliaria" class="logo-inmobarco"><div class="header-title-section"><h1 class="header-main-title">Detalles de Propiedad</h1><p class="header-subtitle">Encuentra tu hogar ideal</p></div></div><div class="company-info"><p class="company-tagline">Tu hogar ideal te est\xE1 esperando</p><p class="company-contact">www.inmobarco.com</p></div></div></header>`);
}
const _sfc_setup$8 = _sfc_main$8.setup;
_sfc_main$8.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/PropertyHeader.vue");
  return _sfc_setup$8 ? _sfc_setup$8(props, ctx) : void 0;
};
const __nuxt_component_0 = /* @__PURE__ */ _export_sfc(_sfc_main$8, [["ssrRender", _sfc_ssrRender]]);
const _sfc_main$7 = /* @__PURE__ */ defineComponent({
  __name: "PropertyGallery",
  __ssrInlineRender: true,
  props: {
    galleries: {},
    altText: {}
  },
  emits: ["download"],
  setup(__props, { expose: __expose }) {
    const props = __props;
    const images = computed(() => {
      const result = [];
      for (const gallery of props.galleries || []) {
        for (const key of Object.keys(gallery)) {
          if (key === "id" || isNaN(Number(key))) continue;
          const img = gallery[key];
          result.push({
            id: img.id,
            imagen: img.url_big || img.url,
            url_original: img.url_original,
            url_thumbnail: img.url,
            description: img.description || "",
            filename: img.filename || "",
            position: Number(img.position) || Number(key) + 1
          });
        }
      }
      return result.sort((a, b) => a.position - b.position);
    });
    const isMobile = ref(false);
    const thumbnailCount = computed(() => isMobile.value ? 3 : 2);
    const thumbnails = computed(() => images.value.slice(1, thumbnailCount.value + 1));
    const remainingCount = computed(() => Math.max(0, images.value.length - thumbnailCount.value - 1));
    const currentIndex = ref(0);
    const currentImage = computed(() => images.value[currentIndex.value]);
    const modalOpen = ref(false);
    const modalIndex = ref(0);
    __expose({ images });
    return (_ctx, _push, _parent, _attrs) => {
      var _a, _b;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "property-images" }, _attrs))}><div class="image-gallery-container"><div class="main-image-container"><img${ssrRenderAttr("src", (_a = unref(currentImage)) == null ? void 0 : _a.imagen)}${ssrRenderAttr("alt", __props.altText)} class="main-image" loading="lazy"><div class="image-counter">${ssrInterpolate(unref(currentIndex) + 1)} / ${ssrInterpolate(unref(images).length)}</div>`);
      if (unref(images).length > 1) {
        _push(`<!--[--><button class="gallery-nav prev" aria-label="Imagen anterior">\u2039</button><button class="gallery-nav next" aria-label="Imagen siguiente">\u203A</button><!--]-->`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
      if (unref(thumbnails).length > 0) {
        _push(`<div class="thumbnail-grid"><!--[-->`);
        ssrRenderList(unref(thumbnails), (img, index) => {
          _push(`<div class="thumbnail-item"><img${ssrRenderAttr("src", img.url_thumbnail || img.imagen)}${ssrRenderAttr("alt", `Imagen ${index + 2}`)} class="thumbnail-image" loading="lazy">`);
          if (index === unref(thumbnails).length - 1 && unref(remainingCount) > 0) {
            _push(`<div class="thumbnail-overlay"> +${ssrInterpolate(unref(remainingCount))}</div>`);
          } else {
            _push(`<!---->`);
          }
          if (index === unref(thumbnails).length - 1 && unref(images).length >= 3) {
            _push(`<button class="download-photos-btn" aria-label="Descargar todas las fotos" title="Descargar fotos"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> Descargar fotos </button>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div>`);
        });
        _push(`<!--]--></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
      if (unref(modalOpen)) {
        _push(`<div class="gallery-modal active"><div class="modal-content"><button class="modal-close">\xD7</button><img${ssrRenderAttr("src", (_b = unref(images)[unref(modalIndex)]) == null ? void 0 : _b.imagen)}${ssrRenderAttr("alt", `Imagen ${unref(modalIndex) + 1}`)} class="modal-image"><button class="modal-nav prev">\u2039</button><button class="modal-nav next">\u203A</button><div class="modal-counter">${ssrInterpolate(unref(modalIndex) + 1)} / ${ssrInterpolate(unref(images).length)}</div><div class="modal-thumbnail-strip"><!--[-->`);
        ssrRenderList(unref(images), (img, i) => {
          _push(`<img${ssrRenderAttr("src", img.url_thumbnail || img.imagen)}${ssrRenderAttr("alt", `Imagen ${i + 1}`)} class="${ssrRenderClass([{ active: i === unref(modalIndex) }, "modal-thumbnail"])}">`);
        });
        _push(`<!--]--></div></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup$7 = _sfc_main$7.setup;
_sfc_main$7.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/PropertyGallery.vue");
  return _sfc_setup$7 ? _sfc_setup$7(props, ctx) : void 0;
};
const _sfc_main$6 = /* @__PURE__ */ defineComponent({
  __name: "PropertyFeatures",
  __ssrInlineRender: true,
  props: {
    property: {}
  },
  setup(__props) {
    const props = __props;
    const features = computed(() => {
      const items = [
        { label: "Habitaciones", value: props.property.bedrooms, icon: "\u{1F6CF}\uFE0F" },
        { label: "Ba\xF1os", value: props.property.bathrooms, icon: "\u{1F6BF}" },
        { label: "\xC1rea", value: props.property.area ? `${props.property.area} m\xB2` : null, icon: "\u{1F4D0}" },
        { label: "Parqueaderos", value: props.property.garages || "0", icon: "\u{1F697}" }
      ];
      return items.filter((f) => f.value && f.value !== "N/A");
    });
    return (_ctx, _push, _parent, _attrs) => {
      if (unref(features).length > 0) {
        _push(`<div${ssrRenderAttrs(mergeProps({ class: "property-features" }, _attrs))}><!--[-->`);
        ssrRenderList(unref(features), (feature) => {
          _push(`<div class="feature-item"><div class="feature-icon">${ssrInterpolate(feature.icon)}</div><div class="feature-value">${ssrInterpolate(feature.value)}</div><div class="feature-label">${ssrInterpolate(feature.label)}</div></div>`);
        });
        _push(`<!--]--></div>`);
      } else {
        _push(`<!---->`);
      }
    };
  }
});
const _sfc_setup$6 = _sfc_main$6.setup;
_sfc_main$6.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/PropertyFeatures.vue");
  return _sfc_setup$6 ? _sfc_setup$6(props, ctx) : void 0;
};
const _sfc_main$5 = /* @__PURE__ */ defineComponent({
  __name: "PropertyDescription",
  __ssrInlineRender: true,
  props: {
    property: {}
  },
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      if (__props.property.observations) {
        _push(`<div${ssrRenderAttrs(mergeProps({ class: "property-description" }, _attrs))}><h2>Descripci\xF3n</h2><p>${ssrInterpolate(__props.property.observations)}</p></div>`);
      } else {
        _push(`<!---->`);
      }
    };
  }
});
const _sfc_setup$5 = _sfc_main$5.setup;
_sfc_main$5.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/PropertyDescription.vue");
  return _sfc_setup$5 ? _sfc_setup$5(props, ctx) : void 0;
};
const _sfc_main$4 = /* @__PURE__ */ defineComponent({
  __name: "PropertyCharacteristics",
  __ssrInlineRender: true,
  props: {
    property: {}
  },
  setup(__props) {
    const props = __props;
    const groups = computed(() => {
      var _a, _b;
      const result = [];
      const features = props.property.features;
      if (!features) return result;
      if ((_a = features.internal) == null ? void 0 : _a.length) {
        result.push({ name: "Caracter\xEDsticas Internas", items: features.internal });
      }
      if ((_b = features.external) == null ? void 0 : _b.length) {
        result.push({ name: "Caracter\xEDsticas Externas", items: features.external });
      }
      return result;
    });
    return (_ctx, _push, _parent, _attrs) => {
      if (unref(groups).length > 0) {
        _push(`<div${ssrRenderAttrs(mergeProps({ class: "property-characteristics" }, _attrs))}><h2 class="characteristics-title">Caracter\xEDsticas</h2><!--[-->`);
        ssrRenderList(unref(groups), (group) => {
          _push(`<div class="characteristic-group"><h3 class="group-title">${ssrInterpolate(group.name)}</h3><div class="characteristics-grid"><!--[-->`);
          ssrRenderList(group.items, (item) => {
            _push(`<div class="characteristic-item checkbox-item"><span class="check-icon">\u2713</span><span class="characteristic-name">${ssrInterpolate(item.nombre || item.name)}</span></div>`);
          });
          _push(`<!--]--></div></div>`);
        });
        _push(`<!--]--></div>`);
      } else {
        _push(`<!---->`);
      }
    };
  }
});
const _sfc_setup$4 = _sfc_main$4.setup;
_sfc_main$4.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/PropertyCharacteristics.vue");
  return _sfc_setup$4 ? _sfc_setup$4(props, ctx) : void 0;
};
const _sfc_main$3 = /* @__PURE__ */ defineComponent({
  __name: "PropertyMap",
  __ssrInlineRender: true,
  props: {
    property: {}
  },
  setup(__props) {
    const props = __props;
    const coords = computed(() => {
      const m = props.property.map;
      if (!m) return null;
      let lat, lng;
      if (typeof m === "string") {
        const parts = m.split(",");
        if (parts.length !== 2) return null;
        lat = parseFloat(parts[0]);
        lng = parseFloat(parts[1]);
      } else {
        lat = parseFloat(m.latitude);
        lng = parseFloat(m.longitude);
      }
      if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) return null;
      return { lat, lng };
    });
    ref(null);
    const nearbyPlaces = ref([]);
    const searchQuery = ref("");
    const suggestions = ref([]);
    const selectedPlace = ref(null);
    const travelTimes = ref({
      walking: { time: "--", distance: "" },
      driving: { time: "--", distance: "" }
    });
    return (_ctx, _push, _parent, _attrs) => {
      if (unref(coords)) {
        _push(`<div${ssrRenderAttrs(mergeProps({ class: "property-map" }, _attrs))}><h2 class="map-title">Acerca del barrio</h2><div class="location-search-container"><div class="search-input-wrapper"><span class="search-icon">\u{1F50D}</span><input${ssrRenderAttr("value", unref(searchQuery))} type="text" class="location-search-input" placeholder="Buscar lugar (ej: Centro Comercial, Estaci\xF3n Metro...)" autocomplete="off">`);
        if (unref(searchQuery)) {
          _push(`<button class="clear-search-btn">\xD7</button>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
        if (unref(suggestions).length > 0) {
          _push(`<div class="search-suggestions" style="${ssrRenderStyle({ "display": "block" })}"><!--[-->`);
          ssrRenderList(unref(suggestions), (place) => {
            _push(`<div class="suggestion-item"><span class="suggestion-icon">${ssrInterpolate(place.icon)}</span><div class="suggestion-text"><span class="suggestion-name">${ssrInterpolate(place.name)}</span><span class="suggestion-address">${ssrInterpolate(place.address)}</span></div><span class="suggestion-distance">${ssrInterpolate(place.distanceLabel)}</span></div>`);
          });
          _push(`<!--]--></div>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(selectedPlace)) {
          _push(`<div class="travel-time-results" style="${ssrRenderStyle({ "display": "block" })}"><div class="travel-time-header"><span class="destination-name">${ssrInterpolate(unref(selectedPlace).name)}</span><button class="close-travel-results">\xD7</button></div><div class="travel-modes"><div class="travel-mode walking"><span class="mode-icon">\u{1F6B6}</span><div class="mode-info"><span class="mode-label">A pie</span><span class="mode-time">${ssrInterpolate(unref(travelTimes).walking.time)}</span><span class="mode-distance">${ssrInterpolate(unref(travelTimes).walking.distance)}</span></div></div><div class="travel-mode driving"><span class="mode-icon">\u{1F697}</span><div class="mode-info"><span class="mode-label">En carro</span><span class="mode-time">${ssrInterpolate(unref(travelTimes).driving.time)}</span><span class="mode-distance">${ssrInterpolate(unref(travelTimes).driving.distance)}</span></div></div></div></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div><div class="map-container"><div class="map-loading">Cargando mapa...</div></div><div class="map-info"><div class="map-address"><span class="location-icon">\u{1F4CD}</span><span>${ssrInterpolate(__props.property.zone_label)}, ${ssrInterpolate(__props.property.city_label)}</span></div></div>`);
        if (unref(nearbyPlaces).length > 0) {
          _push(`<div class="nearby-places"><h2 class="nearby-places-title">Lugares Cercanos</h2><ul class="nearby-places-list"><!--[-->`);
          ssrRenderList(unref(nearbyPlaces), (place) => {
            _push(`<li class="nearby-place-item"><div class="place-icon">${ssrInterpolate(place.icon)}</div><div class="place-info"><span class="place-name">${ssrInterpolate(place.name)}</span><span class="place-category">${ssrInterpolate(place.category)}</span></div><div class="place-distance"><span class="distance-value">${ssrInterpolate(place.distanceLabel)}</span></div></li>`);
          });
          _push(`<!--]--></ul></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
      } else {
        _push(`<!---->`);
      }
    };
  }
});
const _sfc_setup$3 = _sfc_main$3.setup;
_sfc_main$3.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/PropertyMap.vue");
  return _sfc_setup$3 ? _sfc_setup$3(props, ctx) : void 0;
};
const _sfc_main$2 = /* @__PURE__ */ defineComponent({
  __name: "PropertyContact",
  __ssrInlineRender: true,
  props: {
    property: {}
  },
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "property-code-discrete" }, _attrs))}>`);
      if (__props.property.id_property) {
        _push(`<span class="code-ref">Ref: ${ssrInterpolate(__props.property.id_property)}</span>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup$2 = _sfc_main$2.setup;
_sfc_main$2.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/PropertyContact.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "PropertyDownload",
  __ssrInlineRender: true,
  props: {
    images: {},
    propertyRef: {}
  },
  setup(__props, { expose: __expose }) {
    const props = __props;
    const downloading = ref(false);
    const progressText = ref("");
    const progressPercent = ref(0);
    async function loadJSZip() {
      if (typeof (void 0).JSZip !== "undefined") return (void 0).JSZip;
      return new Promise((resolve, reject) => {
        const script = (void 0).createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js";
        script.onload = () => resolve((void 0).JSZip);
        script.onerror = () => reject(new Error("Failed to load JSZip"));
        (void 0).head.appendChild(script);
      });
    }
    async function downloadAllPhotos() {
      var _a, _b;
      if (!((_a = props.images) == null ? void 0 : _a.length)) return;
      downloading.value = true;
      progressText.value = `Procesando im\xE1genes: 0/${props.images.length}`;
      progressPercent.value = 0;
      try {
        const JSZip = await loadJSZip();
        const zip = new JSZip();
        const folder = zip.folder("fotos");
        const total = props.images.length;
        for (let i = 0; i < total; i++) {
          const img = props.images[i];
          const imageUrl = img.url_original || img.imagen;
          progressText.value = `Procesando im\xE1genes: ${i + 1}/${total}`;
          progressPercent.value = (i + 1) / total * 100;
          try {
            const res = await fetch(`/api/wasi/image-proxy?url=${encodeURIComponent(imageUrl)}`);
            if (res.ok) {
              const blob = await res.blob();
              const ext = ((_b = imageUrl.split(".").pop()) == null ? void 0 : _b.split("?")[0]) || "jpg";
              folder.file(`${props.propertyRef}_foto_${i + 1}.${ext}`, blob);
            }
          } catch {
          }
        }
        progressText.value = "Generando archivo ZIP...";
        const zipBlob = await zip.generateAsync({
          type: "blob",
          compression: "DEFLATE",
          compressionOptions: { level: 6 }
        });
        const url = (void 0).URL.createObjectURL(zipBlob);
        const link = (void 0).createElement("a");
        link.href = url;
        link.download = `${props.propertyRef}_fotos.zip`;
        (void 0).body.appendChild(link);
        link.click();
        (void 0).body.removeChild(link);
        (void 0).URL.revokeObjectURL(url);
        progressText.value = `\xA1Descarga completada! (${total} fotos)`;
        setTimeout(() => {
          downloading.value = false;
        }, 1500);
      } catch {
        downloading.value = false;
        alert("Error al crear el archivo ZIP. Por favor, int\xE9ntalo de nuevo.");
      }
    }
    __expose({ downloadAllPhotos });
    return (_ctx, _push, _parent, _attrs) => {
      if (unref(downloading)) {
        _push(`<div${ssrRenderAttrs(mergeProps({ class: "download-overlay" }, _attrs))} data-v-faffb207><div class="download-content" data-v-faffb207><div style="${ssrRenderStyle({ "font-size": "24px", "margin-bottom": "20px" })}" data-v-faffb207>\u{1F4E6} Preparando descarga</div><div style="${ssrRenderStyle({ "font-size": "18px", "margin-bottom": "15px" })}" data-v-faffb207>${ssrInterpolate(unref(progressText))}</div><div style="${ssrRenderStyle({ "width": "300px", "height": "8px", "background": "rgba(255,255,255,0.2)", "border-radius": "4px", "overflow": "hidden" })}" data-v-faffb207><div style="${ssrRenderStyle({ width: unref(progressPercent) + "%", height: "100%", background: "#1B99D3", transition: "width 0.3s" })}" data-v-faffb207></div></div></div></div>`);
      } else {
        _push(`<!---->`);
      }
    };
  }
});
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/PropertyDownload.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const __nuxt_component_7 = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["__scopeId", "data-v-faffb207"]]);
const propertyTypes = {
  "1": "Casa",
  "2": "Apartamento",
  "3": "Local comercial",
  "4": "Oficina",
  "5": "Lote / Terreno",
  "6": "Lote Comercial",
  "7": "Finca",
  "8": "Bodega",
  "10": "Chalet",
  "11": "Casa de Campo",
  "12": "Hoteles",
  "13": "Finca - Hoteles",
  "14": "Aparta-Estudio",
  "15": "Consultorio",
  "16": "Edificio",
  "17": "Lote de Playa",
  "18": "Hostal",
  "19": "Condominio",
  "20": "Duplex",
  "21": "\xC1tico",
  "22": "Bungalow",
  "23": "Galp\xF3n Industrial",
  "24": "Casa de Playa",
  "25": "Piso",
  "26": "Garaje",
  "27": "Cortijo",
  "28": "Caba\xF1as",
  "29": "Isla",
  "30": "Nave Industrial",
  "31": "Campos, Chacras y Quintas",
  "32": "Terreno"
};
function getPropertyTypeLabel(idPropertyType) {
  return propertyTypes[String(idPropertyType)] || "Inmueble";
}
defineComponent({
  name: "ServerPlaceholder",
  render() {
    return createElementBlock("div");
  }
});
const clientOnlySymbol = /* @__PURE__ */ Symbol.for("nuxt:client-only");
defineComponent({
  name: "ClientOnly",
  inheritAttrs: false,
  props: ["fallback", "placeholder", "placeholderTag", "fallbackTag"],
  ...false,
  setup(props, { slots, attrs }) {
    const mounted = shallowRef(false);
    const vm = getCurrentInstance();
    if (vm) {
      vm._nuxtClientOnly = true;
    }
    provide(clientOnlySymbol, true);
    return () => {
      var _a;
      if (mounted.value) {
        const vnodes = (_a = slots.default) == null ? void 0 : _a.call(slots);
        if (vnodes && vnodes.length === 1) {
          return [cloneVNode(vnodes[0], attrs)];
        }
        return vnodes;
      }
      const slot = slots.fallback || slots.placeholder;
      if (slot) {
        return h(slot);
      }
      const fallbackStr = props.fallback || props.placeholder || "";
      const fallbackTag = props.fallbackTag || props.placeholderTag || "span";
      return createElementBlock(fallbackTag, attrs, fallbackStr);
    };
  }
});
const isDefer = (dedupe) => dedupe === "defer" || dedupe === false;
function useAsyncData(...args) {
  var _a, _b, _c, _d, _e, _f, _g;
  const autoKey = typeof args[args.length - 1] === "string" ? args.pop() : void 0;
  if (_isAutoKeyNeeded(args[0], args[1])) {
    args.unshift(autoKey);
  }
  let [_key, _handler, options = {}] = args;
  const key = computed(() => toValue(_key));
  if (typeof key.value !== "string") {
    throw new TypeError("[nuxt] [useAsyncData] key must be a string.");
  }
  if (typeof _handler !== "function") {
    throw new TypeError("[nuxt] [useAsyncData] handler must be a function.");
  }
  const nuxtApp = useNuxtApp();
  (_a = options.server) != null ? _a : options.server = true;
  (_b = options.default) != null ? _b : options.default = getDefault;
  (_c = options.getCachedData) != null ? _c : options.getCachedData = getDefaultCachedData;
  (_d = options.lazy) != null ? _d : options.lazy = false;
  (_e = options.immediate) != null ? _e : options.immediate = true;
  (_f = options.deep) != null ? _f : options.deep = asyncDataDefaults.deep;
  (_g = options.dedupe) != null ? _g : options.dedupe = "cancel";
  options._functionName || "useAsyncData";
  nuxtApp._asyncData[key.value];
  function createInitialFetch() {
    var _a2;
    const initialFetchOptions = { cause: "initial", dedupe: options.dedupe };
    if (!((_a2 = nuxtApp._asyncData[key.value]) == null ? void 0 : _a2._init)) {
      initialFetchOptions.cachedData = options.getCachedData(key.value, nuxtApp, { cause: "initial" });
      nuxtApp._asyncData[key.value] = createAsyncData(nuxtApp, key.value, _handler, options, initialFetchOptions.cachedData);
    }
    return () => nuxtApp._asyncData[key.value].execute(initialFetchOptions);
  }
  const initialFetch = createInitialFetch();
  const asyncData = nuxtApp._asyncData[key.value];
  asyncData._deps++;
  const fetchOnServer = options.server !== false && nuxtApp.payload.serverRendered;
  if (fetchOnServer && options.immediate) {
    const promise = initialFetch();
    if (getCurrentInstance()) {
      onServerPrefetch(() => promise);
    } else {
      nuxtApp.hook("app:created", async () => {
        await promise;
      });
    }
  }
  const asyncReturn = {
    data: writableComputedRef(() => {
      var _a2;
      return (_a2 = nuxtApp._asyncData[key.value]) == null ? void 0 : _a2.data;
    }),
    pending: writableComputedRef(() => {
      var _a2;
      return (_a2 = nuxtApp._asyncData[key.value]) == null ? void 0 : _a2.pending;
    }),
    status: writableComputedRef(() => {
      var _a2;
      return (_a2 = nuxtApp._asyncData[key.value]) == null ? void 0 : _a2.status;
    }),
    error: writableComputedRef(() => {
      var _a2;
      return (_a2 = nuxtApp._asyncData[key.value]) == null ? void 0 : _a2.error;
    }),
    refresh: (...args2) => {
      var _a2;
      if (!((_a2 = nuxtApp._asyncData[key.value]) == null ? void 0 : _a2._init)) {
        const initialFetch2 = createInitialFetch();
        return initialFetch2();
      }
      return nuxtApp._asyncData[key.value].execute(...args2);
    },
    execute: (...args2) => asyncReturn.refresh(...args2),
    clear: () => {
      const entry = nuxtApp._asyncData[key.value];
      if (entry == null ? void 0 : entry._abortController) {
        try {
          entry._abortController.abort(new DOMException("AsyncData aborted by user.", "AbortError"));
        } finally {
          entry._abortController = void 0;
        }
      }
      clearNuxtDataByKey(nuxtApp, key.value);
    }
  };
  const asyncDataPromise = Promise.resolve(nuxtApp._asyncDataPromises[key.value]).then(() => asyncReturn);
  Object.assign(asyncDataPromise, asyncReturn);
  Object.defineProperties(asyncDataPromise, {
    then: { enumerable: true, value: asyncDataPromise.then.bind(asyncDataPromise) },
    catch: { enumerable: true, value: asyncDataPromise.catch.bind(asyncDataPromise) },
    finally: { enumerable: true, value: asyncDataPromise.finally.bind(asyncDataPromise) }
  });
  return asyncDataPromise;
}
function writableComputedRef(getter) {
  return computed({
    get() {
      var _a;
      return (_a = getter()) == null ? void 0 : _a.value;
    },
    set(value) {
      const ref2 = getter();
      if (ref2) {
        ref2.value = value;
      }
    }
  });
}
function _isAutoKeyNeeded(keyOrFetcher, fetcher) {
  if (typeof keyOrFetcher === "string") {
    return false;
  }
  if (typeof keyOrFetcher === "object" && keyOrFetcher !== null) {
    return false;
  }
  if (typeof keyOrFetcher === "function" && typeof fetcher === "function") {
    return false;
  }
  return true;
}
function clearNuxtDataByKey(nuxtApp, key) {
  if (key in nuxtApp.payload.data) {
    nuxtApp.payload.data[key] = void 0;
  }
  if (key in nuxtApp.payload._errors) {
    nuxtApp.payload._errors[key] = asyncDataDefaults.errorValue;
  }
  if (nuxtApp._asyncData[key]) {
    nuxtApp._asyncData[key].data.value = void 0;
    nuxtApp._asyncData[key].error.value = asyncDataDefaults.errorValue;
    {
      nuxtApp._asyncData[key].pending.value = false;
    }
    nuxtApp._asyncData[key].status.value = "idle";
  }
  if (key in nuxtApp._asyncDataPromises) {
    nuxtApp._asyncDataPromises[key] = void 0;
  }
}
function pick(obj, keys) {
  const newObj = {};
  for (const key of keys) {
    newObj[key] = obj[key];
  }
  return newObj;
}
function createAsyncData(nuxtApp, key, _handler, options, initialCachedData) {
  var _a, _b;
  (_b = (_a = nuxtApp.payload._errors)[key]) != null ? _b : _a[key] = asyncDataDefaults.errorValue;
  const hasCustomGetCachedData = options.getCachedData !== getDefaultCachedData;
  const handler = _handler ;
  const _ref = options.deep ? ref : shallowRef;
  const hasCachedData = initialCachedData != null;
  const unsubRefreshAsyncData = nuxtApp.hook("app:data:refresh", async (keys) => {
    if (!keys || keys.includes(key)) {
      await asyncData.execute({ cause: "refresh:hook" });
    }
  });
  const asyncData = {
    data: _ref(hasCachedData ? initialCachedData : options.default()),
    pending: shallowRef(!hasCachedData),
    error: toRef(nuxtApp.payload._errors, key),
    status: shallowRef("idle"),
    execute: (...args) => {
      var _a2, _b2;
      const [_opts, newValue = void 0] = args;
      const opts = _opts && newValue === void 0 && typeof _opts === "object" ? _opts : {};
      if (nuxtApp._asyncDataPromises[key]) {
        if (isDefer((_a2 = opts.dedupe) != null ? _a2 : options.dedupe)) {
          return nuxtApp._asyncDataPromises[key];
        }
      }
      if (opts.cause === "initial" || nuxtApp.isHydrating) {
        const cachedData = "cachedData" in opts ? opts.cachedData : options.getCachedData(key, nuxtApp, { cause: (_b2 = opts.cause) != null ? _b2 : "refresh:manual" });
        if (cachedData != null) {
          nuxtApp.payload.data[key] = asyncData.data.value = cachedData;
          asyncData.error.value = asyncDataDefaults.errorValue;
          asyncData.status.value = "success";
          return Promise.resolve(cachedData);
        }
      }
      {
        asyncData.pending.value = true;
      }
      if (asyncData._abortController) {
        asyncData._abortController.abort(new DOMException("AsyncData request cancelled by deduplication", "AbortError"));
      }
      asyncData._abortController = new AbortController();
      asyncData.status.value = "pending";
      const cleanupController = new AbortController();
      const promise = new Promise(
        (resolve, reject) => {
          var _a3, _b3;
          try {
            const timeout = (_a3 = opts.timeout) != null ? _a3 : options.timeout;
            const mergedSignal = mergeAbortSignals([(_b3 = asyncData._abortController) == null ? void 0 : _b3.signal, opts == null ? void 0 : opts.signal], cleanupController.signal, timeout);
            if (mergedSignal.aborted) {
              const reason = mergedSignal.reason;
              reject(reason instanceof Error ? reason : new DOMException(String(reason != null ? reason : "Aborted"), "AbortError"));
              return;
            }
            mergedSignal.addEventListener("abort", () => {
              const reason = mergedSignal.reason;
              reject(reason instanceof Error ? reason : new DOMException(String(reason != null ? reason : "Aborted"), "AbortError"));
            }, { once: true, signal: cleanupController.signal });
            return Promise.resolve(handler(nuxtApp, { signal: mergedSignal })).then(resolve, reject);
          } catch (err) {
            reject(err);
          }
        }
      ).then(async (_result) => {
        let result = _result;
        if (options.transform) {
          result = await options.transform(_result);
        }
        if (options.pick) {
          result = pick(result, options.pick);
        }
        nuxtApp.payload.data[key] = result;
        asyncData.data.value = result;
        asyncData.error.value = asyncDataDefaults.errorValue;
        asyncData.status.value = "success";
      }).catch((error) => {
        var _a3;
        if (nuxtApp._asyncDataPromises[key] && nuxtApp._asyncDataPromises[key] !== promise) {
          return nuxtApp._asyncDataPromises[key];
        }
        if ((_a3 = asyncData._abortController) == null ? void 0 : _a3.signal.aborted) {
          return nuxtApp._asyncDataPromises[key];
        }
        if (typeof DOMException !== "undefined" && error instanceof DOMException && error.name === "AbortError") {
          asyncData.status.value = "idle";
          return nuxtApp._asyncDataPromises[key];
        }
        asyncData.error.value = createError(error);
        asyncData.data.value = unref(options.default());
        asyncData.status.value = "error";
      }).finally(() => {
        {
          asyncData.pending.value = false;
        }
        cleanupController.abort();
        delete nuxtApp._asyncDataPromises[key];
      });
      nuxtApp._asyncDataPromises[key] = promise;
      return nuxtApp._asyncDataPromises[key];
    },
    _execute: debounce((...args) => asyncData.execute(...args), 0, { leading: true }),
    _default: options.default,
    _deps: 0,
    _init: true,
    _hash: void 0,
    _off: () => {
      var _a2;
      unsubRefreshAsyncData();
      if ((_a2 = nuxtApp._asyncData[key]) == null ? void 0 : _a2._init) {
        nuxtApp._asyncData[key]._init = false;
      }
      if (!hasCustomGetCachedData) {
        nextTick(() => {
          var _a3;
          if (!((_a3 = nuxtApp._asyncData[key]) == null ? void 0 : _a3._init)) {
            clearNuxtDataByKey(nuxtApp, key);
            asyncData.execute = () => Promise.resolve();
            asyncData.data.value = asyncDataDefaults.value;
          }
        });
      }
    }
  };
  return asyncData;
}
const getDefault = () => asyncDataDefaults.value;
const getDefaultCachedData = (key, nuxtApp, ctx) => {
  if (nuxtApp.isHydrating) {
    return nuxtApp.payload.data[key];
  }
  if (ctx.cause !== "refresh:manual" && ctx.cause !== "refresh:hook") {
    return nuxtApp.static.data[key];
  }
};
function mergeAbortSignals(signals, cleanupSignal, timeout) {
  var _a, _b, _c;
  const list = signals.filter((s) => !!s);
  if (typeof timeout === "number" && timeout >= 0) {
    const timeoutSignal = (_a = AbortSignal.timeout) == null ? void 0 : _a.call(AbortSignal, timeout);
    if (timeoutSignal) {
      list.push(timeoutSignal);
    }
  }
  if (AbortSignal.any) {
    return AbortSignal.any(list);
  }
  const controller = new AbortController();
  for (const sig of list) {
    if (sig.aborted) {
      const reason = (_b = sig.reason) != null ? _b : new DOMException("Aborted", "AbortError");
      try {
        controller.abort(reason);
      } catch {
        controller.abort();
      }
      return controller.signal;
    }
  }
  const onAbort = () => {
    var _a2;
    const abortedSignal = list.find((s) => s.aborted);
    const reason = (_a2 = abortedSignal == null ? void 0 : abortedSignal.reason) != null ? _a2 : new DOMException("Aborted", "AbortError");
    try {
      controller.abort(reason);
    } catch {
      controller.abort();
    }
  };
  for (const sig of list) {
    (_c = sig.addEventListener) == null ? void 0 : _c.call(sig, "abort", onAbort, { once: true, signal: cleanupSignal });
  }
  return controller.signal;
}
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "index",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    const route = useRoute();
    const config = useRuntimeConfig();
    const encryptedId = computed(() => route.query.id || null);
    const { data: property, error, status } = ([__temp, __restore] = withAsyncContext(() => useAsyncData(
      `property-${encryptedId.value}`,
      () => {
        if (!encryptedId.value) {
          throw createError({ statusCode: 400, statusMessage: "ID de propiedad no proporcionado" });
        }
        return $fetch(`/api/wasi/property/${encryptedId.value}`);
      },
      { watch: false }
    )), __temp = await __temp, __restore(), __temp);
    const propertyTypeLabel = computed(
      () => {
        var _a;
        return getPropertyTypeLabel(((_a = property.value) == null ? void 0 : _a.id_property_type) || "");
      }
    );
    const errorMessage = computed(() => {
      if (!error.value) return "";
      const msg = error.value.statusMessage || error.value.message || "";
      if (msg.includes("disponible") || msg.includes("404")) {
        return "La propiedad solicitada no existe o no est\xE1 disponible.";
      }
      if (msg.includes("401") || msg.includes("unauthorized")) {
        return "Error de autenticaci\xF3n. Verifica la configuraci\xF3n del token API.";
      }
      return "La propiedad solicitada no existe o no est\xE1 disponible.";
    });
    const pageTitle = computed(() => {
      if (!property.value) return "Propiedad en Inmobarco";
      return `\u{1F3E0} ${property.value.title || "Propiedad"} - Inmobarco`;
    });
    const pageDescription = computed(() => {
      if (!property.value) return "Encuentra la propiedad perfecta | Tu hogar ideal te est\xE1 esperando";
      const p = property.value;
      const parts = [];
      if (p.bedrooms) parts.push(`${p.bedrooms} hab`);
      if (p.bathrooms) parts.push(`${p.bathrooms} ba\xF1os`);
      if (p.area) parts.push(`${p.area} m\xB2`);
      const details = parts.join(" \u2022 ") || "Hermosa propiedad";
      const price = p.for_rent === "true" ? p.rent_price_label : p.sale_price_label;
      const location = [p.zone_label, p.city_label].filter(Boolean).join(", ");
      return `${details} | ${price || "Consultar precio"} | ${location || "Excelente ubicaci\xF3n"}`;
    });
    const ogImage = computed(() => {
      var _a, _b;
      if (!((_b = (_a = property.value) == null ? void 0 : _a.galleries) == null ? void 0 : _b.length)) return `${config.public.siteUrl}/assets/images/Logo.png`;
      const gallery = property.value.galleries[0];
      const firstImg = gallery == null ? void 0 : gallery["0"];
      return (firstImg == null ? void 0 : firstImg.url_big) || (firstImg == null ? void 0 : firstImg.url) || `${config.public.siteUrl}/assets/images/Logo.png`;
    });
    useHead({
      title: pageTitle,
      meta: [
        { name: "description", content: pageDescription },
        { name: "keywords", content: "inmuebles, propiedades, venta, arriendo, Inmobarco" },
        // Open Graph
        { property: "og:type", content: "article" },
        { property: "og:site_name", content: "Inmobarco" },
        { property: "og:title", content: pageTitle },
        { property: "og:description", content: pageDescription },
        { property: "og:image", content: ogImage },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
        { property: "og:locale", content: "es_CO" },
        // Twitter
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:site", content: "@Inmobarco" },
        { name: "twitter:title", content: pageTitle },
        { name: "twitter:description", content: pageDescription },
        { name: "twitter:image", content: ogImage }
      ]
    });
    useHead({
      script: [
        {
          type: "application/ld+json",
          innerHTML: computed(() => {
            var _a;
            return JSON.stringify({
              "@context": "https://schema.org",
              "@type": "RealEstate",
              "name": ((_a = property.value) == null ? void 0 : _a.title) || "Propiedad en Inmobarco",
              "description": pageDescription.value,
              "provider": {
                "@type": "RealEstateAgent",
                "name": "Inmobarco",
                "url": "https://inmobarco.com",
                "telephone": "+57 304 525 8750",
                "email": "comercial@inmobarco.com"
              }
            });
          })
        }
      ]
    });
    const galleryRef = ref(null);
    const downloadRef = ref(null);
    const galleryImages = computed(() => {
      var _a;
      return ((_a = galleryRef.value) == null ? void 0 : _a.images) || [];
    });
    function downloadPhotos() {
      var _a;
      (_a = downloadRef.value) == null ? void 0 : _a.downloadAllPhotos();
    }
    return (_ctx, _push, _parent, _attrs) => {
      var _a;
      const _component_PropertyHeader = __nuxt_component_0;
      const _component_PropertyGallery = _sfc_main$7;
      const _component_PropertyFeatures = _sfc_main$6;
      const _component_PropertyDescription = _sfc_main$5;
      const _component_PropertyCharacteristics = _sfc_main$4;
      const _component_PropertyMap = _sfc_main$3;
      const _component_PropertyContact = _sfc_main$2;
      const _component_PropertyDownload = __nuxt_component_7;
      _push(`<div${ssrRenderAttrs(_attrs)}>`);
      _push(ssrRenderComponent(_component_PropertyHeader, null, null, _parent));
      _push(`<div class="container">`);
      if (unref(status) === "pending") {
        _push(`<div class="loading"> Cargando detalles de la propiedad... </div>`);
      } else if (unref(error)) {
        _push(`<div class="error" style="${ssrRenderStyle({ "display": "block" })}">${ssrInterpolate(unref(errorMessage))}</div>`);
      } else if (unref(property)) {
        _push(`<div id="property-content" style="${ssrRenderStyle({ "display": "block" })}"><div class="property-layout">`);
        _push(ssrRenderComponent(_component_PropertyGallery, {
          ref_key: "galleryRef",
          ref: galleryRef,
          galleries: unref(property).galleries || [],
          "alt-text": `${unref(property).clase_inmueble || "Inmueble"} en ${unref(property).municipio || ""}`,
          onDownload: downloadPhotos
        }, null, _parent));
        _push(`<div class="property-main"><div class="property-content"><div class="property-info"><h1 class="property-title">${ssrInterpolate(unref(property).title || "Propiedad")}</h1>`);
        if (unref(property).for_rent === "true") {
          _push(`<div class="property-price"><span class="price-label">Precio Arriendo</span> ${ssrInterpolate(unref(property).rent_price_label)}</div>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(property).for_sale === "true") {
          _push(`<div class="property-price"><span class="price-label">Precio Venta</span> ${ssrInterpolate(unref(property).sale_price_label)}</div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<div class="property-badges"><span class="property-badge type">${ssrInterpolate(unref(propertyTypeLabel))}</span>`);
        if (unref(property).for_rent === "true") {
          _push(`<span class="property-badge primary">Arriendo</span>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(property).for_sale === "true") {
          _push(`<span class="property-badge primary">Venta</span>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(property).stratum) {
          _push(`<span class="property-badge">Estrato ${ssrInterpolate(unref(property).stratum)}</span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
        _push(ssrRenderComponent(_component_PropertyFeatures, { property: unref(property) }, null, _parent));
        _push(`</div>`);
        _push(ssrRenderComponent(_component_PropertyDescription, { property: unref(property) }, null, _parent));
        _push(ssrRenderComponent(_component_PropertyCharacteristics, { property: unref(property) }, null, _parent));
        _push(ssrRenderComponent(_component_PropertyMap, { property: unref(property) }, null, _parent));
        _push(`</div></div></div>`);
        _push(ssrRenderComponent(_component_PropertyContact, { property: unref(property) }, null, _parent));
        _push(`</div>`);
      } else {
        _push(`<div class="error" style="${ssrRenderStyle({ "display": "block" })}"> No se proporcion\xF3 un ID de propiedad v\xE1lido. </div>`);
      }
      _push(`</div>`);
      _push(ssrRenderComponent(_component_PropertyDownload, {
        ref_key: "downloadRef",
        ref: downloadRef,
        images: unref(galleryImages),
        "property-ref": String(((_a = unref(property)) == null ? void 0 : _a.id_property) || "propiedad")
      }, null, _parent));
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=index-q__y3Sf3.mjs.map
