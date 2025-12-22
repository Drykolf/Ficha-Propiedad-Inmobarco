// Importar logger
const logger = window.logger || console;

// Función para cargar configuración
async function loadConfig() {
    await window.envConfig.loadConfig();
    return window.envConfig.config;
}

// Main WASI API class
class WasiAPI {
    constructor(config) {
        this.baseUrl = config.apiUrl;
        this.companyId = config.apiId;
        this.token = config.apiToken;
    }

    // Construir URL usando diferentes métodos dependiendo del entorno
    buildApiUrl(endpoint, propertyId = null) {
        // Para desarrollo local, intentamos diferentes enfoques
        const isLocal = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1' ||
                       window.location.hostname.includes('localhost');
        
        if (isLocal) {
            // Opción 1: Proxy local (si está disponible)
            try {
                const proxyUrl = new URL('http://localhost:8888/.netlify/functions/wasi-proxy');
                proxyUrl.searchParams.append('endpoint', endpoint);
                proxyUrl.searchParams.append('id_company', this.companyId);
                proxyUrl.searchParams.append('wasi_token', this.token);
                
                if (propertyId) {
                    proxyUrl.searchParams.append('property_id', propertyId);
                }
                
                return { url: proxyUrl.toString(), type: 'proxy' };
            } catch (e) {
                // Fallback a método directo
                return this.buildDirectUrl(endpoint, 'direct');
            }
        } else {
            // Producción: usar Netlify functions
            const baseUrl = '/.netlify/functions';
            const proxyUrl = new URL(`${baseUrl}/wasi-proxy`, window.location.origin);
            
            proxyUrl.searchParams.append('endpoint', endpoint);
            proxyUrl.searchParams.append('id_company', this.companyId);
            proxyUrl.searchParams.append('wasi_token', this.token);
            
            if (propertyId) {
                proxyUrl.searchParams.append('property_id', propertyId);
            }
            
            return { url: proxyUrl.toString(), type: 'netlify' };
        }
    }

    // Construir URL directa con CORS workaround
    buildDirectUrl(endpoint, type = 'direct') {
        const url = new URL(`${this.baseUrl}${endpoint}`);
        url.searchParams.append('id_company', this.companyId);
        url.searchParams.append('wasi_token', this.token);
        return { url: url.toString(), type };
    }

    // Método alternativo usando CORS proxy público (solo para desarrollo)
    buildCorsProxyUrl(endpoint) {
        const directUrl = this.buildDirectUrl(endpoint);
        // Usar un proxy CORS público solo para pruebas de desarrollo
        const corsProxy = 'https://api.allorigins.win/raw?url=';
        return { 
            url: corsProxy + encodeURIComponent(directUrl.url), 
            type: 'cors-proxy' 
        };
    }

    // Obtener información de una propiedad - OPTIMIZADO con Netlify function primero
    async getProperty(propertyId = null) {
        const id = propertyId || this.propertyId;
        const endpoint = `/property/get/${id}`;
        
        // Intentar primero con Netlify function (MUY RÁPIDO)
        try {
            const netlifyUrl = this.buildApiUrl(endpoint, id);
            logger.debug(`🚀 Intentando con Netlify function (${netlifyUrl.type}):`, netlifyUrl.url);
            
            const response = await this.fetchWithTimeout(netlifyUrl.url, {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            }, 8000);
            
            if (response.ok) {
                const data = await response.json();
                logger.info(`✅ Propiedad ${id} cargada exitosamente (${netlifyUrl.type})`);
                return data;
            }
            
            logger.warn(`⚠️ Netlify function respondió con error ${response.status}, intentando fallbacks...`);
        } catch (error) {
            logger.warn(`❌ Netlify function falló: ${error.message}, intentando proxies CORS...`);
        }
        
        // Fallback: Múltiples proxies CORS públicos (MÁS LENTOS)
        const corsProxies = [
            'https://corsproxy.io/?',
            'https://api.codetabs.com/v1/proxy?quest='
        ];
        
        // Construir URL directa
        const directUrl = this.buildDirectUrl(endpoint);
        const url = new URL(directUrl.url);
        
        // Para getProperty, añadir el ID de propiedad si no está en el endpoint
        if (id && !endpoint.includes(id)) {
            url.searchParams.append('property_id', id);
        }
        
        const targetUrl = url.toString();
        
        // Crear promesas para todos los proxies en paralelo
        const proxyPromises = corsProxies.map((corsProxy, index) => {
            const proxyUrl = corsProxy + encodeURIComponent(targetUrl);
            const type = `cors-proxy-${index + 1}`;
            
            return this.fetchWithTimeout(proxyUrl, {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            }, 5000)
                .then(async (response) => {
                    logger.debug(`✅ Respuesta método ${type}:`, response.status);
                    
                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(`HTTP ${response.status}: ${errorData.error || response.statusText}`);
                    }
                    
                    const data = await response.json();
                    logger.info(`✅ Propiedad ${id} cargada exitosamente (${type})`);
                    return { success: true, data, type };
                })
                .catch((error) => {
                    logger.warn(`❌ Método ${type} falló:`, error.message);
                    return { success: false, error, type };
                });
        });
        
        logger.debug(`🔄 Obteniendo propiedad ${id} usando múltiples proxies en paralelo...`);
        
        // Esperar a que el primero tenga éxito
        const results = await Promise.all(proxyPromises);
        
        // Buscar el primer resultado exitoso
        const successResult = results.find(r => r.success);
        
        if (successResult) {
            return successResult.data;
        }
        
