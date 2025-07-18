// Arrendasoft API Integration Module
// Clean interface to interact with Arrendasoft V2 API

class ArrendasoftAPI {
    constructor(config) {
        this.baseUrl = config.baseUrl;
        this.token = config.token;
        this.instance = config.instance;
    }

    // Generic API request method
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const defaultOptions = {
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json'
            }
        };

        const requestOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        };

        try {
            const response = await fetch(url, requestOptions);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // Authentication - Login to get token
    async login(credentials) {
        try {
            const response = await fetch(`${this.baseUrl}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(credentials)
            });

            if (!response.ok) {
                throw new Error('Login failed');
            }

            const data = await response.json();
            this.token = data.token;
            return data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    // Get single property by ID
    async getProperty(propertyId) {
        return await this.request(`/properties/${propertyId}`);
    }

    // Get properties list with pagination
    async getProperties(params = {}) {
        const queryParams = new URLSearchParams(params);
        return await this.request(`/properties?${queryParams}`);
    }

    // Get property features/characteristics
    async getPropertyFeatures() {
        return await this.request('/masters/properties/features');
    }

    // Get agent information
    async getAgent(agentDocument) {
        return await this.request(`/agents/${agentDocument}`);
    }

    // Search properties with filters
    async searchProperties(filters) {
        const queryParams = new URLSearchParams(filters);
        return await this.request(`/properties?${queryParams}`);
    }
}

// Property Detail Page Controller
class PropertyDetailController {
    constructor(apiConfig) {
        this.api = new ArrendasoftAPI(apiConfig);
        this.propertyId = this.getPropertyIdFromUrl();
        this.property = null;
        this.agent = null;
    }

    // Extract property ID from URL
    getPropertyIdFromUrl() {
        // ONLY use the encryption module - no fallbacks
        if (!window.propertyEncryption) {
            console.error('❌ Property encryption module not available. Cannot process property ID.');
            return null;
        }

        if (!window.propertyEncryption.initialized) {
            console.error('❌ Property encryption module not initialized.');
            return null;
        }

        const propertyId = window.propertyEncryption.getPropertyIdFromUrl();
        
        if (!propertyId) {
            console.error('❌ Failed to get encrypted property ID from URL');
            return null;
        }

        return propertyId;
    }

    // Load property data
    async loadProperty() {
        try {
            if (!this.propertyId) {
                throw new Error('Property ID not found in URL. Make sure the URL contains an encrypted ID parameter.');
            }

            this.showLoading();

            // Load property details
            this.property = await this.api.getProperty(this.propertyId);

            // Validate property status - only show active properties
            if (!this.property.estado_texto || this.property.estado_texto.toLowerCase() !== 'activa') {
                console.warn(`🚫 Property ${this.propertyId} is not active. Status: ${this.property.estado_texto || 'Unknown'}`);
                throw new Error('Property is not active or available');
            }

            // Load agent information if available
            if (this.property.agent_document) {
                try {
                    this.agent = await this.api.getAgent(this.property.agent_document);
                } catch (error) {
                    console.warn('Could not load agent information:', error);
                }
            }

            this.renderProperty();
            this.updatePageMeta();

        } catch (error) {
            console.error('❌ Error loading property:', error);
            
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

    // Get property type display name
    getPropertyType(property) {
        return property.property_type || property.tipo_inmueble || 'Inmueble';
    }

    // Get property status display name
    getPropertyStatus(property) {
        return property.status || property.estado || 'Disponible';
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
            
            ${this.renderImageModal(property)}
        `;

        contentEl.innerHTML = html;
        contentEl.style.display = 'block';
        
        // Initialize gallery functionality
        this.initializeGallery(property.imagenes || []);

        // Initialize map if coordinates are available
        this.initializeMap(property);
        
        // Add resize listener to update thumbnails on orientation change
        this.handleResize = () => {
            const newContent = this.renderPropertyImages(property);
            const parser = new DOMParser();
            const newDoc = parser.parseFromString(newContent, 'text/html');
            const newGallery = newDoc.querySelector('.property-images');
            const currentGallery = document.querySelector('.property-images');
            
            if (currentGallery && newGallery) {
                currentGallery.innerHTML = newGallery.innerHTML;
                this.initializeGallery(property.imagenes || []);
            }
        };
        
        window.addEventListener('resize', this.handleResize);
    }

    // Render modern property images gallery
    renderPropertyImages(property) {
        const images = property.imagenes || [];
        if (images.length === 0) {
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

        const mainImage = images[0];
        
        // Detect if mobile to show different number of thumbnails
        const isMobile = window.innerWidth <= 768;
        const thumbnailCount = isMobile ? 3 : 2; // 3 for mobile, 2 for desktop/tablet
        const thumbnails = images.slice(1, thumbnailCount + 1);

        return `
            <div class="property-images">
                <div class="image-gallery-container">
                    <div class="main-image-container">
                        <img src="${mainImage.imagen}" alt="${property.titulo || 'Propiedad'}" class="main-image" data-index="0">
                        <div class="image-counter">1 / ${images.length}</div>
                        ${images.length > 1 ? `
                            <button class="gallery-nav prev" onclick="propertyController.changeImage(-1)">‹</button>
                            <button class="gallery-nav next" onclick="propertyController.changeImage(1)">›</button>
                        ` : ''}
                    </div>
                    
                    ${thumbnails.length > 0 ? `
                        <div class="thumbnail-grid">
                            ${thumbnails.map((img, index) => `
                                <div class="thumbnail-item" onclick="propertyController.setMainImage(${index + 1})">
                                    <img src="${img.imagen}" alt="Imagen ${index + 2}" class="thumbnail-image">
                                    ${index === (thumbnailCount - 1) && images.length > thumbnailCount + 1 ? `
                                        <div class="thumbnail-overlay">+${images.length - thumbnailCount - 1}</div>
                                    ` : ''}
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
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
                    <button class="modal-close" onclick="propertyController.closeModal()">×</button>
                    <img src="" alt="" class="modal-image" id="modal-image">
                    <button class="modal-nav prev" onclick="propertyController.changeModalImage(-1)">‹</button>
                    <button class="modal-nav next" onclick="propertyController.changeModalImage(1)">›</button>
                    <div class="modal-counter" id="modal-counter">1 / ${images.length}</div>
                    <div class="modal-thumbnail-strip">
                        ${images.map((img, index) => `
                            <img src="${img.imagen}" alt="Imagen ${index + 1}" 
                                 class="modal-thumbnail ${index === 0 ? 'active' : ''}" 
                                 onclick="propertyController.setModalImage(${index})"
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
    // Helper method to normalize group names and handle capitalization issues
    normalizeGroupName(groupName) {
        if (!groupName) return 'Otros';
        
        // Convert to lowercase, then apply proper title case
        return groupName.toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }
    // Render property characteristics section
    renderPropertyCharacteristics(property) {
        if (!property.caracteristicas || property.caracteristicas.length === 0) {
            return '';
        }

        const groupedCharacteristics = {};
        property.caracteristicas.forEach(char => {
            // Skip "Datos del Inmueble" group
            // Normalize group name - convert to title case to handle inconsistent capitalization
            const normalizedGroup = this.normalizeGroupName(char.grupo);
            if (normalizedGroup === "Datos Del Inmueble") {
                return;
            }

            if (!groupedCharacteristics[normalizedGroup]) {
                groupedCharacteristics[normalizedGroup] = [];
            }
            groupedCharacteristics[normalizedGroup].push(char);
        });

        // If no characteristics remain after filtering, return empty
        if (Object.keys(groupedCharacteristics).length === 0) {
            return '';
        }

        return `
            <div class="property-characteristics">
                <h2 class="characteristics-title">Características</h2>
                ${Object.entries(groupedCharacteristics).map(([grupo, caracteristicas]) => `
                    <div class="characteristic-group">
                        <h3 class="group-title">${grupo}</h3>
                        <div class="characteristics-grid">
                            ${caracteristicas.map(char => `
                                <div class="characteristic-item">
                                    <div class="characteristic-label">${char.descripcion}</div>
                                    <div class="characteristic-value">${this.formatCharacteristicValue(char)}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Format characteristic value based on field type
    formatCharacteristicValue(characteristic) {
        // Handle checkbox type fields
        if (characteristic.tipo_campo === 'checkbox') {
            const value = characteristic.valor;
            // Check if value indicates true (1, "1", "true", "sí", "si", "yes")
            const isTrue = value === '1' || value === 1 || 
                          (typeof value === 'string' && 
                           ['true', 'sí', 'si', 'yes', 'verdadero'].includes(value.toLowerCase()));
            
            if (isTrue) {
                return '<span class="checkbox-value true">✅ Sí</span>';
            } else {
                return '<span class="checkbox-value false">❌ No</span>';
            }
        }
        
        // For other field types, return the value as is
        return characteristic.valor || 'N/A';
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


    // Update page meta information
    updatePageMeta() {
        if (!this.property) return;

        // Get the correct title
        const propertyTitle = this.property.clase_inmueble + ' en ' + this.property.municipio || this.property.title || 'Propiedad';

        // Update page title
        document.title = `${propertyTitle} - Inmobarco`;

        // Update meta description
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
            metaDescription.setAttribute('content', 
                `${propertyTitle} - ${this.formatCurrency(this.property.precio || this.property.price)} - ${this.property.ubicacion || this.property.location || 'Ubicación disponible'}`
            );
        }

        // Update Open Graph meta tags
        this.updateOGTags();
    }

    // Update Open Graph tags
    updateOGTags() {
        const propertyTitle = this.property.clase_inmueble + ' en ' + this.property.municipio || this.property.title || 'Propiedad';
        const propertyDescription = this.property.descripcion || this.property.description || `${propertyTitle} en Inmobarco`;
        const propertyImage = this.property.imagenes?.[0]?.url || this.property.images?.[0] || this.property.main_image;
        
        const ogTags = {
            'og:title': propertyTitle,
            'og:description': propertyDescription,
            'og:image': propertyImage,
            'og:url': window.location.href
        };

        Object.entries(ogTags).forEach(([property, content]) => {
            if (content) {
                let metaTag = document.querySelector(`meta[property="${property}"]`);
                if (!metaTag) {
                    metaTag = document.createElement('meta');
                    metaTag.setAttribute('property', property);
                    document.head.appendChild(metaTag);
                }
                metaTag.setAttribute('content', content);
            }
        });
    }

    // Initialize the controller
    async init() {
        await this.loadProperty();
    }

    // Initialize gallery functionality
    initializeGallery(images) {
        this.images = images;
        this.currentImageIndex = 0;
        this.modalCurrentIndex = 0;
        
        // Add click event to main image to open modal
        const mainImage = document.querySelector('.main-image');
        if (mainImage) {
            mainImage.addEventListener('click', () => this.openModal(0));
        }
    }

    // Initialize property map
    initializeMap(property) {
        const mapContainer = document.getElementById('property-map-container');
        if (!mapContainer) return;

        const lat = parseFloat(mapContainer.dataset.lat);
        const lng = parseFloat(mapContainer.dataset.lng);
        const address = mapContainer.dataset.address;

        if (isNaN(lat) || isNaN(lng)) return;

        // Add small random offset for privacy (approximate location)
        const offsetRange = 0.003; // ~400 meters max offset
        const latOffset = (Math.random() - 0.5) * offsetRange;
        const lngOffset = (Math.random() - 0.5) * offsetRange;
        
        const displayLat = lat + latOffset;
        const displayLng = lng + lngOffset;

        // Load Leaflet CSS and JS dynamically
        this.loadMapResources().then(() => {
            // Clear loading message
            mapContainer.innerHTML = '';
            
            // Initialize the map with offset coordinates
            const map = L.map('property-map-container').setView([displayLat, displayLng], 16);
            
            // Add OpenStreetMap tiles
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '© OpenStreetMap contributors'
            }).addTo(map);
            
           /* 
            const marker = L.marker([displayLat, displayLng]).addTo(map);
           marker.bindPopup(`
                <div class="map-popup">
                    <strong>${property.clase_inmueble || 'Propiedad'}</strong><br>
                    <small>${address}</small><br>
                    <em>${property.tipo_servicio || ''}</em><br>
                    <small style="color: #888;">📍 Ubicación aproximada</small>
                </div>
            `).openPopup();*/

            L.circle([displayLat, displayLng], {
                color: '#1B99D3',
                fillColor: '#48BFF7',
                fillOpacity: 0.2,
                radius: 200
            }).addTo(map);
            
        }).catch(error => {
            console.error('Error loading map:', error);
            mapContainer.innerHTML = `
                <div class="map-error">
                    <p>No se pudo cargar el mapa</p>
                    <small>Ubicación aproximada</small>
                </div>
            `;
        });
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

    // Change main image
    changeImage(direction) {
        if (!this.images || this.images.length <= 1) return;
        
        this.currentImageIndex += direction;
        if (this.currentImageIndex >= this.images.length) this.currentImageIndex = 0;
        if (this.currentImageIndex < 0) this.currentImageIndex = this.images.length - 1;
        
        this.updateMainImage();
    }

    // Set specific main image
    setMainImage(index) {
        if (!this.images || index >= this.images.length) return;
        this.currentImageIndex = index;
        this.updateMainImage();
    }

    // Update main image display
    updateMainImage() {
        const mainImage = document.querySelector('.main-image');
        const counter = document.querySelector('.image-counter');
        
        if (mainImage && this.images[this.currentImageIndex]) {
            mainImage.src = this.images[this.currentImageIndex].imagen;
            mainImage.setAttribute('data-index', this.currentImageIndex);
        }
        
        if (counter) {
            counter.textContent = `${this.currentImageIndex + 1} / ${this.images.length}`;
        }
    }

    // Open modal gallery
    openModal(index = 0) {
        const modal = document.getElementById('gallery-modal');
        if (!modal || !this.images || this.images.length === 0) return;
        
        this.modalCurrentIndex = index;
        modal.classList.add('active');
        document.body.classList.add('modal-open');
        
        this.updateModalImage();
        
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
    
    // Cleanup method to remove event listeners
    cleanup() {
        if (this.handleResize) {
            window.removeEventListener('resize', this.handleResize);
        }
        if (this.handleKeyboard) {
            document.removeEventListener('keydown', this.handleKeyboard);
        }
    }
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

        // Initialize encryption module with config
        if (window.propertyEncryption) {
            const encryptionSuccess = window.propertyEncryption.init(config.encryption);
            if (!encryptionSuccess) {
                throw new Error('Failed to initialize encryption module');
            }
        } else {
            throw new Error('Property encryption module not available');
        }

        // Set up API configuration
        let apiConfig;
        if (typeof SecureAPIConfig !== 'undefined') {
            const secureConfig = new SecureAPIConfig();
            apiConfig = {
                baseUrl: secureConfig.getAPIUrl(),
                token: secureConfig.getAuthToken(),
                instance: secureConfig.getInstance()
            };
        } else {
            // Use configuration from loaded config
            apiConfig = config.api;
        }

        // Create global controller instance with loaded configuration
        window.propertyController = new PropertyDetailController(apiConfig);
        
        // Store company configuration globally for contact methods
        window.companyConfig = config.company;

        // Initialize the property detail page
        await window.propertyController.init();

    } catch (error) {
        console.error('❌ Failed to initialize application:', error);
        
        // Show error to user
        const errorEl = document.getElementById('error');
        if (errorEl) {
            errorEl.innerHTML = `
                <div class="error-container">
                    <h2>Error de Configuración</h2>
                    <p>${error.message}</p>
                    <div class="error-details">
                        <p>Posibles causas:</p>
                        <ul>
                            <li>El archivo config.json no está configurado correctamente</li>
                            <li>Las claves de encriptación no están definidas</li>
                            <li>El ID en la URL no está encriptado</li>
                        </ul>
                        <p>Ver <a href="./ENCRIPTACION.md" target="_blank">documentación de encriptación</a> para más información.</p>
                    </div>
                </div>
            `;
            errorEl.style.display = 'block';
        }
        
        // Hide loading
        const loadingEl = document.getElementById('loading');
        if (loadingEl) loadingEl.style.display = 'none';
    }
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ArrendasoftAPI, PropertyDetailController };
}
