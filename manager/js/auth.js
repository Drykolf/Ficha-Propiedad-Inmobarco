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
                <div class="header-actions">
                    <button id="newApartmentBtn" class="new-apartment-btn" disabled style="opacity: 0.5; cursor: not-allowed;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Nuevo Apartamento
                    </button>
                    <button id="logoutBtn" class="logout-btn">Cerrar Sesión</button>
                </div>
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
                        <h3>${property.registration_number || property.reference || 'Sin referencia'}</h3>
                        <p class="property-id">ID: ${property.id_property || property.id || 'N/A'}</p>
                        <p class="property-price">
                        ${property.for_rent === "true" ? 'Alquiler ' + property.rent_price_label : ''}
                        ${property.for_sale === "true" ? 'Venta ' + property.sale_price_label : ''}
                        </p>
                        <p class="property-location">${property.city_label || ''} ${property.zone_label ? '- ' + property.zone_label : ''}</p>
                        <p class="property-details">${property.bedrooms ? property.bedrooms + ' hab' : ''} ${property.bathrooms ? '• ' + property.bathrooms + ' baños' : ''} ${property.area ? '• ' + property.area + ' m²' : ''} ${property.garages ? '• ' + property.garages + ' parqueos' : ''}</p>
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
                        <button class="action-btn add-to-excel-btn" onclick="window.propertyManagerAuth.addToExcel('${property.id_property || property.id || ''}', '${property.registration_number || 'Propiedad'}')">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14,2 14,8 20,8"></polyline>
                                <line x1="12" y1="18" x2="12" y2="12"></line>
                                <line x1="9" y1="15" x2="15" y2="15"></line>
                            </svg>
                            Agregar a excel
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
                <div class="header-actions">
                    <button id="newApartmentBtn" class="new-apartment-btn" disabled style="opacity: 0.5; cursor: not-allowed;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Nuevo Apartamento
                    </button>
                    <button id="logoutBtn" class="logout-btn">Cerrar Sesión</button>
                </div>
            </div>
            <div class="search-container">
                <div class="search-box">
                    <input 
                        type="text" 
                        id="searchInput" 
                        class="search-input" 
                        placeholder="Buscar por referencia..."
                    />
                    <button id="searchBtn" class="search-btn">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="11" cy="11" r="8"></circle>
                            <path d="m21 21-4.35-4.35"></path>
                        </svg>
                        Buscar
                    </button>
                    <button id="clearSearchBtn" class="clear-search-btn" style="display: none;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                        Limpiar
                    </button>
                </div>
                <div class="search-filters">
                    <div class="filter-row">
                        <div class="filter-group">
                            <label class="filter-checkbox">
                                <input type="checkbox" id="forSaleFilter" />
                                <span>En venta</span>
                            </label>
                            <label class="filter-checkbox">
                                <input type="checkbox" id="forRentFilter" />
                                <span>En alquiler</span>
                            </label>
                        </div>
                        <div class="filter-input-group">
                            <label for="cityFilter">Ciudad:</label>
                            <select id="cityFilter" class="filter-select">
                                <option value="">Todas</option>
                                <option value="291">Envigado</option>
                                <option value="389">Itagüí</option>
                                <option value="416">La Estrella</option>
                                <option value="496">Medellín</option>
                                <option value="698">Sabaneta</option>
                            </select>
                        </div>
                    </div>
                    <div class="filter-row">
                        <div class="filter-input-group">
                            <label for="minBedroomsFilter">Habitaciones mín:</label>
                            <input type="number" id="minBedroomsFilter" min="0" placeholder="0" />
                        </div>
                        <div class="filter-input-group">
                            <label for="bathroomsFilter">Baños:</label>
                            <input type="number" id="bathroomsFilter" min="0" placeholder="0" />
                        </div>
                        <div class="filter-input-group">
                            <label for="garagesFilter">Garajes:</label>
                            <input type="number" id="garagesFilter" min="0" placeholder="0" />
                        </div>
                    </div>
                    <div class="filter-row">
                        <div class="filter-input-group">
                            <label for="maxPriceFilter">Precio máx:</label>
                            <input type="number" id="maxPriceFilter" min="0" placeholder="Sin límite" />
                        </div>
                        <div class="filter-input-group">
                            <label for="minAreaFilter">Área mín (m²):</label>
                            <input type="number" id="minAreaFilter" min="0" placeholder="0" />
                        </div>
                    </div>
                </div>
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

        // Attach search listeners
        this.attachSearchListeners();
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

    // Métodos de búsqueda
    attachSearchListeners() {
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.getElementById('searchBtn');
        const clearSearchBtn = document.getElementById('clearSearchBtn');

        if (searchInput) {
            // Búsqueda al presionar Enter
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.performSearch();
                }
            });

            // Mostrar/ocultar botón limpiar
            searchInput.addEventListener('input', (e) => {
                if (clearSearchBtn) {
                    clearSearchBtn.style.display = e.target.value.trim() ? 'flex' : 'none';
                }
            });
        }

        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                this.performSearch();
            });
        }

        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', () => {
                this.clearSearch();
            });
        }
    }

    async performSearch() {
        const searchInput = document.getElementById('searchInput');

        if (!searchInput) return;

        try {
            // Mostrar indicador de carga
            this.showSearchLoading();

            // Obtener configuración WASI
            const wasiConfig = window.envConfig.getWasiConfig();
            if (!wasiConfig) {
                throw new Error('Configuración WASI no encontrada');
            }

            // Crear instancia de WASI API
            const wasiApi = new WasiAPI(wasiConfig);

            // Construir parámetros de búsqueda base
            const searchParams = {
                short: 'true',
                take: '100'
            };

            // Agregar término de búsqueda si está presente
            const searchTerm = searchInput.value.trim();
            if (searchTerm) {
                searchParams.match = searchTerm;
            }

            // Agregar filtros adicionales si están definidos
            const forSale = document.getElementById('forSaleFilter');
            const forRent = document.getElementById('forRentFilter');
            const cityFilter = document.getElementById('cityFilter');
            const minBedrooms = document.getElementById('minBedroomsFilter');
            const bathrooms = document.getElementById('bathroomsFilter');
            const garages = document.getElementById('garagesFilter');
            const maxPrice = document.getElementById('maxPriceFilter');
            const minArea = document.getElementById('minAreaFilter');

            if (forSale && forSale.checked) {
                searchParams.for_sale = 'true';
            }

            if (forRent && forRent.checked) {
                searchParams.for_rent = 'true';
            }

            if (cityFilter && cityFilter.value) {
                searchParams.id_city = cityFilter.value;
            }

            if (minBedrooms && minBedrooms.value) {
                searchParams.min_bedrooms = minBedrooms.value;
            }

            if (bathrooms && bathrooms.value) {
                searchParams.bathrooms = bathrooms.value;
            }

            if (garages && garages.value) {
                searchParams.garages = garages.value;
            }

            if (maxPrice && maxPrice.value) {
                searchParams.max_price = maxPrice.value;
            }

            if (minArea && minArea.value) {
                searchParams.min_area = minArea.value;
            }

            logger.debug('🔍 Realizando búsqueda:', searchParams);

            // Realizar búsqueda
            const results = await wasiApi.searchProperties(searchParams);
            const properties = this.extractPropertiesFromData(results);

            logger.debug(`✅ Búsqueda completada: ${properties.length} resultados`);

            // Actualizar propiedades mostradas
            this.allPropertiesFromAPI = properties;
            this.allProperties = properties;
            this.currentPage = 2;
            this.hasMoreProperties = false;

            // Mostrar resultados
            this.displayAllProperties();

            // Mostrar notificación
            if (properties.length > 0) {
                this.showNotification(`Se encontraron ${properties.length} propiedades`, 'success');
            } else {
                this.showNotification('No se encontraron propiedades con ese criterio', 'info');
            }

        } catch (error) {
            console.error('Error en búsqueda:', error);
            this.showNotification('Error al realizar la búsqueda: ' + error.message, 'error');
            this.displayAllProperties(); // Mostrar propiedades actuales
        }
    }

    clearSearch() {
        const searchInput = document.getElementById('searchInput');
        const clearSearchBtn = document.getElementById('clearSearchBtn');

        if (searchInput) {
            searchInput.value = '';
        }

        if (clearSearchBtn) {
            clearSearchBtn.style.display = 'none';
        }

        // Limpiar todos los filtros
        const forSale = document.getElementById('forSaleFilter');
        const forRent = document.getElementById('forRentFilter');
        const cityFilter = document.getElementById('cityFilter');
        const minBedrooms = document.getElementById('minBedroomsFilter');
        const bathrooms = document.getElementById('bathroomsFilter');
        const garages = document.getElementById('garagesFilter');
        const maxPrice = document.getElementById('maxPriceFilter');
        const minArea = document.getElementById('minAreaFilter');

        if (forSale) forSale.checked = false;
        if (forRent) forRent.checked = false;
        if (cityFilter) cityFilter.value = '';
        if (minBedrooms) minBedrooms.value = '';
        if (bathrooms) bathrooms.value = '';
        if (garages) garages.value = '';
        if (maxPrice) maxPrice.value = '';
        if (minArea) minArea.value = '';

        // Recargar todas las propiedades
        this.showNotification('Cargando todas las propiedades...', 'info');
        this.loadProperties();
    }

    showSearchLoading() {
        const container = document.getElementById('properties-content');
        const propertiesList = container.querySelector('.properties-list');
        
        if (propertiesList) {
            propertiesList.innerHTML = `
                <h2>Lista de Propiedades</h2>
                <div class="loading-properties">
                    <p>Buscando propiedades...</p>
                </div>
            `;
        }
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

    // Método para agregar propiedad a excel
    async addToExcel(propertyId, propertyName) {
        if (!propertyId) {
            this.showNotification('Error: ID de propiedad no válido', 'error');
            return;
        }

        try {
            // Mostrar notificación de procesamiento
            this.showNotification(`Agregando ${propertyName} a Excel...`, 'info');

            // Generar ID encriptado
            let encryptedId = null;
            
            if (window.propertyEncryption && window.propertyEncryption.initialized) {
                encryptedId = window.propertyEncryption.encrypt(propertyId);
                console.log(`🔐 ID encriptado generado: ${encryptedId}`);
            } else {
                console.warn('⚠️ Encriptación no disponible, enviando sin encriptar');
            }

            // Preparar datos para enviar
            const data = {
                propertyId: propertyId,
                encryptedId: encryptedId || propertyId, // Fallback si no hay encriptación
                propertyName: propertyName,
                timestamp: new Date().toISOString()
            };

            console.log('📤 Enviando datos al webhook:', data);

            // Enviar al webhook
            const response = await fetch('https://automa-inmobarco-n8n.druysh.easypanel.host/webhook/add-excel-apt', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            // Verificar respuesta
            if (response.ok) {
                const result = await response.json().catch(() => null);
                console.log('✅ Respuesta del webhook:', result);
                this.showNotification(`✓ ${propertyName} agregado a Excel correctamente`, 'success');
            } else {
                console.warn(`⚠️ Respuesta del servidor: ${response.status}`);
                // Asumir éxito si el servidor responde (aunque sea con error)
                this.showNotification(`✓ ${propertyName} enviado a Excel`, 'success');
            }

        } catch (error) {
            console.error('❌ Error al agregar a Excel:', error);
            this.showNotification(`Error al agregar ${propertyName} a Excel: ${error.message}`, 'error');
        }
    }

    // Método para abrir el modal de nuevo apartamento
    openNewApartmentModal() {
        // Crear el modal
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Nuevo Apartamento</h2>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="newApartmentForm">
                        <div class="form-group">
                            <label for="apartmentNumber">Número de Apartamento:</label>
                            <input type="text" id="apartmentNumber" name="apartmentNumber" required />
                        </div>
                        
                        <div class="form-group">
                            <label for="unit">Unidad:</label>
                            <input type="text" id="unit" name="unit" required />
                        </div>
                        
                        <div class="form-group">
                            <label for="address">Dirección:</label>
                            <input type="text" id="address" name="address" required />
                        </div>
                        
                        <div class="form-group">
                            <label for="price">Precio:</label>
                            <input type="number" id="price" name="price" required />
                        </div>
                        
                        <div class="form-group">
                            <label for="photos">Fotos:</label>
                            <div class="photo-upload-area">
                                <input type="file" id="photos" name="photos" accept="image/*" multiple style="display: none;" />
                                <button type="button" class="upload-photo-btn" onclick="document.getElementById('photos').click()">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                        <polyline points="21 15 16 10 5 21"></polyline>
                                    </svg>
                                    Seleccionar Fotos
                                </button>
                                <div id="photoPreview" class="photo-preview"></div>
                            </div>
                        </div>
                        
                        <div class="modal-actions">
                            <button type="button" class="btn-cancel" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
                            <button type="submit" class="btn-submit">Crear Apartamento</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Agregar listener para cerrar con click fuera del modal
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        // Agregar listener para el input de fotos
        const photosInput = document.getElementById('photos');
        const photoPreview = document.getElementById('photoPreview');
        
        photosInput.addEventListener('change', (e) => {
            photoPreview.innerHTML = '';
            const files = Array.from(e.target.files);
            
            if (files.length > 0) {
                photoPreview.innerHTML = `<p class="photos-selected">${files.length} foto(s) seleccionada(s)</p>`;
                
                files.forEach((file, index) => {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const img = document.createElement('img');
                        img.src = e.target.result;
                        img.className = 'preview-image';
                        photoPreview.appendChild(img);
                    };
                    reader.readAsDataURL(file);
                });
            }
        });
        
        // Agregar listener para el formulario
        const form = document.getElementById('newApartmentForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleNewApartmentSubmit(e);
        });
    }

    // Método para manejar el envío del formulario de nuevo apartamento
    async handleNewApartmentSubmit(e) {
        const formData = new FormData(e.target);
        const data = {
            apartmentNumber: formData.get('apartmentNumber'),
            unit: formData.get('unit'),
            address: formData.get('address'),
            price: formData.get('price'),
            photos: []
        };
        
        // Obtener archivos de fotos
        const photosInput = document.getElementById('photos');
        const files = Array.from(photosInput.files);
        
        try {
            this.showNotification('Enviando información del apartamento...', 'info');
            
            // Convertir fotos a base64
            for (const file of files) {
                const base64 = await this.fileToBase64(file);
                data.photos.push({
                    name: file.name,
                    data: base64
                });
            }
            
            console.log('📤 Enviando datos del nuevo apartamento al webhook:', data);
            
            // Enviar al webhook
            const response = await fetch('https://automa-inmobarco-n8n.druysh.easypanel.host/webhook/wasitest', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            // Verificar respuesta
            if (response.ok) {
                const result = await response.json().catch(() => null);
                console.log('✅ Respuesta del webhook:', result);
                this.showNotification('✓ Apartamento creado correctamente', 'success');
                
                // Cerrar modal
                document.querySelector('.modal-overlay').remove();
            } else {
                console.warn(`⚠️ Respuesta del servidor: ${response.status}`);
                this.showNotification('✓ Información enviada', 'success');
                
                // Cerrar modal de todas formas
                document.querySelector('.modal-overlay').remove();
            }
            
        } catch (error) {
            console.error('❌ Error al enviar datos del apartamento:', error);
            this.showNotification('Error al crear el apartamento: ' + error.message, 'error');
        }
    }

    // Método auxiliar para convertir archivo a base64
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
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