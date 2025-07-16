// Environment configuration handler - Simplified to use only .env variables
class EnvConfig {
    constructor() {
        this.config = null;
    }

    async loadConfig() {
        try {
            console.log('🔧 Loading configuration from environment variables...');
            
            // Always try to use environment variables first
            const hasEnvVars = window.ENV && 
                              window.ENV.VITE_API_BASE_URL && 
                              window.ENV.VITE_API_BASE_URL !== '{{VITE_API_BASE_URL}}' &&
                              window.ENV.VITE_API_TOKEN && 
                              window.ENV.VITE_API_TOKEN !== '{{VITE_API_TOKEN}}';

            if (hasEnvVars) {
                console.log('✅ Using environment variables');
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
                        key: window.ENV.VITE_ENCRYPTION_KEY || 'InmobarcoDefault',
                        salt: window.ENV.VITE_ENCRYPTION_SALT || 'DefaultSalt'
                    }
                };
            } else {
                console.log('⚠️ Environment variables not found, using fallback configuration');
                // Fallback configuration for development
                this.config = {
                    api: {
                        baseUrl: 'https://inmobarco.arrendasoft.co/service/v2/public',
                        token: 'a8aafd47096445904ad4308cd0bfb9f485709569-70k3n',
                        instance: 'inmobarco'
                    },
                    company: {
                        name: 'Inmobarco',
                        phone: '573045258750',
                        email: 'comercial@inmobarco.com'
                    },
                    encryption: {
                        key: 'InmobarcoSecretKey2025',
                        salt: 'PropertySalt'
                    }
                };
            }
            
            console.log('📋 Configuration loaded successfully:', {
                hasApiUrl: !!this.config.api?.baseUrl,
                hasToken: !!this.config.api?.token,
                instance: this.config.api?.instance,
                hasEncryption: !!this.config.encryption?.key
            });
            
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
