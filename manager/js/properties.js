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

    // Obtener información de una propiedad con fallback de métodos
    async getProperty(propertyId = null) {
        const id = propertyId || this.propertyId;
        const endpoint = `/property/get/${id}`;
        
        // Reordenar métodos: usar CORS proxy primero para mayor confiabilidad
        const methods = [
            // Método 1: CORS proxy (más confiable para desarrollo)
            () => {
                const directUrl = this.buildDirectUrl(endpoint);
                const corsProxy = 'https://api.allorigins.win/raw?url=';
                return { 
                    url: corsProxy + encodeURIComponent(directUrl.url), 
                    type: 'cors-proxy',
                    options: {
                        method: 'GET',
                        headers: {
                            'Accept': 'application/json'
                            // NO incluir Content-Type para evitar preflight
                        }
                    }
                };
            },
            
            // Método 2: Directo con headers mínimos
            () => {
                const { url } = this.buildDirectUrl(endpoint);
                return {
                    url,
                    type: 'direct-minimal',
                    options: {
                        method: 'GET',
                        headers: {
                            'Accept': 'application/json'
                            // Solo Accept, sin Content-Type
                        }
                    }
                };
            },
            
            // Método 3: Proxy local/netlify
            () => {
                const { url } = this.buildApiUrl(endpoint, id);
                return {
                    url,
                    type: 'proxy',
                    options: {
                        method: 'GET',
                        headers: {
                            'Accept': 'application/json'
                        }
                    }
                };
            }
        ];

        for (let i = 0; i < methods.length; i++) {
            try {
                const { url, type, options } = methods[i]();
                logger.debug(`🔄 Intentando método ${i + 1} (${type}):`, url);
                
                const response = await fetch(url, options);
                logger.debug(`✅ Respuesta método ${type}:`, response.status, response.statusText);

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(`HTTP ${response.status}: ${errorData.error || response.statusText}`);
                }

                const data = await response.json();
                logger.info('✅ Datos recibidos exitosamente');
                return data;
                
            } catch (error) {
                logger.warn(`❌ Método ${i + 1} falló:`, error.message);

                if (i === methods.length - 1) {
                    throw new Error(`Todos los métodos fallaron. Último error: ${error.message}`);
                }
                continue;
            }
        }
    }

    // Obtener todas las propiedades (búsqueda)
    async searchProperties(filters = {}) {
        const endpoint = '/property/search/';
        
        // Múltiples proxies CORS como fallback
        const corsProxies = [
            'https://api.allorigins.win/raw?url=',
            'https://corsproxy.io/?',
            'https://cors-anywhere.herokuapp.com/',
            'https://api.codetabs.com/v1/proxy?quest='
        ];
        
        // Usar el mismo sistema de fallback que getProperty pero con múltiples CORS proxies
        const methods = [];
        
        // Generar métodos para cada proxy CORS
        corsProxies.forEach((corsProxy, index) => {
            methods.push(() => {
                const directUrl = this.buildDirectUrl(endpoint);
                const url = new URL(directUrl.url);
                
                // Agregar filtros a la URL directa
                Object.entries(filters).forEach(([key, value]) => {
                    url.searchParams.append(key, value);
                });
                
                return { 
                    url: corsProxy + encodeURIComponent(url.toString()), 
                    type: `cors-proxy-${index + 1}`,
                    options: {
                        method: 'GET',
                        headers: {
                            'Accept': 'application/json'
                        }
                    }
                };
            });
        });
        
        // Método directo (probablemente fallará por CORS)
        methods.push(() => {
            const url = new URL(`${this.baseUrl}${endpoint}`);
            url.searchParams.append('id_company', this.companyId);
            url.searchParams.append('wasi_token', this.token);
            
            Object.entries(filters).forEach(([key, value]) => {
                url.searchParams.append(key, value);
            });
            
            return {
                url: url.toString(),
                type: 'direct',
                options: {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json'
                    }
                }
            };
        });

        for (let i = 0; i < methods.length; i++) {
            try {
                const { url, type, options } = methods[i]();
                logger.debug(`🔄 Buscando propiedades - Método ${i + 1} (${type}):`, url);
                
                const response = await fetch(url, options);
                logger.debug(`✅ Respuesta método ${type}:`, response.status, response.statusText);

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(`HTTP ${response.status}: ${errorData.error || response.statusText}`);
                }

                const data = await response.json();
                logger.info('✅ Propiedades cargadas exitosamente:', Object.keys(data).filter(key => !isNaN(key)).length, 'propiedades');
                return data;
                
            } catch (error) {
                logger.warn(`❌ Método ${i + 1} (${methods[i]().type}) falló:`, error.message);

                if (i === methods.length - 1) {
                    throw new Error(`Todos los métodos fallaron para buscar propiedades. Último error: ${error.message}`);
                }
                continue;
            }
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
