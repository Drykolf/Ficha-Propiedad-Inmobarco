import { WasiPropertyDetailController } from "./api/wasi-api.js";


// Create a global logger instance for WASI API
const logger = new Logger();

function initEncryption(config) {
    // Initialize encryption module with config
    if (window.propertyEncryption) {
        const encryptionSuccess = window.propertyEncryption.init(config.encryption);
        if (!encryptionSuccess) {
            throw new Error('Failed to initialize encryption module');
        }
    } else {
        throw new Error('Property encryption module not available');
    }
    logger.debug('✅ Encryption module initialized successfully');
}

function getPropertyIdFromUrl() {
        // ONLY use the encryption module - no fallbacks
        if (!window.propertyEncryption) {
            logger.error('❌ Property encryption module not available. Cannot process property ID.');
            return null;
        }
        if (!window.propertyEncryption.initialized) {
            logger.error('❌ Property encryption module not initialized.');
            return null;
        }
        const urlPropertyId = window.propertyEncryption.getPropertyIdFromUrl();
        if (!urlPropertyId) {
            logger.error('❌ Failed to get encrypted property ID from URL');
            return null;
        }
        return urlPropertyId;
    }

function getPropertyId(){
    let propertyId = null;
    // Intentar obtener ID de la URL (encriptada)
    const urlPropertyId = getPropertyIdFromUrl();

    if (urlPropertyId) {
        propertyId = urlPropertyId;
        logger.debug('✅ Property ID obtenido de URL (desencriptado):', propertyId);
    }
    else {
        throw new Error('❌ No se pudo obtener el ID de propiedad');
    }
    return propertyId;
}

function hideLoading() {// Hide loading state
    const loadingEl = document.getElementById('loading');
    if (loadingEl) loadingEl.style.display = 'none';
}

function showError(message) {// Show error state
    const errorEl = document.getElementById('error');
    const contentEl = document.getElementById('property-content');

    if (errorEl) {
        errorEl.textContent = message;
        errorEl.style.display = 'block';
    }

    if (contentEl) contentEl.style.display = 'none';
}
// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Load configuration first
        const envConfig = new EnvConfig();
        const config = await envConfig.loadConfig();
        if (!config) {
            throw new Error('Failed to load configuration');
        }
        logger.debug('✅ Configuration loaded successfully');
        // Initialize encryption
        initEncryption(config);
        const propertyId = getPropertyId();
        // Store company configuration globally for contact methods
        window.companyConfig = config.company;
        let apiModule;
        logger.debug('✅ Using WASI API for property ID:', propertyId);
        apiModule = new WasiPropertyDetailController(config.wasi,propertyId);
        await apiModule.init();
    } catch (error) {
        logger.error('❌ Error loading property:', error);
        let errorMessage = error.message;
        if (error.message.includes('Property ID not found')) {
            errorMessage = 'La propiedad solicitada no existe o no está disponible.';
        } else if (error.message.includes('Property is not active')) {
            errorMessage = 'La propiedad solicitada no existe o no está disponible.';
        } else if (error.message.includes('404') || error.message.includes('not found')) {
            errorMessage = 'La propiedad solicitada no existe o no está disponible.';
        } else if (error.message.includes('401') || error.message.includes('unauthorized')) {
            errorMessage = 'Error de autenticación. Verifica la configuración del token API.';
        }
        showError(errorMessage);
    } finally {
        hideLoading();
    }
});
