class PropertyManagerAuth {
    constructor() {
        this.isAuthenticated = false;
        this.sessionKey = 'propertyManagerAuth';
        this.sessionTimeout = 24 * 60 * 60 * 1000; // 24 horas
        this.currentPage = 1;
        this.isLoadingMore = false;
        this.hasMoreProperties = true;
        this.allProperties = [];
        this.init();
    }

    async init() {
        try {
            // Mostrar indicador de carga
            this.showLoading();

            // Cargar configuración
            await window.envConfig.loadConfig();

            // Inicializar encriptación
            this.initializeEncryption();

            // Verificar si ya está autenticado
            if (this.checkExistingSession()) {
                this.showContent();
            } else {
                this.showLogin();
            }

            // Configurar event listeners
            this.setupEventListeners();

        } catch (error) {
            console.error('Error initializing auth:', error);
            this.showError('Error al cargar la configuración. Recarga la página.');
        }
    }

    showLoading() {
        document.getElementById('loading').style.display = 'block';
        document.getElementById('loginContainer').style.display = 'none';
        document.getElementById('properties-content').classList.remove('authenticated');
    }

    showLogin() {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('loginContainer').style.display = 'block';
        document.getElementById('properties-content').classList.remove('authenticated');
        
        // Focus en el campo de contraseña después de que sea visible
        setTimeout(() => {
            const passwordField = document.getElementById('password');
            if (passwordField && passwordField.offsetParent !== null) {
                passwordField.focus();
            }
        }, 100);
    }

    showContent() {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('loginContainer').style.display = 'none';
        document.getElementById('properties-content').style.display = 'block';
        document.getElementById('properties-content').classList.add('authenticated');
        this.isAuthenticated = true;
        
        // Cargar propiedades después de mostrar el contenido
        this.loadProperties();
    }

