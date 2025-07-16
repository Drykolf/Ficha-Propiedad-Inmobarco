// Configuration loader
class ConfigLoader {
    static async loadConfig() {
        try {
            const response = await fetch('./config.json');
            if (!response.ok) {
                throw new Error('Config file not found');
            }
            return await response.json();
        } catch (error) {
            console.warn('⚠️ Could not load config.json, using fallback configuration');
            // Fallback configuration
        }
    }
}

// Arrendasoft API Integration Module
// This module provides a clean interface to interact with Arrendasoft V2 API

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
        // Use the encryption module to get and decrypt the property ID
        if (window.propertyEncryption) {
            const propertyId = window.propertyEncryption.getPropertyIdFromUrl();
            if (propertyId) return propertyId;
        }

        // Fallback to legacy method if encryption module is not available
        console.warn('⚠️ Property encryption module not available, using fallback method');
        
        // Option 1: From query parameter ?id=123
        const urlParams = new URLSearchParams(window.location.search);
        const idParam = urlParams.get('id');

        if (idParam) return idParam;

        // Option 2: From path like /property/123
        const pathParts = window.location.pathname.split('/');
        const propertyIndex = pathParts.findIndex(part => part === 'property');

        if (propertyIndex !== -1 && pathParts[propertyIndex + 1]) {
            return pathParts[propertyIndex + 1];
        }

        // Option 3: From last part of URL
        return pathParts[pathParts.length - 1];
    }

    // Load property data
    async loadProperty() {
        try {
            if (!this.propertyId) {
                throw new Error('Property ID not found in URL');
            }

            this.showLoading();

            // Load property details
            this.property = await this.api.getProperty(this.propertyId);

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
            console.error('Error loading property:', error);
            this.showError(error.message);
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
                            
                            <div class="property-location">
                                <span class="location-icon">📍</span>
                                ${property.barrio}, ${property.municipio}
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
                    </div>
                </div>
            </div>
            
            ${this.renderImageModal(property)}
        `;

        contentEl.innerHTML = html;
        contentEl.style.display = 'block';
        
        // Initialize gallery functionality
        this.initializeGallery(property.imagenes || []);
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
        const thumbnails = images.slice(1, 3); // Show exactly 2 thumbnails

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
                                    ${index === 1 && images.length > 3 ? `
                                        <div class="thumbnail-overlay">+${images.length - 3}</div>
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

    // Render property characteristics section
    renderPropertyCharacteristics(property) {
        if (!property.caracteristicas || property.caracteristicas.length === 0) {
            return '';
        }

        const groupedCharacteristics = {};
        property.caracteristicas.forEach(char => {
            if (!groupedCharacteristics[char.grupo]) {
                groupedCharacteristics[char.grupo] = [];
            }
            groupedCharacteristics[char.grupo].push(char);
        });

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
                                    <div class="characteristic-value">${char.valor}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
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
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    // Load configuration from config.json
    const config = await ConfigLoader.loadConfig();
    let apiConfig;
    
    if (typeof SecureAPIConfig !== 'undefined') {
        const secureConfig = new SecureAPIConfig();
        apiConfig = {
            baseUrl: secureConfig.getAPIUrl(),
            token: secureConfig.getAuthToken(),
            instance: secureConfig.getInstance()
        };
        console.log('✅ Using secure API configuration');
    } else {
        // Use configuration from config.json
        apiConfig = config.api;
        console.log('✅ Using configuration from config.json');
    }

    // Create global controller instance with loaded configuration
    window.propertyController = new PropertyDetailController(apiConfig);
    
    // Store company configuration globally for contact methods
    window.companyConfig = config.company;

    // Initialize the property detail page
    window.propertyController.init();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ArrendasoftAPI, PropertyDetailController };
}
