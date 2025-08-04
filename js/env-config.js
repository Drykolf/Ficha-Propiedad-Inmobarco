// Environment configuration handler - Optimized for performance and error handling
class EnvConfig {
    constructor() {
        this.config = null;
        this.isLoading = false;
        this.loadPromise = null;
    }

    async loadConfig() {
        // Prevent multiple simultaneous loads
        if (this.isLoading && this.loadPromise) {
            return this.loadPromise;
        }

        if (this.config) {
            return this.config;
        }

        this.isLoading = true;
        this.loadPromise = this._loadConfigInternal();

        try {
            this.config = await this.loadPromise;
            return this.config;
        } finally {
            this.isLoading = false;
            this.loadPromise = null;
        }
    }

    async _loadConfigInternal() {
        try {
            // Check for environment variables first (production)
            if (this._hasValidEnvVars()) {
                logger.debug('✅ Using environment variables for configuration');
                return this._createConfigFromEnv();
            }
            
            // Fallback to config.json (development)
            logger.debug('⚠️ Environment variables not found, attempting to load config.json...');
            return await this._loadFromConfigFile();

        } catch (error) {
            console.error('❌ Error loading configuration:', error);
            throw new Error(`Configuration loading failed: ${error.message}`);
        }
    }

    _hasValidEnvVars() {
        const env = window.ENV;
        return env &&
               this._isValidEnvVar(env.VITE_API_BASE_URL) &&
               this._isValidEnvVar(env.VITE_API_TOKEN);
    }

    _isValidEnvVar(value) {
        return value && 
               value !== '' && 
               !value.startsWith('{{') && 
               !value.endsWith('}}');
    }

    _createConfigFromEnv() {
        const env = window.ENV;
        return {
            api: {
                baseUrl: env.VITE_API_BASE_URL,
                token: env.VITE_API_TOKEN,
                instance: env.VITE_API_INSTANCE || 'inmobarco'
            },
            wasi: {
                apiUrl: env.WASI_API_URL || 'https://api.wasi.co/v1',
                apiToken: env.WASI_API_TOKEN,
                apiId: env.WASI_API_ID
            },
            company: {
                name: env.VITE_COMPANY_NAME || 'Inmobarco',
                phone: env.VITE_COMPANY_PHONE || '573045258750',
                email: env.VITE_COMPANY_EMAIL || 'comercial@inmobarco.com'
            },
            encryption: {
                key: env.VITE_ENCRYPTION_KEY,
                salt: env.VITE_ENCRYPTION_SALT
            },
            propertiesKey: env.PROPERTIES_KEY || '123'
        };
    }

    async _loadFromConfigFile() {
        // Detectar si estamos en la carpeta manager
        const isInManager = window.location.pathname.includes('/manager/');
        const configPath = isInManager ? '../config.json' : './config.json';

        try {
            const response = await fetch(configPath);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const config = await response.json();
            
            if (!this._validateConfig(config)) {
                throw new Error('Invalid configuration structure');
            }

            return config;

        } catch (error) {
            if (error.name === 'SyntaxError') {
                throw new Error('Invalid JSON in config.json');
            }
            throw new Error(`Failed to load config.json: ${error.message}`);
        }
    }

    _validateConfig(config) {
        return config &&
               config.api &&
               config.api.baseUrl &&
               config.api.token;
    }

    getApiConfig() {
        return this.config?.api || null;
    }

    getWasiConfig() {
        return this.config?.wasi || null;
    }

    getPropertiesKey() {
        return this.config?.propertiesKey || null;
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
