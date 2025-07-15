// Development Configuration
// Copy this file to config.js and customize your settings

const CONFIG = {
    // Development/Production mode
    ENVIRONMENT: 'development', // 'development' | 'production'
    
    // API Configuration
    API: {
        // Arrendasoft V2 API
        BASE_URL: 'https://inmobarco.arrendasoft.co/service/v2/public',
        TOKEN: 'a8aafd47096445904ad4308cd0bfb9f485709569-70k3n',
        INSTANCE: 'inmobarco',
        
        // API Endpoints
        ENDPOINTS: {
            LOGIN: '/login',
            PROPERTIES: '/properties',
            AGENTS: '/agents',
            FEATURES: '/masters/properties/features'
        },
        
        // Request timeout in milliseconds
        TIMEOUT: 10000,
        
        // Retry configuration
        RETRY: {
            ATTEMPTS: 3,
            DELAY: 1000
        }
    },
    
    // Contact Information
    CONTACT: {
        // WhatsApp number (with country code, no + sign)
        WHATSAPP: '573045258750',
        
        // Email addresses
        EMAIL: {
            GENERAL: 'administrativo@inmobarco.com',
            SALES: 'comercial@inmobarco.com',
            SUPPORT: 'administrativo@inmobarco.com'
        },
        
        // Phone numbers
        PHONE: {
            MAIN: '573045258750',
            OFFICE: '573025989760'
        }
    },
    
    // Company Information
    COMPANY: {
        NAME: 'Inmobarco',
        WEBSITE: 'https://inmobarco.com',
        LOGO: '/assets/images/logo.png',
        
        // Social Media
        SOCIAL: {
            FACEBOOK: 'https://facebook.com/inmobarco',
            INSTAGRAM: 'https://instagram.com/inmobarco',
            TWITTER: 'https://twitter.com/inmobarco',
            LINKEDIN: 'https://linkedin.com/company/inmobarco'
        }
    },
    
    // UI Configuration
    UI: {
        // Default images
        DEFAULT_PROPERTY_IMAGE: '/assets/images/default-property.jpg',
        DEFAULT_AGENT_IMAGE: '/assets/images/default-agent.jpg',
        
        // Currency formatting
        CURRENCY: {
            LOCALE: 'es-CO',
            CURRENCY: 'COP'
        },
        
        // Map configuration (if implementing maps)
        MAP: {
            DEFAULT_ZOOM: 15,
            DEFAULT_CENTER: {
                lat: 4.6097,
                lng: -74.0817
            }
        }
    },
    
    // SEO Configuration
    SEO: {
        DEFAULT_TITLE: 'Detalles de Propiedad - Inmobarco',
        DEFAULT_DESCRIPTION: 'Encuentra la propiedad perfecta en Inmobarco. Propiedades en venta y arriendo con la mejor ubicación y precios.',
        KEYWORDS: 'inmuebles, propiedades, venta, arriendo, Inmobarco, bienes raíces',
        
        // Open Graph
        OG_IMAGE: '/assets/images/og-image.jpg',
        OG_SITE_NAME: 'Inmobarco'
    },
    
    // Analytics (optional)
    ANALYTICS: {
        GOOGLE_ANALYTICS_ID: '', // GA4 Measurement ID
        FACEBOOK_PIXEL_ID: '',
        HOTJAR_ID: ''
    },
    
    // Error handling
    ERROR_HANDLING: {
        SHOW_DETAILED_ERRORS: true, // Set to false in production
        LOG_ERRORS_TO_CONSOLE: true,
        SENTRY_DSN: '' // Optional: Sentry for error tracking
    },
    
    // Performance
    PERFORMANCE: {
        LAZY_LOAD_IMAGES: true,
        PRELOAD_CRITICAL_RESOURCES: true,
        CACHE_API_RESPONSES: true,
        CACHE_DURATION: 5 * 60 * 1000 // 5 minutes in milliseconds
    }
};

// Export configuration
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
} else {
    window.CONFIG = CONFIG;
}

// Development helpers
if (CONFIG.ENVIRONMENT === 'development') {
    // Add debug helpers
    window.debugAPI = {
        testProperty: (id) => {
            window.location.href = `${window.location.pathname}?id=${id}`;
        },
        clearCache: () => {
            localStorage.clear();
            sessionStorage.clear();
            console.log('Cache cleared');
        },
        logConfig: () => {
            console.log('Current configuration:', CONFIG);
        }
    };
    
    console.log('🚀 Development mode enabled');
    console.log('💡 Use window.debugAPI for debugging helpers');
    console.log('📋 Available commands: testProperty(id), clearCache(), logConfig()');
}
