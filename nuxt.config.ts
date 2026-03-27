export default defineNuxtConfig({
  ssr: true,
  compatibilityDate: '2025-01-01',

  experimental: {
    appManifest: false,
  },

  runtimeConfig: {
    // Server-only (never exposed to browser)
    wasi: {
      apiUrl: process.env.WASI_API_URL || 'https://api.wasi.co/v1',
      apiToken: process.env.WASI_API_TOKEN || '',
      apiId: process.env.WASI_API_ID || '',
    },
    encryption: {
      key: process.env.ENCRYPTION_KEY || '',
      salt: process.env.ENCRYPTION_SALT || '',
    },
    // Public (available in browser)
    public: {
      companyName: process.env.COMPANY_NAME || 'Inmobarco',
      companyPhone: process.env.COMPANY_PHONE || '573045258750',
      companyEmail: process.env.COMPANY_EMAIL || 'comercial@inmobarco.com',
      siteUrl: process.env.SITE_URL || 'https://ficha.inmobarco.com',
    },
  },

  app: {
    head: {
      htmlAttrs: { lang: 'es' },
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      link: [
        { rel: 'icon', type: 'image/png', href: '/assets/images/Logo.png' },
        { rel: 'apple-touch-icon', href: '/assets/images/Logo.png' },
      ],
    },
  },

  css: ['~/assets/css/property-detail.css'],

  modules: [],

  nitro: {
    preset: 'netlify',
  },
})
