// Development Configuration
// Copy this file to config.js and customize your settings

// Configuration Manager - Loads API credentials from external config.json
class ConfigManager {
    constructor() {
        this.baseConfig = null;
        this.externalConfig = null;
        this.mergedConfig = null;
        this.loaded = false;
    }

    // Load external configuration from config.json
    async loadExternalConfig() {
        try {
            const response = await fetch('./config.json');
            if (response.ok) {
                this.externalConfig = await response.json();
                console.log('✅ External configuration loaded from config.json');
                return this.externalConfig;
            } else {
                console.warn('⚠️ config.json not found, API credentials will need to be configured');
                return null;
            }
        } catch (error) {
            console.warn('⚠️ Failed to load config.json:', error.message);
            return null;
        }
    }

    // Get base configuration (without API credentials)
    getBaseConfig() {
        return {
    // Development/Production mode
    ENVIRONMENT: 'development', // 'development' | 'production'
    
    // API Configuration (credentials loaded from config.json)
    API: {
        // API credentials will be loaded from config.json
        BASE_URL: null, // Will be set from config.json
        TOKEN: null,    // Will be set from config.json
        INSTANCE: null, // Will be set from config.json
        
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
    
    // Contact Information (some values loaded from config.json)
    CONTACT: {
        // WhatsApp number (loaded from config.json or fallback)
        WHATSAPP: null, // Will be set from config.json
        
        // Email addresses (loaded from config.json or fallback)
        EMAIL: {
            GENERAL: null, // Will be set from config.json
            SALES: null,   // Will be set from config.json
            SUPPORT: 'administrativo@inmobarco.com'
        },
        
        // Phone numbers (loaded from config.json or fallback)
        PHONE: {
            MAIN: null,    // Will be set from config.json
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
    }

    // Merge base config with external config
    mergeConfigs() {
        if (!this.baseConfig) {
            this.baseConfig = this.getBaseConfig();
        }

        const merged = { ...this.baseConfig };

        if (this.externalConfig) {
            // Merge API configuration
            if (this.externalConfig.api) {
                merged.API.BASE_URL = this.externalConfig.api.baseUrl || merged.API.BASE_URL;
                merged.API.TOKEN = this.externalConfig.api.token || merged.API.TOKEN;
                merged.API.INSTANCE = this.externalConfig.api.instance || merged.API.INSTANCE;
            }

            // Merge company/contact configuration
            if (this.externalConfig.company) {
                merged.CONTACT.WHATSAPP = this.externalConfig.company.phone || merged.CONTACT.WHATSAPP;
                merged.CONTACT.EMAIL.GENERAL = this.externalConfig.company.email || merged.CONTACT.EMAIL.GENERAL;
                merged.CONTACT.EMAIL.SALES = this.externalConfig.company.email || merged.CONTACT.EMAIL.SALES;
                merged.CONTACT.PHONE.MAIN = this.externalConfig.company.phone || merged.CONTACT.PHONE.MAIN;
                merged.COMPANY.NAME = this.externalConfig.company.name || merged.COMPANY.NAME;
            }
        }

        return merged;
    }

    // Get complete configuration
    async getConfig() {
        if (!this.loaded) {
            await this.loadExternalConfig();
            this.mergedConfig = this.mergeConfigs();
            this.loaded = true;
        }
        return this.mergedConfig;
    }

    // Check if API is configured
    isAPIConfigured() {
        return this.mergedConfig && 
               this.mergedConfig.API.BASE_URL && 
               this.mergedConfig.API.TOKEN && 
               this.mergedConfig.API.INSTANCE;
    }
}

// Create global config manager
const configManager = new ConfigManager();

// Async function to get configuration
async function getConfig() {
    return await configManager.getConfig();
}

// Initialize configuration and set global CONFIG
let CONFIG = null;

// Auto-load configuration
(async () => {
    try {
        CONFIG = await getConfig();
        
        // Set global CONFIG for backward compatibility
        if (typeof window !== 'undefined') {
            window.CONFIG = CONFIG;
        }

        // Validate API configuration
        if (!configManager.isAPIConfigured()) {
            console.error('❌ API configuration incomplete. Please check config.json file.');
            console.log('📋 Required in config.json:', {
                api: {
                    baseUrl: 'https://your-instance.arrendasoft.co/service/v2/public',
                    token: 'your-api-token',
                    instance: 'your-instance'
                }
            });
        } else {
            console.log('✅ Configuration loaded successfully');
        }

    } catch (error) {
        console.error('❌ Failed to load configuration:', error);
    }
})();

// Export configuration
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { getConfig, configManager };
} else {
    window.getConfig = getConfig;
    window.configManager = configManager;
}

// Development helpers - available after config loads
setTimeout(async () => {
    const config = await getConfig();
    
    if (config && config.ENVIRONMENT === 'development') {
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
                console.log('Current configuration:', config);
            },
            reloadConfig: async () => {
                configManager.loaded = false;
                configManager.externalConfig = null;
                const newConfig = await configManager.getConfig();
                window.CONFIG = newConfig;
                console.log('Configuration reloaded:', newConfig);
                return newConfig;
            },
            validateAPI: () => {
                const isValid = configManager.isAPIConfigured();
                console.log('API Configuration valid:', isValid);
                if (!isValid) {
                    console.log('Missing API configuration. Check config.json');
                }
                return isValid;
            }
        };
        
        console.log('🚀 Development mode enabled');
        console.log('💡 Use window.debugAPI for debugging helpers');
        console.log('📋 Available commands: testProperty(id), clearCache(), logConfig(), reloadConfig(), validateAPI()');
    }
}, 100);
