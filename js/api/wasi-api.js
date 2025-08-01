// Create a global logger instance for WASI API
const logger = new Logger();

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
                logger.info(`🔄 Intentando método ${i + 1} (${type}):`, url);
                
                const response = await fetch(url, options);
                logger.info(`✅ Respuesta método ${type}:`, response.status, response.statusText);

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(`HTTP ${response.status}: ${errorData.error || response.statusText}`);
                }

                const data = await response.json();
                logger.info('✅ Datos recibidos exitosamente:');
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
        const endpoint = '/property/search';
        const url = this.buildProxyUrl(endpoint);

        // Agregar filtros adicionales como parámetros
        const searchUrl = new URL(url);
        Object.entries(filters).forEach(([key, value]) => {
            searchUrl.searchParams.append(key, value);
        });

        try {
            logger.info('Buscando propiedades via proxy en:', searchUrl.toString());
            
            const response = await fetch(searchUrl.toString(), {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`HTTP error! status: ${response.status} - ${errorData.error || response.statusText}`);
            }

            const data = await response.json();
            logger.info('Resultados de búsqueda:', data);

            return data;
        } catch (error) {
            logger.error('Error al buscar propiedades:', error);
            throw error;
        }
    }
}

// Property Detail Controller - Mirrors Arrendasoft structure
class WasiPropertyDetailController {
    constructor(config, propertyId = null) {
        this.wasiApi = new WasiAPI(config);
        this.propertyId = propertyId;
        this.propertyData = null;
    }
    
    async initialize() {
        logger.info('🔍 Loading property data for ID:', this.propertyId);
        try {
            // Inicializar sistema de encriptación
            const encryptionConfig = window.envConfig.getEncryptionConfig();
            if (!window.propertyEncryption.init(encryptionConfig)) {
                logger.warn('⚠️ Sistema de encriptación no inicializado correctamente');
            }
            // Obtener propertyId: primero de URL, luego usar valor por defecto
            let propertyId = null;
            
            // Intentar obtener ID de la URL (encriptada)
            const urlPropertyId = window.propertyEncryption.getPropertyIdFromUrl();
            if (urlPropertyId) {
                propertyId = urlPropertyId;
                logger.info('✅ Property ID obtenido de URL (desencriptado):', propertyId);
            } else {
                // Usar ID de ejemplo y desencriptarla
                const encryptedId = 'SRViXEpzdQ'; // ID encriptada de propiedad de ejemplo
                propertyId = window.propertyEncryption.decrypt(encryptedId);
                
                if (!propertyId) {
                    // Fallback: usar ID directa (solo para desarrollo)
                    propertyId = '9352212';
                    logger.warn('⚠️ No se pudo desencriptar ID, usando fallback:', propertyId);
                } else {
                    logger.info('✅ Property ID desencriptado:', propertyId);
                }
            }
            this.showLoading();
            this.wasiApi.propertyId = propertyId;
            this.propertyData = await this.wasiApi.getProperty();
            await this.renderProperty();
            this.hideLoading();
            this.updateMetaTags();
        } catch (error) {
            this.hideLoading();
            this.showError(error.message);
            logger.error('Error inicializando controlador:', error);
        }
    }
    // Initialize the controller
    async init() {
        logger.info('🔍 Loading property data for ID:', this.propertyId);
        await this.loadProperty();
    }

    // Load property data
    async loadProperty() {
        try {
            // Check if property data was preloaded by Netlify Function
            if (window.PRELOADED_PROPERTY) {
                logger.info('📦 Using preloaded property data from Netlify Function');
                this.property = window.PRELOADED_PROPERTY;
                
                // Validate preloaded property status
                if (!this.property.estado_texto || this.property.estado_texto.toLowerCase() !== 'activa') {
                    logger.warn(`🚫 Preloaded property is not active. Status: ${this.property.estado_texto || 'Unknown'}`);
                    throw new Error('Property is not active or available');
                }
                
                this.renderProperty();
                this.updatePageMeta();
                return;
            }
            if (!this.propertyId) {
                throw new Error('Property ID not found in URL. Make sure the URL contains an encrypted ID parameter.');
            }

            this.showLoading();

            // Load property details
            this.property = await this.wasiApi.getProperty(this.propertyId);

            // Validate property status - only show active properties
            if (parseInt(this.property.id_availability) !== 1 && ![1, 3].includes(parseInt(this.property.id_status_on_page))) {
                logger.warn(`🚫 Property ${this.propertyId} is not active. Status: ${this.property.availability_label || 'Unknown'}`);
                throw new Error('Property is not active or available');
            }

            this.renderProperty();
            this.updatePageMeta();

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
            
            this.showError(errorMessage);
        } finally {
            this.hideLoading();
        }
    }

