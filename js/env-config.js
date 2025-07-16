// Environment configuration handler
class EnvConfig {
    constructor() {
        this.config = null;
        this.isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
    }

    async loadConfig() {
        try {
            if (this.isProduction) {
                // In production (Netlify), use environment variables injected at build time
                this.config = {
                    api: {
                        baseUrl: window.ENV?.VITE_API_BASE_URL || 'https://inmobarco.arrendasoft.co/service/v2/public',
                        token: window.ENV?.VITE_API_TOKEN || '',
                        instance: window.ENV?.VITE_API_INSTANCE || 'inmobarco'
                    },
                    company: {
                        name: window.ENV?.VITE_COMPANY_NAME || 'Inmobarco',
                        phone: window.ENV?.VITE_COMPANY_PHONE || '573045258750',
                        email: window.ENV?.VITE_COMPANY_EMAIL || 'comercial@inmobarco.com'
                    }
                };
            } else {
                // In development, load from config.json
                const response = await fetch('config.json');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                this.config = await response.json();
            }
            
            return this.config;
        } catch (error) {
            console.error('Error loading configuration:', error);
            
            // Fallback configuration
            this.config = {
                api: {
                    baseUrl: 'https://inmobarco.arrendasoft.co/service/v2/public',
                    token: '',
                    instance: 'inmobarco'
                },
                company: {
                    name: 'Inmobarco',
                    phone: '573045258750',
                    email: 'comercial@inmobarco.com'
                }
            };
            
            return this.config;
        }
    }

    getApiConfig() {
        return this.config?.api || null;
    }

    getCompanyConfig() {
        return this.config?.company || null;
    }

    isConfigLoaded() {
        return this.config !== null;
    }
}

// Global instance
window.envConfig = new EnvConfig();
