// Environment configuration handler
class EnvConfig {
    constructor() {
        this.config = null;
        this.isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
    }

    async loadConfig() {
        try {
            if (this.isProduction) {
                // In production (Netlify), try to use environment variables
                console.log('Loading production configuration...');
                
                // Check if environment variables are available
                const hasEnvVars = window.ENV && 
                                  window.ENV.VITE_API_BASE_URL && 
                                  window.ENV.VITE_API_BASE_URL !== '{{VITE_API_BASE_URL}}' &&
                                  window.ENV.VITE_API_TOKEN && 
                                  window.ENV.VITE_API_TOKEN !== '{{VITE_API_TOKEN}}';

                if (hasEnvVars) {
                    console.log('Using environment variables');
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
                        }
                    };
                } else {
                    // Fallback: try to load from config.json even in production
                    console.log('Environment variables not found, trying config.json...');
                    const response = await fetch('config.json');
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    this.config = await response.json();
                }
            } else {
                // In development, load from config.json
                console.log('Loading development configuration from config.json...');
                const response = await fetch('config.json');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                this.config = await response.json();
            }
            
            console.log('Configuration loaded successfully:', {
                hasApiUrl: !!this.config.api?.baseUrl,
                hasToken: !!this.config.api?.token,
                instance: this.config.api?.instance
            });
            
            return this.config;
        } catch (error) {
            console.error('Error loading configuration:', error);
            
            // Fallback configuration
            console.log('Using fallback configuration');
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