    // Render property details with modern layout
    renderProperty() {
        const contentEl = document.getElementById('property-content');
        if (!contentEl || !this.property) return;

        const property = this.property;

        const html = `
            <div class="property-layout">
                ${this.renderPropertyImages(property)}
                
                <div class="property-main">
                    <div class="property-content">
                        <div class="property-info">
                            <h1 class="property-title">${property.clase_inmueble + ' en ' + property.municipio|| 'Propiedad'}</h1>
                            
                            <div class="property-price">
                                <span class="price-label">${property.tipo_servicio || 'Precio'}</span>
                                ${this.formatCurrency(property.valor_arriendo1 || property.valor_venta1 || 0)}
                            </div>
                            
                            <div class="property-badges">
                                <span class="property-badge type">${property.clase_inmueble || 'Inmueble'}</span>
                                <span class="property-badge primary">${property.tipo_servicio || 'Disponible'}</span>
                                ${property.estrato_texto ? `<span class="property-badge">Estrato ${property.estrato_texto}</span>` : ''}
                            </div>

                            ${this.renderPropertyFeatures(property)}
                        </div>
                        
                        ${this.renderPropertyDescription(property)}
                        ${this.renderPropertyCharacteristics(property)}
                        ${this.renderPropertyMap(property)}

                    </div>
                </div>
            </div>
            
            ${this.renderPropertyCode(property)}
            ${this.renderImageModal(property)}
        `;

        contentEl.innerHTML = html;
        contentEl.style.display = 'block';
        
        // Initialize gallery functionality
        this.initializeGallery(property.imagenes || []);

        // Initialize map if coordinates are available
        this.initializeMap(property);
        
        // Add resize listener to update thumbnails on orientation change
        this.handleResize = this.debounce(() => {
            const newContent = this.renderPropertyImages(property);
            const parser = new DOMParser();
            const newDoc = parser.parseFromString(newContent, 'text/html');
            const newGallery = newDoc.querySelector('.property-images');
            const currentGallery = document.querySelector('.property-images');
            
            if (currentGallery && newGallery) {
                currentGallery.innerHTML = newGallery.innerHTML;
                this.initializeGallery(property.imagenes || []);
            }
        }, 250);
        
        window.addEventListener('resize', this.handleResize, { passive: true });
    }
    // Render modern property images gallery
    renderPropertyImages(property) {
        const images = property.imagenes || [];
        if (images.length === 0) {
            return this.renderDefaultImageContainer();
        }

        const mainImage = images[0];
        
        // Cache mobile detection and thumbnail count
        const isMobile = window.innerWidth <= 768;
        const thumbnailCount = isMobile ? 3 : 2;
        const thumbnails = images.slice(1, thumbnailCount + 1);

        return `
            <div class="property-images">
                <div class="image-gallery-container">
                    ${this.renderMainImageContainer(mainImage, property, images.length)}
                    ${thumbnails.length > 0 ? this.renderThumbnailGrid(thumbnails, thumbnailCount, images.length) : ''}
                </div>
            </div>
        `;
    }
    // Render default image container (extracted for reusability)
    renderDefaultImageContainer() {
        return `
            <div class="property-images">
                <div class="image-gallery-container">
                    <div class="main-image-container">
                        <img src="/assets/images/default-property.jpg" alt="Imagen no disponible" class="main-image">
                    </div>
                </div>
            </div>
        `;
    }
    // Render main image container (extracted for better maintainability)
    renderMainImageContainer(mainImage, property, totalImages) {
        return `
            <div class="main-image-container">
                <img src="${mainImage.imagen}" alt="${property.clase_inmueble + ' en ' + this.property.municipio || 'Inmueble'}" class="main-image" data-index="0" loading="lazy">
                <div class="image-counter">1 / ${totalImages}</div>
                ${totalImages > 1 ? this.renderGalleryNavigation() : ''}
            </div>
        `;
    }
    // Render gallery navigation buttons
    renderGalleryNavigation() {
        return `
            <button class="gallery-nav prev" aria-label="Imagen anterior">‹</button>
            <button class="gallery-nav next" aria-label="Imagen siguiente">›</button>
        `;
    }
    // Render thumbnail grid (extracted for better maintainability)
    renderThumbnailGrid(thumbnails, thumbnailCount, totalImages) {
        return `
            <div class="thumbnail-grid">
                ${thumbnails.map((img, index) => `
                    <div class="thumbnail-item" data-index="${index + 1}">
                        <img src="${img.imagen}" alt="Imagen ${index + 2}" class="thumbnail-image" loading="lazy">
                        ${index === (thumbnailCount - 1) && totalImages > thumbnailCount + 1 ? `
                            <div class="thumbnail-overlay">+${totalImages - thumbnailCount - 1}</div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        `;
    }
    // Render image modal for full screen viewing
    renderImageModal(property) {
        const images = property.imagenes || [];
        if (images.length === 0) return '';

        return `
            <div class="gallery-modal" id="gallery-modal">
                <div class="modal-content">
                    <button class="modal-close">×</button>
                    <img src="" alt="" class="modal-image" id="modal-image">
                    <button class="modal-nav prev">‹</button>
                    <button class="modal-nav next">›</button>
                    <div class="modal-counter" id="modal-counter">1 / ${images.length}</div>
                    <div class="modal-thumbnail-strip">
                        ${images.map((img, index) => `
                            <img src="${img.imagen}" alt="Imagen ${index + 1}" 
                                 class="modal-thumbnail ${index === 0 ? 'active' : ''}" 
                                 data-index="${index}">
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }
    // Render property features with modern icons
    renderPropertyFeatures(property) {
        // Helper function to get characteristic value by description
        const getCharacteristicValue = (descripcion) => {
            if (!property.caracteristicas || !Array.isArray(property.caracteristicas)) return null;
            const characteristic = property.caracteristicas.find(c => 
                c.descripcion.toLowerCase().includes(descripcion.toLowerCase())
            );
            return characteristic ? characteristic.valor : null;
        };

        const features = [
            { 
                label: 'Habitaciones', 
                value: getCharacteristicValue('Habitaciones') || property.habitaciones || 'N/A',
                icon: '🛏️'
            },
            { 
                label: 'Baños', 
                value: getCharacteristicValue('Baños') || property.banos || 'N/A',
                icon: '🚿'
            },
            { 
                label: 'Área', 
                value: property.area ? `${property.area} m²` : 'N/A',
                icon: '📐'
            },
            { 
                label: 'Parqueaderos', 
                value: getCharacteristicValue('Parqueaderos') || property.parqueaderos || '0',
                icon: '🚗'
            }
        ].filter(feature => feature.value && feature.value !== 'N/A');

        return `
            <div class="property-features">
                ${features.map(feature => `
                    <div class="feature-item">
                        <div class="feature-icon">${feature.icon}</div>
                        <div class="feature-value">${feature.value}</div>
                        <div class="feature-label">${feature.label}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    // Helper to get characteristic value
    getCharacteristicValue(descripcion) {
        if (!this.property.caracteristicas || !Array.isArray(this.property.caracteristicas)) return null;
        const characteristic = this.property.caracteristicas.find(c => 
            c.descripcion.toLowerCase().includes(descripcion.toLowerCase())
        );
        return characteristic ? characteristic.valor : null;
    }
    // Render property description
    renderPropertyDescription(property) {
        const description = property.observaciones || property.descripcion;
        if (!description) return '';

        return `
            <div class="property-description">
                <h2>Descripción</h2>
                <p>${description}</p>
            </div>
        `;
    }
    // Render property characteristics section
    renderPropertyCharacteristics(property) {
        if (!property.caracteristicas || property.caracteristicas.length === 0) {
            return '';
        }

        const groupedCharacteristics = this.groupCharacteristics(property.caracteristicas);
        
        if (Object.keys(groupedCharacteristics).length === 0) {
            return '';
        }

        return `
            <div class="property-characteristics">
                <h2 class="characteristics-title">Características</h2>
                ${this.renderCharacteristicGroups(groupedCharacteristics)}
            </div>
        `;
    }
    // Helper method to normalize group names and handle capitalization issues
    normalizeGroupName(groupName) {
        if (!groupName) return 'Otros';
        
        // Convert to lowercase, then apply proper title case
        return groupName.toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }
    // Group characteristics by normalized group name
    groupCharacteristics(caracteristicas) {
        const groupedCharacteristics = {};
        
        caracteristicas.forEach(char => {
            const normalizedGroup = this.normalizeGroupName(char.grupo);
            
            // Skip "Datos del Inmueble" group
            if (normalizedGroup === "Datos Del Inmueble") {
                return;
            }

            if (!groupedCharacteristics[normalizedGroup]) {
                groupedCharacteristics[normalizedGroup] = [];
            }
            groupedCharacteristics[normalizedGroup].push(char);
        });

        return groupedCharacteristics;
    }

    // Render characteristic groups
    renderCharacteristicGroups(groupedCharacteristics) {
        return Object.entries(groupedCharacteristics).map(([grupo, caracteristicas]) => `
            <div class="characteristic-group">
                <h3 class="group-title">${grupo}</h3>
                <div class="characteristics-grid">
                    ${this.renderCharacteristicItems(caracteristicas)}
                </div>
            </div>
        `).join('');
    }

    // Render individual characteristic items
    renderCharacteristicItems(caracteristicas) {
        return caracteristicas.map(char => {
            // Handle checkbox type fields with special formatting
            if (char.tipo_campo === 'checkbox') {
                const value = char.valor;
                // Check if value indicates true (1, "1", "true", "sí", "si", "yes")
                const isTrue = value === '1' || value === 1 || 
                              (typeof value === 'string' && 
                               ['true', 'sí', 'si', 'yes', 'verdadero'].includes(value.toLowerCase()));
                
                // Only show checkbox characteristics that are true
                if (isTrue) {
                    return `<div class="characteristic-item checkbox-item"><span class="check-icon">✓</span> ${char.descripcion}</div>`;
                } else {
                    // Skip false checkbox values
                    return '';
                }
            } else {
                // Standard format for non-checkbox fields - single line
                return `<div class="characteristic-item"><span class="characteristic-label">${char.descripcion}:</span> <span class="characteristic-value">${char.valor || 'N/A'}</span></div>`;
            }
        }).filter(item => item !== '').join('');
    }
    // Render property map with geolocation
    renderPropertyMap(property) {
        // Check if coordinates are available
        if (!property.coordenadas) {
            return '';
        }

        let lat, lng;

        // Handle different coordinate formats
        if (typeof property.coordenadas === 'string') {
            // Format: "6.1562957:-75.6127396"
            const coords = property.coordenadas.split(':');
            if (coords.length !== 2) {
                return '';
            }
            lat = parseFloat(coords[0]);
            lng = parseFloat(coords[1]);
        } else if (property.coordenadas.latitud && property.coordenadas.longitud) {
            // Format: { latitud: "6.1562957", longitud: "-75.6127396" }
            lat = parseFloat(property.coordenadas.latitud);
            lng = parseFloat(property.coordenadas.longitud);
        } else {
            return '';
        }

        // Validate coordinates
        if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) {
            return '';
        }

        return `
            <div class="property-map">
                <h2 class="map-title">Ubicación</h2>
                <div id="property-map-container" class="map-container" data-lat="${lat}" data-lng="${lng}" data-address="${property.barrio}, ${property.municipio}">
                    <div class="map-loading">Cargando mapa...</div>
                </div>
                <div class="map-info">
                    <div class="map-address">
                        <span class="location-icon">📍</span>
                        <span>${property.barrio}, ${property.municipio}</span>
                    </div>
                </div>
            </div>
        `;
    }
    // Render property code section for agents
    renderPropertyCode(property) {
        if (!property.codigo) return '';

        return `
            <div class="property-code-discrete">
                <span class="code-ref">Ref: ${property.codigo}</span>
            </div>
        `;
    }
    // Initialize gallery functionality
    initializeGallery(images) {
        this.images = images;
        this.currentImageIndex = 0;
        this.modalCurrentIndex = 0;
        
        // Clean up existing event listeners to prevent duplicates
        this.cleanupGalleryListeners();
        
        // Add click event to main image to open modal
        const mainImage = document.querySelector('.main-image');
        if (mainImage) {
            this.mainImageClickHandler = () => this.openModal(0);
            mainImage.addEventListener('click', this.mainImageClickHandler);
        }
        
        // Add event listeners for navigation buttons
        const prevBtn = document.querySelector('.gallery-nav.prev');
        const nextBtn = document.querySelector('.gallery-nav.next');
        
        if (prevBtn) {
            this.prevBtnClickHandler = (e) => {
                e.preventDefault();
                this.changeImage(-1);
            };
            prevBtn.addEventListener('click', this.prevBtnClickHandler);
        }
        
        if (nextBtn) {
            this.nextBtnClickHandler = (e) => {
                e.preventDefault();
                this.changeImage(1);
            };
            nextBtn.addEventListener('click', this.nextBtnClickHandler);
        }
        
        // Add event listeners for thumbnails
        const thumbnails = document.querySelectorAll('.thumbnail-item');
        this.thumbnailClickHandlers = [];
        thumbnails.forEach((thumbnail) => {
            const clickHandler = (e) => {
                e.preventDefault();
                // Get the correct index from data-index attribute
                const targetIndex = parseInt(thumbnail.dataset.index);
                this.setMainImage(targetIndex);
            };
            this.thumbnailClickHandlers.push({ element: thumbnail, handler: clickHandler });
            thumbnail.addEventListener('click', clickHandler);
        });
    }
    // Clean up gallery event listeners
    cleanupGalleryListeners() {
        // Clean main image listener
        const mainImage = document.querySelector('.main-image');
        if (mainImage && this.mainImageClickHandler) {
            mainImage.removeEventListener('click', this.mainImageClickHandler);
            this.mainImageClickHandler = null;
        }
        
        // Clean navigation button listeners
        const prevBtn = document.querySelector('.gallery-nav.prev');
        const nextBtn = document.querySelector('.gallery-nav.next');
        
        if (prevBtn && this.prevBtnClickHandler) {
            prevBtn.removeEventListener('click', this.prevBtnClickHandler);
            this.prevBtnClickHandler = null;
        }
        
        if (nextBtn && this.nextBtnClickHandler) {
            nextBtn.removeEventListener('click', this.nextBtnClickHandler);
            this.nextBtnClickHandler = null;
        }
        
        // Clean thumbnail listeners
        if (this.thumbnailClickHandlers) {
            this.thumbnailClickHandlers.forEach(({ element, handler }) => {
                element.removeEventListener('click', handler);
            });
            this.thumbnailClickHandlers = [];
        }
    }
    // Change main image with performance optimization
    changeImage(direction) {
        if (!this.images || this.images.length <= 1) return;
        
        this.currentImageIndex = this.calculateNewIndex(this.currentImageIndex, direction, this.images.length);
        this.updateMainImage();
    }
    // Calculate new index with circular navigation
    calculateNewIndex(currentIndex, direction, totalImages) {
        let newIndex = currentIndex + direction;
        
        if (newIndex >= totalImages) {
            newIndex = 0;
        } else if (newIndex < 0) {
            newIndex = totalImages - 1;
        }
        
        return newIndex;
    }

    // Set specific main image with validation
    setMainImage(index) {
        if (!this.images || index < 0 || index >= this.images.length) return;
        
        this.currentImageIndex = index;
        this.updateMainImage();
    }

    // Update main image display with preloading
    updateMainImage() {
        const mainImage = document.querySelector('.main-image');
        const counter = document.querySelector('.image-counter');
        
        if (mainImage && this.images[this.currentImageIndex]) {
            const currentImage = this.images[this.currentImageIndex];
            mainImage.src = currentImage.imagen;
            mainImage.setAttribute('data-index', this.currentImageIndex);
            
            // Preload next/previous images for smoother navigation
            this.preloadAdjacentImages();
        }
        
        if (counter) {
            counter.textContent = `${this.currentImageIndex + 1} / ${this.images.length}`;
        }
    }

    // Preload adjacent images for better performance
    preloadAdjacentImages() {
        const preloadIndexes = [
            this.calculateNewIndex(this.currentImageIndex, 1, this.images.length),
            this.calculateNewIndex(this.currentImageIndex, -1, this.images.length)
        ];

        preloadIndexes.forEach(index => {
            if (this.images[index] && !this.preloadedImages?.has(index)) {
                const img = new Image();
                img.src = this.images[index].imagen;
                
                if (!this.preloadedImages) {
                    this.preloadedImages = new Set();
                }
                this.preloadedImages.add(index);
            }
        });
    }

    // Open modal gallery
    openModal(index = 0) {
        const modal = document.getElementById('gallery-modal');
        if (!modal || !this.images || this.images.length === 0) return;
        
        this.modalCurrentIndex = index;
        modal.classList.add('active');
        document.body.classList.add('modal-open');
        
        this.updateModalImage();
        
        // Add event listeners for modal navigation
        const modalCloseBtn = modal.querySelector('.modal-close');
        const modalPrevBtn = modal.querySelector('.modal-nav.prev');
        const modalNextBtn = modal.querySelector('.modal-nav.next');
        const modalThumbnails = modal.querySelectorAll('.modal-thumbnail');
        
        if (modalCloseBtn) {
            modalCloseBtn.addEventListener('click', () => this.closeModal());
        }
        
        if (modalPrevBtn) {
            modalPrevBtn.addEventListener('click', () => this.changeModalImage(-1));
        }
        
        if (modalNextBtn) {
            modalNextBtn.addEventListener('click', () => this.changeModalImage(1));
        }
        
        modalThumbnails.forEach((thumbnail) => {
            thumbnail.addEventListener('click', () => {
                const index = parseInt(thumbnail.dataset.index);
                this.setModalImage(index);
            });
        });
        
        // Add keyboard navigation
        this.handleKeyboard = (e) => {
            switch(e.key) {
                case 'ArrowLeft':
                    this.changeModalImage(-1);
                    break;
                case 'ArrowRight':
                    this.changeModalImage(1);
                    break;
                case 'Escape':
                    this.closeModal();
                    break;
            }
        };
        
        document.addEventListener('keydown', this.handleKeyboard);
    }

    // Close modal
    closeModal() {
        const modal = document.getElementById('gallery-modal');
        if (modal) {
            modal.classList.remove('active');
            document.body.classList.remove('modal-open');
        }
        
        if (this.handleKeyboard) {
            document.removeEventListener('keydown', this.handleKeyboard);
        }
    }

    // Change modal image
    changeModalImage(direction) {
        if (!this.images || this.images.length <= 1) return;
        
        this.modalCurrentIndex += direction;
        if (this.modalCurrentIndex >= this.images.length) this.modalCurrentIndex = 0;
        if (this.modalCurrentIndex < 0) this.modalCurrentIndex = this.images.length - 1;
        
        this.updateModalImage();
    }

    // Set specific modal image
    setModalImage(index) {
        if (!this.images || index >= this.images.length) return;
        this.modalCurrentIndex = index;
        this.updateModalImage();
    }

    // Update modal image display
    updateModalImage() {
        const modalImage = document.getElementById('modal-image');
        const counter = document.getElementById('modal-counter');
        const thumbnails = document.querySelectorAll('.modal-thumbnail');
        
        if (modalImage && this.images[this.modalCurrentIndex]) {
            modalImage.src = this.images[this.modalCurrentIndex].imagen;
            modalImage.alt = `Imagen ${this.modalCurrentIndex + 1}`;
        }
        
        if (counter) {
            counter.textContent = `${this.modalCurrentIndex + 1} / ${this.images.length}`;
        }
        
        // Update thumbnail active state
        thumbnails.forEach((thumb, index) => {
            thumb.classList.toggle('active', index === this.modalCurrentIndex);
        });
    }
    // Enhanced cleanup method for better memory management
    cleanup() {
        // Clean up gallery event listeners
        this.cleanupGalleryListeners();
        
        // Remove resize event listener
        if (this.handleResize) {
            window.removeEventListener('resize', this.handleResize);
            this.handleResize = null;
        }
        
        // Remove keyboard event listener
        if (this.handleKeyboard) {
            document.removeEventListener('keydown', this.handleKeyboard);
            this.handleKeyboard = null;
        }
        
        // Clear image preloading cache
        if (this.preloadedImages) {
            this.preloadedImages.clear();
            this.preloadedImages = null;
        }
        
        // Remove intersection observers
        if (this.mapObserver) {
            this.mapObserver.disconnect();
            this.mapObserver = null;
        }
        
        // Clear any timeout references
        if (this.debounceTimeout) {
            clearTimeout(this.debounceTimeout);
            this.debounceTimeout = null;
        }
        
        // Reset state
        this.images = null;
        this.property = null;
        this.currentImageIndex = 0;
        this.modalCurrentIndex = 0;
    }
    // Enhanced debounce utility with cleanup
    debounce(func, wait) {
        return (...args) => {
            if (this.debounceTimeout) {
                clearTimeout(this.debounceTimeout);
            }
            
            this.debounceTimeout = setTimeout(() => {
                this.debounceTimeout = null;
                func.apply(this, args);
            }, wait);
        };
    }

    // Initialize property map with lazy loading
    initializeMap(property) {
        const mapContainer = document.getElementById('property-map-container');
        if (!mapContainer) return;

        const coords = this.parseMapCoordinates(mapContainer);
        if (!coords) return;

        // Add intersection observer for lazy loading
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadMap(coords, mapContainer, property);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        observer.observe(mapContainer);
    }

    // Parse coordinates from map container
    parseMapCoordinates(mapContainer) {
        const lat = parseFloat(mapContainer.dataset.lat);
        const lng = parseFloat(mapContainer.dataset.lng);
        const address = mapContainer.dataset.address;

        if (isNaN(lat) || isNaN(lng)) return null;

        return { lat, lng, address };
    }

    // Load and initialize the map
    async loadMap(coords, mapContainer, property) {
        try {
            // Show loading indicator
            mapContainer.innerHTML = '<div class="map-loading">Cargando mapa...</div>';

            await this.loadMapResources();
            
            const displayCoords = this.addPrivacyOffset(coords);
            const map = this.createLeafletMap(mapContainer, displayCoords);
            this.addMapLayers(map, displayCoords, coords.address, property);

        } catch (error) {
            logger.error('Error loading map:', error);
            this.showMapError(mapContainer);
        }
    }

    // Add privacy offset to coordinates
    addPrivacyOffset(coords) {
        const offsetRange = 0.003; // ~400 meters max offset
        const latOffset = (Math.random() - 0.5) * offsetRange;
        const lngOffset = (Math.random() - 0.5) * offsetRange;
        
        return {
            lat: coords.lat + latOffset,
            lng: coords.lng + lngOffset
        };
    }
    // Create Leaflet map instance
    createLeafletMap(mapContainer, coords) {
        mapContainer.innerHTML = ''; // Clear loading message
        return L.map('property-map-container').setView([coords.lat, coords.lng], 16);
    }

    // Add map layers and markers
    addMapLayers(map, displayCoords, address, property) {
        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        // Add circle instead of marker for privacy
        L.circle([displayCoords.lat, displayCoords.lng], {
            color: '#1B99D3',
            fillColor: '#48BFF7',
            fillOpacity: 0.2,
            radius: 200
        }).addTo(map);
    }

    // Show map error message
    showMapError(mapContainer) {
        mapContainer.innerHTML = `
            <div class="map-error">
                <p>No se pudo cargar el mapa</p>
                <small>Ubicación aproximada</small>
            </div>
        `;
    }
    // Load Leaflet map resources dynamically
    async loadMapResources() {
        // Check if Leaflet is already loaded
        if (typeof L !== 'undefined') {
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            // Load CSS
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
            link.crossOrigin = '';
            document.head.appendChild(link);

            // Load JavaScript
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
            script.crossOrigin = '';
            
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load Leaflet'));
            
            document.head.appendChild(script);
        });
    }


