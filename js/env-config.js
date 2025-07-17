// Environment configuration handler - Loads from config.json locally, env vars in production
class EnvConfig {
    constructor() {
        this.config = null;
    }

    async loadConfig() {
        try {
            // Check if we have environment variables (Netlify production)
            const hasEnvVars = window.ENV && 
                              window.ENV.VITE_API_BASE_URL && 
                              window.ENV.VITE_API_BASE_URL !== '{{VITE_API_BASE_URL}}' &&
                              window.ENV.VITE_API_TOKEN && 
                              window.ENV.VITE_API_TOKEN !== '{{VITE_API_TOKEN}}' &&
                              window.ENV.VITE_API_TOKEN !== '';
                              window.ENV.VITE_API_TOKEN !== '{{VITE_API_TOKEN}}' &&
                              window.ENV.VITE_API_TOKEN !== '';

            if (hasEnvVars) {
                this.config = {
                    api: {
                        baseUrl: window.ENV.VITE_API_BASE_URL,
                        token: window.ENV.VITE_API_TOKEN,
                        instance: window.ENV.VITE_API_INSTANCE || 'inmobarco'
                    },
                    company: {
                        name: window.ENV.VITE_COMPANY_NAME || 'Inmobarco',
                        phone: window.ENV.VITE_COMPANY_PHONE || '573045258750',
                        email: window.ENV.VITE_COMPANY_EMAIL || 'comercial@inmobarco.com'
                    },
                    encryption: {
                        key: window.ENV.VITE_ENCRYPTION_KEY,
                        salt: window.ENV.VITE_ENCRYPTION_SALT
                        key: window.ENV.VITE_ENCRYPTION_KEY,
                        salt: window.ENV.VITE_ENCRYPTION_SALT
                    }
                };
            } else {
                try {
                    // Try to load from config.json for local development
                    const response = await fetch('./config.json');
                    if (response.ok) {
                        const localConfig = await response.json();
                        this.config = localConfig;
                    } else {
                        throw new Error('config.json not found');
                    }
                } catch (error) {
                    console.error('❌ Could not load config.json:', error.message);
                    throw new Error('Configuration not available. Please check your setup.');
                }
            }
            
            return this.config;
        } catch (error) {
            console.error('❌ Error loading configuration:', error);
            throw error;
        }
    }

    getApiConfig() {
        return this.config?.api || null;
    }

    getCompanyConfig() {
        return this.config?.company || null;
    }

    getEncryptionConfig() {
        return this.config?.encryption || null;
    }

    isConfigLoaded() {
        return this.config !== null;
    }
}

// Global instance
window.envConfig = new EnvConfig();