    showError(message) {
        const errorElement = document.getElementById('errorMessage');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        } else {
            alert(message);
        }
    }

    hideError() {
        const errorElement = document.getElementById('errorMessage');
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    }

    setupEventListeners() {
        // Form submit
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.handleLogin();
            });
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }

        // Enter key en password field
        const passwordField = document.getElementById('password');
        if (passwordField) {
            passwordField.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.handleLogin();
                }
            });

            // Hide error on input
            passwordField.addEventListener('input', () => {
                this.hideError();
            });
        }
    }

    async handleLogin() {
        const passwordField = document.getElementById('password');
        
        // Verificar que el campo sea visible y accesible
        if (!passwordField || passwordField.offsetParent === null) {
            console.error('Password field not accessible');
            return;
        }

        const enteredPassword = passwordField.value.trim();

        if (!enteredPassword) {
            this.showError('Por favor, ingresa la contraseña.');
            passwordField.focus();
            return;
        }

        try {
            // Obtener la contraseña correcta desde la configuración
            const correctPassword = window.envConfig.getPropertiesKey();

            if (!correctPassword) {
                this.showError('Error de configuración. Contacta al administrador.');
                return;
            }

            // Verificar contraseña
            if (enteredPassword === correctPassword) {
                // Autenticación exitosa
                this.setSession();
                this.showContent();
                passwordField.value = ''; // Limpiar campo
            } else {
                // Contraseña incorrecta
                this.showError('Contraseña incorrecta. Inténtalo de nuevo.');
                passwordField.value = '';
                setTimeout(() => {
                    if (passwordField.offsetParent !== null) {
                        passwordField.focus();
                    }
                }, 100);
            }

        } catch (error) {
            console.error('Error during login:', error);
            this.showError('Error al verificar la contraseña.');
        }
    }

    setSession() {
        const sessionData = {
            authenticated: true,
            timestamp: Date.now()
        };
        
        try {
            localStorage.setItem(this.sessionKey, JSON.stringify(sessionData));
        } catch (error) {
            console.warn('Could not save session to localStorage:', error);
            // Continuar sin persistencia de sesión
        }
    }

    checkExistingSession() {
        try {
            const sessionData = localStorage.getItem(this.sessionKey);
            
            if (!sessionData) {
                return false;
            }

            const parsed = JSON.parse(sessionData);
            const now = Date.now();

            // Verificar si la sesión no ha expirado
            if (parsed.authenticated && (now - parsed.timestamp) < this.sessionTimeout) {
                return true;
            } else {
                // Sesión expirada, limpiar
                this.clearSession();
                return false;
            }

        } catch (error) {
            console.warn('Error checking session:', error);
            this.clearSession();
            return false;
        }
    }

    logout() {
        this.isAuthenticated = false;
        this.removeInfiniteScroll(); // Limpiar scroll listener
        this.clearSession();
        this.showLogin();
    }

    clearSession() {
        try {
            localStorage.removeItem(this.sessionKey);
        } catch (error) {
            console.warn('Could not clear session:', error);
        }
    }

    // Método para cargar y mostrar propiedades
    async loadProperties() {
        try {
            // Resetear variables de paginación
            this.currentPage = 1;
            this.isLoadingMore = false;
            this.hasMoreProperties = true;
            this.allProperties = [];
            this.allPropertiesFromAPI = []; // Todas las propiedades de la API
            this.propertiesPerPage = 60; // Mostrar 60 propiedades por página

            // Mostrar indicador de carga en el contenido
            this.showPropertiesLoading();
            
            // Cargar TODAS las propiedades en bloques de 100
            await this.loadAllPropertiesFromAPI();
            
            // Mostrar primera página
            this.displayCurrentPage();
            
            // Configurar scroll infinito
            this.setupInfiniteScroll();
            
        } catch (error) {
            console.error('Error cargando propiedades:', error);
            this.showPropertiesError(error.message);
        }
    }

    async loadAllPropertiesFromAPI() {
        try {
            // Obtener configuración WASI
            const wasiConfig = window.envConfig.getWasiConfig();
            if (!wasiConfig) {
                throw new Error('Configuración WASI no encontrada');
            }

            // Crear instancia de WASI API
            const wasiApi = new WasiAPI(wasiConfig);
            
            let allProperties = [];
            let currentPage = 1;
            let hasMorePages = true;
            let totalFromAPI = 0;
            
            logger.debug('🔄 Iniciando carga de todas las propiedades...');
            
            // Cargar propiedades en bloques de 100 hasta obtener todas
            while (hasMorePages) {
                try {
                    logger.debug(`📋 Cargando página ${currentPage} (hasta 60 propiedades)...`);
                    
                    const properties = await wasiApi.searchProperties({ 
                        short: 'true',
                        take: '60',  // Máximo permitido por la API
                        skip: ((currentPage-1)*60).toString()
                    });
                    
                    // Obtener total de la primera respuesta
                    if (currentPage === 1) {
                        totalFromAPI = properties.total || 0;
                        logger.debug(`📊 Total de propiedades disponibles en la API: ${totalFromAPI}`);
                    }
                    
                    // Extraer propiedades de esta página
                    const pageProperties = this.extractPropertiesFromData(properties);
                    logger.debug(`✅ Cargadas ${pageProperties.length} propiedades de la página ${currentPage}`);
                    
                    if (pageProperties.length > 0) {
                        allProperties = [...allProperties, ...pageProperties];
                        
                        // Verificar si hemos cargado todas las propiedades disponibles
                        if (allProperties.length >= totalFromAPI || pageProperties.length === 0) {
                            hasMorePages = false;
                            logger.debug(`🏁 Todas las propiedades cargadas: ${allProperties.length} de ${totalFromAPI}`);
                        } else {
                            currentPage++;
                            logger.debug(`📈 Progreso: ${allProperties.length}/${totalFromAPI} propiedades cargadas`);
                            // Pequeña pausa entre llamadas para evitar rate limiting
                            await new Promise(resolve => setTimeout(resolve, 200));
                        }
                    } else {
                        hasMorePages = false;
                        logger.debug('🏁 No hay más propiedades disponibles en esta página');
                    }
                    
                } catch (error) {
                    console.error(`❌ Error cargando página ${currentPage}:`, error.message);
                    // Si falla una página, intentar la siguiente
                    if (currentPage < 10) { // Máximo 10 páginas para evitar loops infinitos
                        currentPage++;
                        await new Promise(resolve => setTimeout(resolve, 1000)); // Pausa más larga en caso de error
                    } else {
                        hasMorePages = false;
                    }
                }
            }
            
            this.allPropertiesFromAPI = allProperties;
            logger.debug(`🎉 Carga completa: ${this.allPropertiesFromAPI.length} propiedades cargadas de ${totalFromAPI} disponibles`);
            
        } catch (error) {
            console.error('Error cargando todas las propiedades:', error);
            throw error;
        }
    }

    async loadMoreProperties() {
        if (this.isLoadingMore || !this.hasMoreProperties) {
            return;
        }

        this.isLoadingMore = true;
        
        try {
            // Simular delay de carga para mejor UX
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Calcular índices para la paginación
            const startIndex = (this.currentPage - 1) * this.propertiesPerPage;
            const endIndex = startIndex + this.propertiesPerPage;
            
            // Obtener propiedades de la página actual
            const newProperties = this.allPropertiesFromAPI.slice(startIndex, endIndex);
            
            if (newProperties.length > 0) {
                this.allProperties = [...this.allProperties, ...newProperties];
                this.currentPage++;
                
                // Verificar si hay más propiedades
                if (endIndex >= this.allPropertiesFromAPI.length) {
                    this.hasMoreProperties = false;
                }
                
                // Actualizar display
                this.displayAllProperties();
            } else {
                this.hasMoreProperties = false;
            }
            
        } catch (error) {
            console.error('Error cargando más propiedades:', error);
            this.hasMoreProperties = false;
        } finally {
            this.isLoadingMore = false;
        }
    }

    displayCurrentPage() {
        // Cargar primera página
        const firstPageProperties = this.allPropertiesFromAPI.slice(0, this.propertiesPerPage);
        this.allProperties = firstPageProperties;
        
        // Verificar si hay más páginas
        this.hasMoreProperties = this.allPropertiesFromAPI.length > this.propertiesPerPage;
        this.currentPage = 2; // La siguiente página será la 2
        
        // Mostrar propiedades
        this.displayAllProperties();
    }

    extractPropertiesFromData(data) {
        const properties = [];
        
        if (data && typeof data === 'object') {
            // Extraer propiedades de los índices numéricos
            for (let i = 0; i < (data.total || 100); i++) {
                if (data[i.toString()]) {
                    properties.push(data[i.toString()]);
                }
            }
        }
        
        return properties;
    }

    setupInfiniteScroll() {
        const scrollHandler = () => {
            const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
            
            // Si está cerca del final de la página (100px antes del final)
            if (scrollTop + clientHeight >= scrollHeight - 100) {
                this.loadMoreProperties();
            }
        };

        // Eliminar listener anterior si existe
        window.removeEventListener('scroll', this.scrollHandler);
        
        // Guardar referencia para poder eliminarlo después
        this.scrollHandler = scrollHandler;
        
        // Agregar nuevo listener
        window.addEventListener('scroll', scrollHandler);
    }

    removeInfiniteScroll() {
        if (this.scrollHandler) {
            window.removeEventListener('scroll', this.scrollHandler);
            this.scrollHandler = null;
        }
    }

    showPropertiesLoading() {
        const container = document.getElementById('properties-content');
        container.innerHTML = `
            <div class="properties-header">
                <h1>Gestor de Propiedades</h1>
                <button id="logoutBtn" class="logout-btn">Cerrar Sesión</button>
            </div>
            <div class="loading-properties">
                <p>Cargando propiedades...</p>
            </div>
        `;
        
        // Re-attach logout listener
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
        });
    }

    displayAllProperties() {
        const container = document.getElementById('properties-content');
        
        let propertiesList = '';
        const propertiesCount = this.allProperties.length;
        const totalProperties = this.allPropertiesFromAPI.length;
        
        if (propertiesCount > 0) {
            propertiesList = this.allProperties.map((property, index) => `
                <div class="property-item">
                    <div class="property-content">
                        <h3>${property.registration_number || 'Sin numero de apto'}</h3>
                        <p class="property-id">ID: ${property.id_property || property.id || 'N/A'}</p>
                        <p class="property-price">
                        ${property.for_rent === "true" ? 'Alquiler ' + property.rent_price_label : ''}
                        ${property.for_sale === "true" ? 'Venta ' + property.sale_price_label : ''}
                        </p>
                        <p class="property-location">${property.city_label || ''} ${property.zone_label ? '- ' + property.zone_label : ''}</p>
                        <p class="property-details">${property.bedrooms ? property.bedrooms + ' hab' : ''} ${property.bathrooms ? '• ' + property.bathrooms + ' baños' : ''} ${property.area ? '• ' + property.area + ' m²' : ''}</p>
                    </div>
                    <div class="property-actions">
                        <button class="action-btn copy-link-btn" onclick="window.propertyManagerAuth.copyPropertyLink('${property.id_property || property.id || ''}', '${property.registration_number || 'Propiedad'}')">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.71"></path>
                            </svg>
                            Copiar enlace
                        </button>
                        <button class="action-btn open-property-btn" onclick="window.propertyManagerAuth.openPropertyDetail('${property.id_property || property.id || ''}')">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                <polyline points="15,3 21,3 21,9"></polyline>
                                <line x1="10" y1="14" x2="21" y2="3"></line>
                            </svg>
                            Abrir ficha
                        </button>
                    </div>
                </div>
            `).join('');
        } else {
            propertiesList = '<p>No se encontraron propiedades disponibles.</p>';
        }

        // Indicador de carga si está cargando más
        const loadingIndicator = this.isLoadingMore ? `
            <div class="loading-more">
                <p>Cargando más propiedades...</p>
            </div>
        ` : '';

        // Mensaje de fin si no hay más propiedades
        const endMessage = !this.hasMoreProperties && propertiesCount > 0 ? `
            <div class="end-message">
                <p>Has visto todas las propiedades (${totalProperties} total)</p>
            </div>
        ` : '';

        // Indicador de progreso
        const progressIndicator = totalProperties > 0 ? `
            <div class="progress-indicator">
                <p>Mostrando ${propertiesCount} de ${totalProperties} propiedades</p>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${(propertiesCount / totalProperties) * 100}%"></div>
                </div>
            </div>
        ` : '';

        container.innerHTML = `
            <div class="properties-header">
                <h1>Gestor de Propiedades</h1>
                <button id="logoutBtn" class="logout-btn">Cerrar Sesión</button>
            </div>
            <div class="properties-list">
                <h2>Lista de Propiedades</h2>
                ${progressIndicator}
                ${propertiesList}
                ${loadingIndicator}
                ${endMessage}
            </div>
        `;
        
        // Re-attach logout listener
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
        });
    }

    showPropertiesError(errorMessage) {
        const container = document.getElementById('properties-content');
        container.innerHTML = `
            <div class="properties-header">
                <h1>Gestor de Propiedades</h1>
                <button id="logoutBtn" class="logout-btn">Cerrar Sesión</button>
            </div>
            <div class="error-container">
                <h2>Error al cargar propiedades</h2>
                <p>${errorMessage}</p>
                <button onclick="window.propertyManagerAuth.loadProperties()" class="retry-btn">
                    Reintentar
                </button>
            </div>
        `;
        
        // Re-attach logout listener
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
        });
    }

    // Método público para verificar autenticación
    isUserAuthenticated() {
        return this.isAuthenticated;
    }

    // Inicializar módulo de encriptación
    initializeEncryption() {
        try {
            // Obtener configuración de encriptación desde env-config
            const encryptionConfig = window.envConfig.getEncryptionConfig();
            
            if (window.propertyEncryption && encryptionConfig) {
                const initialized = window.propertyEncryption.init(encryptionConfig);
                if (initialized) {
                    console.log('✅ Encriptación inicializada correctamente');
                } else {
                    console.warn('⚠️ Error al inicializar encriptación - usando URLs sin encriptar');
                }
            } else {
                console.warn('⚠️ Módulo de encriptación no disponible - usando URLs sin encriptar');
            }
        } catch (error) {
            console.error('❌ Error inicializando encriptación:', error);
        }
    }

    // Método para generar URL de la propiedad
    generatePropertyUrl(propertyId) {
        if (!propertyId) {
            return null;
        }

        try {
            // Verificar si la encriptación está disponible e inicializada
            if (window.propertyEncryption && window.propertyEncryption.initialized) {
                // Usar el método generatePropertyUrl del módulo de encriptación
                const encryptedUrl = window.propertyEncryption.generatePropertyUrl(propertyId, 'http://ficha.inmobarco.com/');
                
                if (encryptedUrl) {
                    console.log(`🔐 URL generada para propiedad ${propertyId}: ${encryptedUrl}`);
                    return encryptedUrl;
                } else {
                    console.error('❌ Error al generar URL encriptada para propiedad:', propertyId);
                    return this.generateFallbackUrl(propertyId);
                }
            } else {
                // Fallback si no hay encriptación disponible
                console.warn('⚠️ Encriptación no disponible, usando URL sin encriptar');
                return this.generateFallbackUrl(propertyId);
            }
        } catch (error) {
            console.error('❌ Error generando URL:', error);
            return this.generateFallbackUrl(propertyId);
        }
    }

    // Método fallback para generar URL sin encriptación
    generateFallbackUrl(propertyId) {
        const baseUrl = window.location.origin + window.location.pathname.replace('/manager/index.html', '');
        return `${baseUrl}/index.html?id=${propertyId}`;
    }

    // Método para copiar el enlace de la propiedad
    copyPropertyLink(propertyId, propertyName) {
        if (!propertyId) {
            this.showNotification('Error: ID de propiedad no válido', 'error');
            return;
        }

        // Generar la URL usando la función dedicada
        const propertyUrl = this.generatePropertyUrl(propertyId);
        
        if (!propertyUrl) {
            this.showNotification('Error al generar la URL', 'error');
            return;
        }
        
        // Copiar al portapapeles
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(propertyUrl).then(() => {
                this.showNotification(`Enlace copiado: ${propertyName}`, 'success');
            }).catch(err => {
                console.error('Error al copiar:', err);
                this.fallbackCopyTextToClipboard(propertyUrl, propertyName);
            });
        } else {
            // Fallback para navegadores más antiguos o contextos no seguros
            this.fallbackCopyTextToClipboard(propertyUrl, propertyName);
        }
    }

    // Método fallback para copiar texto
    fallbackCopyTextToClipboard(text, propertyName) {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.className = "temp-copy-textarea";
        
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            const successful = document.execCommand('copy');
            if (successful) {
                this.showNotification(`Enlace copiado: ${propertyName}`, 'success');
            } else {
                this.showNotification('Error al copiar el enlace', 'error');
            }
        } catch (err) {
            console.error('Error en fallback copy:', err);
            this.showNotification('Error al copiar el enlace', 'error');
        }
        
        document.body.removeChild(textArea);
    }

    // Método para abrir la ficha de la propiedad
    openPropertyDetail(propertyId) {
        if (!propertyId) {
            this.showNotification('Error: ID de propiedad no válido', 'error');
            return;
        }

        // Generar la URL usando la función dedicada
        const propertyUrl = this.generatePropertyUrl(propertyId);
        
        if (!propertyUrl) {
            this.showNotification('Error al generar la URL', 'error');
            return;
        }
        
        // Abrir en nueva pestaña
        window.open(propertyUrl, '_blank');
    }

    // Método para mostrar notificaciones
    showNotification(message, type = 'info') {
        // Crear el elemento de notificación
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.remove()">×</button>
        `;
        
        // Agregar al cuerpo del documento
        document.body.appendChild(notification);
        
        // Mostrar la notificación
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        // Auto-eliminar después de 5 segundos
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300);
        }, 5000);
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.propertyManagerAuth = new PropertyManagerAuth();
});