        // Si todos fallaron, intentar método directo como último recurso
        try {
            logger.debug('🔄 Intentando método directo como último recurso...');
            const response = await this.fetchWithTimeout(targetUrl, {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            }, 5000);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`HTTP ${response.status}: ${errorData.error || response.statusText}`);
            }
            
            const data = await response.json();
            logger.info(`✅ Propiedad ${id} cargada exitosamente (directo)`);
            return data;
        } catch (error) {
            logger.error('❌ Método directo también falló:', error.message);
            throw new Error(`Todos los métodos fallaron para obtener la propiedad ${id}. Último error: ${error.message}`);
        }
    }

    // Función helper para hacer fetch con timeout
    async fetchWithTimeout(url, options = {}, timeout = 5000) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }

    // Obtener todas las propiedades (búsqueda) - OPTIMIZADO con Netlify function primero
    async searchProperties(filters = {}) {
        const endpoint = '/property/search/';
        
        // Intentar primero con Netlify function (MUY RÁPIDO)
        try {
            const netlifyUrl = this.buildApiUrl(endpoint);
            const url = new URL(netlifyUrl.url);
            
            // Agregar filtros como query params
            Object.entries(filters).forEach(([key, value]) => {
                url.searchParams.append(key, value);
            });
            
            logger.debug(`🚀 Buscando propiedades con Netlify function (${netlifyUrl.type}):`, url.toString());
            
            const response = await this.fetchWithTimeout(url.toString(), {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            }, 8000);
            
            if (response.ok) {
                const data = await response.json();
                logger.info(`✅ Propiedades cargadas exitosamente (${netlifyUrl.type}):`, Object.keys(data).filter(key => !isNaN(key)).length, 'propiedades');
                return data;
            }
            
            logger.warn(`⚠️ Netlify function respondió con error ${response.status}, intentando fallbacks...`);
        } catch (error) {
            logger.warn(`❌ Netlify function falló: ${error.message}, intentando proxies CORS...`);
        }
        
        // Fallback: Múltiples proxies CORS públicos (MÁS LENTOS)
        const corsProxies = [
            'https://corsproxy.io/?',
            'https://api.codetabs.com/v1/proxy?quest='
        ];
        
        // Construir URL directa
        const directUrl = this.buildDirectUrl(endpoint);
        const url = new URL(directUrl.url);
        
        // Agregar filtros a la URL directa
        Object.entries(filters).forEach(([key, value]) => {
            url.searchParams.append(key, value);
        });
        
        const targetUrl = url.toString();
        
        // Crear promesas para todos los proxies en paralelo
        const proxyPromises = corsProxies.map((corsProxy, index) => {
            const proxyUrl = corsProxy + encodeURIComponent(targetUrl);
            const type = `cors-proxy-${index + 1}`;
            
            return this.fetchWithTimeout(proxyUrl, {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            }, 5000)
                .then(async (response) => {
                    logger.debug(`✅ Respuesta método ${type}:`, response.status);
                    
                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(`HTTP ${response.status}: ${errorData.error || response.statusText}`);
                    }
                    
                    const data = await response.json();
                    logger.info(`✅ Propiedades cargadas exitosamente (${type}):`, Object.keys(data).filter(key => !isNaN(key)).length, 'propiedades');
                    return { success: true, data, type };
                })
                .catch((error) => {
                    logger.warn(`❌ Método ${type} falló:`, error.message);
                    return { success: false, error, type };
                });
        });
        
        logger.debug('🔄 Buscando propiedades usando múltiples proxies en paralelo...');
        
        // Esperar a que el primero tenga éxito usando Promise.all
        const results = await Promise.all(proxyPromises);
        
        // Buscar el primer resultado exitoso
        const successResult = results.find(r => r.success);
        
        if (successResult) {
            return successResult.data;
        }
        
        // Si todos fallaron, intentar método directo como último recurso
        try {
            logger.debug('🔄 Intentando método directo como último recurso...');
            const response = await this.fetchWithTimeout(targetUrl, {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            }, 5000);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`HTTP ${response.status}: ${errorData.error || response.statusText}`);
            }
            
            const data = await response.json();
            logger.info('✅ Propiedades cargadas exitosamente (directo):', Object.keys(data).filter(key => !isNaN(key)).length, 'propiedades');
            return data;
        } catch (error) {
            logger.error('❌ Método directo también falló:', error.message);
            throw new Error(`Todos los métodos fallaron para buscar propiedades. Último error: ${error.message}`);
        }
    }
}

// Hacer WasiAPI disponible globalmente para auth.js
window.WasiAPI = WasiAPI;

// Funciones utilitarias
function showError(message) {
    console.error('Error:', message);
    // Puedes agregar aquí lógica para mostrar errores en la UI si es necesario
}

function hideLoading() {
    // Esta función se usa en el contexto original, pero aquí no es necesaria
    // ya que el loading se maneja en auth.js
    console.log('hideLoading called - handled by auth system');
}

class WasiPropertiesController {
    constructor(config) {
        this.wasiApi = new WasiAPI(config);
    }
    
    async init() {
        logger.debug('Inicializando controlador de propiedades WASI');
    }
}

// Solo inicializar si no estamos en el manager (para compatibilidad con otras páginas)
if (!window.location.pathname.includes('/manager/')) {
    document.addEventListener('DOMContentLoaded', async () => {
        try {
            // Load configuration first
            const config = await loadConfig();
            if (!config) {
                throw new Error('Failed to load configuration');
            }
            logger.debug('✅ Configuration loaded successfully');
            
            let apiModule;
            logger.debug('✅ Using WASI API for properties');
            apiModule = new WasiPropertiesController(config.wasi);
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
}