    // Show loading state
    showLoading() {
        const loadingEl = document.getElementById('loading');
        const contentEl = document.getElementById('property-content');
        const errorEl = document.getElementById('error');

        if (loadingEl) loadingEl.style.display = 'block';
        if (contentEl) contentEl.style.display = 'none';
        if (errorEl) errorEl.style.display = 'none';
    }

    // Hide loading state
    hideLoading() {
        const loadingEl = document.getElementById('loading');
        if (loadingEl) loadingEl.style.display = 'none';
    }

    // Show error state
    showError(message) {
        const errorEl = document.getElementById('error');
        const contentEl = document.getElementById('property-content');

        if (errorEl) {
            errorEl.textContent = message;
            errorEl.style.display = 'block';
        }

        if (contentEl) contentEl.style.display = 'none';
    }

    // Format currency
    formatCurrency(amount) {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(amount);
    }

    // Format area
    formatArea(area) {
        return area ? `${area} m²` : 'N/A';
    }
    // Update page meta information for elegant social previews
    updatePageMeta() {
        if (!this.property) return;

        const property = this.property;
        
        // Generate clean property info
        const propertyType = property.clase_inmueble || 'Propiedad';
        const location = property.municipio || '';
        const serviceType = property.tipo_servicio || 'Disponible';
        const price = this.formatCurrency(property.valor_arriendo1 || property.valor_venta1 || 0);
        const rooms = property.habitaciones || this.getCharacteristicValue('Habitaciones');
        const bathrooms = property.banos || this.getCharacteristicValue('Baños');

        // Create elegant title for social sharing
        const socialTitle = `🏠 ${propertyType} en ${location}`;
        
        // Create elegant description with key details
        let socialDescription = `${serviceType} ${price}`;
        if (rooms) socialDescription += ` | ${rooms} hab`;
        if (bathrooms) socialDescription += `, ${bathrooms} baños`;

        // Update page title
        document.title = `${socialTitle} - Inmobarco`;

        // Update meta description
        this.updateMetaTag('description', socialDescription);

        // Update Open Graph tags for WhatsApp/Facebook
        this.updateOGTags(socialTitle, socialDescription);
        
        // Update Twitter tags
        this.updateTwitterTags(socialTitle, socialDescription);
        
        // Update structured data
        this.updateStructuredData(property);
    }
    // Update structured data with property information
    updateStructuredData(property) {
        const propertyType = property.clase_inmueble || 'Propiedad';
        const location = property.municipio || '';
        const price = property.valor_arriendo1 || property.valor_venta1 || null;
        const propertyImage = property.imagenes?.[0]?.imagen || '';

        const structuredData = {
            "@context": "https://schema.org",
            "@type": "RealEstate",
            "name": `${propertyType} en ${location}`,
            "description": property.observaciones || property.descripcion || `${propertyType} en ${location}`,
            "image": propertyImage,
            "address": {
                "@type": "PostalAddress",
                "streetAddress": property.direccion || "",
                "addressLocality": property.municipio || "",
                "addressRegion": property.departamento || "",
                "addressCountry": "CO"
            },
            "numberOfRooms": property.habitaciones || null,
            "numberOfBathrooms": property.banos || null,
            "floorSize": property.area ? {
                "@type": "QuantitativeValue",
                "value": property.area,
                "unitCode": "MTK"
            } : null,
            "provider": {
                "@type": "RealEstateAgent",
                "name": "Inmobarco",
                "url": "https://inmobarco.com",
                "telephone": "+57 304 525 8750",
                "email": "comercial@inmobarco.com"
            },
            "offers": price ? {
                "@type": "Offer",
                "price": price,
                "priceCurrency": "COP",
                "availability": property.estado_texto === 'Activa' ? "InStock" : "OutOfStock"
            } : null
        };

        // Remove null values
        const cleanData = JSON.parse(JSON.stringify(structuredData, (key, value) => value === null ? undefined : value));

        // Update structured data script
        let script = document.getElementById('property-schema');
        if (script) {
            script.textContent = JSON.stringify(cleanData, null, 2);
        }
    }
    // Update Open Graph tags for elegant social previews
    updateOGTags(title, description) {
        const property = this.property;
        let propertyImage = property.imagenes?.[0]?.imagen || '';
        
        // Si no hay imagen, usar logo de Inmobarco o generar una por defecto
        if (!propertyImage) {
            propertyImage = window.location.origin + '/assets/images/Logo.png';
        }
        
        const ogTags = {
            'og:title': title,
            'og:description': description,
            'og:url': window.location.href,
            'og:image': propertyImage,
            'og:image:alt': `${title} - Imagen principal`,
            'og:type': 'article',
            'og:site_name': 'Inmobarco',
            'og:locale': 'es_CO'
        };

        Object.entries(ogTags).forEach(([property, content]) => {
            if (content) {
                this.updateMetaTag(property, content, 'property');
            }
        });
    }

