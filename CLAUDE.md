# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Real estate property detail page for Inmobarco (Colombian real estate company). Built with **Nuxt 3** (Vue 3 + Nitro), deployed on **Netlify** with SSR. Primary API is **WASI** (wasi.co).

## Commands

- **Dev server:** `npm run dev` (Nuxt dev server with HMR)
- **Build:** `npm run build` (Nuxt build with Nitro for Netlify)
- **Preview:** `npm run preview` (preview production build locally)
- **Prepare:** `npm run postinstall` (generates `.nuxt/` types)
- No test framework or linter is configured yet.

## Architecture

### SSR + Hydration

Nuxt 3 SSR renders the page server-side (meta tags for social sharing, SEO) and hydrates on the client. Property data is fetched once on the server via `useAsyncData` and passed to the client — no double fetch.

### Entry Point

- **`pages/index.vue`** — Main property detail page
  - URL format: `/?id={encryptedPropertyId}`
  - Decrypts property ID via XOR cipher (`server/utils/property-encryption.ts`)
  - Fetches from `/api/wasi/property/:id` (Nitro server route)
  - SSR meta tags via `useHead()` (replaces old `hello.js` Netlify function)

### Server Routes (Nitro)

All WASI API calls go through Nitro server routes — no CORS, credentials stay server-side:

- **`server/api/wasi/property/[id].get.ts`** — GET single property (decrypts ID if encrypted)
- **`server/api/wasi/search.post.ts`** — POST property search with filters
- **`server/api/wasi/image-proxy.get.ts`** — Proxies images for ZIP download (avoids CORS)
- **`server/utils/wasi-client.ts`** — Shared WASI API client (`fetchWasiProperty`, `searchWasiProperties`)
- **`server/utils/property-encryption.ts`** — XOR cipher + URL-safe Base64

### Configuration

- **`.env`** — All env vars, read by Nuxt's `useRuntimeConfig()`. No build-env.js, no env-vars.js, no env-config.js.
- **`nuxt.config.ts`** — `runtimeConfig.wasi.*` and `runtimeConfig.encryption.*` are server-only. `runtimeConfig.public.*` is available in browser.

### Components

- **`PropertyGallery.vue`** — Image gallery with modal, navigation, thumbnails
- **`PropertyFeatures.vue`** — Bedrooms, bathrooms, area, parking
- **`PropertyDescription.vue`** — Property description text
- **`PropertyCharacteristics.vue`** — Internal/external feature checklists
- **`PropertyMap.vue`** — Leaflet map with nearby places (Overpass API), location search (Photon), travel times (OSRM)
- **`PropertyContact.vue`** — Property reference code
- **`PropertyDownload.vue`** — ZIP photo download (uses image-proxy server route)
- **`PropertyHeader.vue`** — Site header with logo

### Data Flow

1. Page loads → Nuxt SSR runs `useAsyncData`
2. Server route decrypts `?id=` param → fetches from WASI API directly (no CORS)
3. Property data is rendered server-side (HTML + meta tags) and hydrated on client
4. Map, nearby places, and gallery interactions are client-side only

## Environment Variables

Set in Netlify dashboard or `.env` locally:

| Variable | Scope | Purpose |
|----------|-------|---------|
| `WASI_API_URL` | Server | WASI API base URL |
| `WASI_API_TOKEN` | Server | WASI API authentication |
| `WASI_API_ID` | Server | WASI company ID |
| `ENCRYPTION_KEY` | Server | XOR encryption key |
| `ENCRYPTION_SALT` | Server | Encryption salt |
| `COMPANY_NAME` | Public | Company display name |
| `COMPANY_PHONE` | Public | WhatsApp/phone number |
| `COMPANY_EMAIL` | Public | Contact email |
| `SITE_URL` | Public | Canonical site URL |

## Important Conventions

- **Language:** UI text is in Spanish (Colombian). Error messages, labels, and user-facing strings must remain in Spanish.
- **Currency:** Prices are formatted in COP (Colombian Pesos).
- **Secrets are git-ignored:** `.env` and `.env.local` are in `.gitignore`. Never commit API tokens or encryption keys.
- **CSS:** Global stylesheet `assets/css/property-detail.css` with CSS custom properties for theming (primary: `#1B99D3`).
- **No external CORS proxies:** All API calls go through Nitro server routes. Never use allorigins.win or corsproxy.io.