    // Update Twitter tags
    updateTwitterTags(title, description) {
        const property = this.property;
        let propertyImage = property.imagenes?.[0]?.imagen || '';
        
        // Si no hay imagen, usar logo de Inmobarco
        if (!propertyImage) {
            propertyImage = window.location.origin + '/assets/images/Logo.png';
        }
        
        const twitterTags = {
            'twitter:title': title,
            'twitter:description': description,
            'twitter:url': window.location.href,
            'twitter:image': propertyImage,
            'twitter:image:alt': `${title} - Imagen principal`,
            'twitter:card': 'summary_large_image',
            'twitter:site': '@Inmobarco'
        };

        Object.entries(twitterTags).forEach(([name, content]) => {
            if (content) {
                this.updateMetaTag(name, content, 'name');
            }
        });
    }

    // Helper method to update meta tags
    updateMetaTag(name, content, attribute = 'name') {
        let selector;
        if (attribute === 'property') {
            selector = `meta[property="${name}"]`;
        } else {
            selector = `meta[${attribute}="${name}"]`;
        }
        
        let meta = document.querySelector(selector);
        if (!meta) {
            meta = document.createElement('meta');
            if (attribute === 'property') {
                meta.setAttribute('property', name);
            } else {
                meta.setAttribute(attribute, name);
            }
            document.head.appendChild(meta);
        }
        meta.setAttribute('content', content);
    }
}

// Export for ES6 modules
export { WasiPropertyDetailController };

// Export for CommonJS (backward compatibility)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { WasiPropertyDetailController };
}

