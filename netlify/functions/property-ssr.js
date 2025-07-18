const { decryptPropertyId } = require('./lib/encryption');

// Configuration - reads from environment variables
const API_CONFIG = {
    baseUrl: process.env.VITE_API_BASE_URL || 'https://api.arrendasoft.com/v2',
    token: process.env.VITE_API_TOKEN,
    instance: process.env.VITE_API_INSTANCE || 'inmobarco'
};

// Fetch property data from API
async function fetchPropertyData(propertyId) {
    try {
        console.log(`🔍 Fetching property data for ID: ${propertyId}`);
        
        if (!API_CONFIG.token) {
            throw new Error('API token not configured');
        }

        const response = await fetch(`${API_CONFIG.baseUrl}/properties/${propertyId}`, {
            headers: {
                'Authorization': `Bearer ${API_CONFIG.token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const property = await response.json();
        console.log(`✅ Property fetched successfully: ${property.clase_inmueble} en ${property.municipio}`);
        
        return property;
    } catch (error) {
        console.error('❌ Error fetching property:', error);
        return null;
    }
}

// Format currency
function formatCurrency(amount) {
    if (!amount) return '$0';
    
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(amount);
}

// Generate meta tags for property
function generateMetaTags(property) {
    const propertyType = property.clase_inmueble || 'Propiedad';
    const location = property.municipio || '';
    const serviceType = property.tipo_servicio || 'Disponible';
    const price = formatCurrency(property.valor_arriendo1 || property.valor_venta1 || 0);
    const rooms = property.habitaciones;
    const bathrooms = property.banos;
    
    const title = `🏠 ${propertyType} en ${location}`;
    
    let description = `${serviceType} ${price}`;
    if (rooms) description += ` | ${rooms} hab`;
    if (bathrooms) description += `, ${bathrooms} baños`;
    
    const imageUrl = property.imagenes && property.imagenes.length > 0 
        ? property.imagenes[0].imagen 
        : '/assets/images/Logo.png';

    return {
        title,
        description,
        imageUrl,
        propertyType,
        location,
        serviceType,
        price,
        rooms,
        bathrooms
    };
}

// Generate HTML with dynamic meta tags
function generateHTML(metaTags, property = null, currentUrl = '') {
    const escapedTitle = metaTags.title.replace(/"/g, '&quot;');
    const escapedDescription = metaTags.description.replace(/"/g, '&quot;');
    
    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapedTitle} - Inmobarco</title>
    <meta name="description" content="${escapedDescription}">
    <meta name="keywords" content="inmuebles, propiedades, venta, arriendo, Inmobarco${property ? `, ${property.municipio}, ${property.clase_inmueble}` : ''}">
    
    <!-- Open Graph / Facebook / WhatsApp -->
    <meta property="og:type" content="article">
    <meta property="og:site_name" content="Inmobarco">
    <meta property="og:url" content="${currentUrl}">
    <meta property="og:title" content="${escapedTitle}">
    <meta property="og:description" content="${escapedDescription}">
    <meta property="og:image" content="${metaTags.imageUrl}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="${escapedTitle} - Imagen principal">
    <meta property="og:locale" content="es_CO">

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:site" content="@Inmobarco">
    <meta name="twitter:url" content="${currentUrl}">
    <meta name="twitter:title" content="${escapedTitle}">
    <meta name="twitter:description" content="${escapedDescription}">
    <meta name="twitter:image" content="${metaTags.imageUrl}">
    <meta name="twitter:image:alt" content="${escapedTitle} - Imagen principal">

    <!-- Favicon -->
    <link rel="icon" type="image/png" href="/assets/images/Logo.png">
    <link rel="apple-touch-icon" href="/assets/images/Logo.png">
    
    <!-- Stylesheets -->
    <link rel="stylesheet" href="/css/property-detail-styles.css">
    <link rel="stylesheet" href="/css/preview-generator.css">
    
    <!-- Preload critical resources -->
    <link rel="preload" href="/js/arrendasoft-api.js" as="script">
    
    <!-- Structured Data -->
    <script type="application/ld+json" id="property-schema">
    {
        "@context": "https://schema.org",
        "@type": "RealEstate",
        "name": "${metaTags.propertyType} en ${metaTags.location}",
        "description": "${escapedDescription}",
        "image": "${metaTags.imageUrl}"${property ? `,
        "address": {
            "@type": "PostalAddress",
            "streetAddress": "${property.direccion || ''}",
            "addressLocality": "${property.municipio || ''}",
            "addressRegion": "${property.departamento || ''}",
            "addressCountry": "CO"
        },
        "numberOfRooms": ${property.habitaciones || 'null'},
        "numberOfBathrooms": ${property.banos || 'null'},
        ${property.area ? `"floorSize": {
            "@type": "QuantitativeValue",
            "value": ${property.area},
            "unitCode": "MTK"
        },` : ''}
        "offers": {
            "@type": "Offer",
            "price": ${property.valor_arriendo1 || property.valor_venta1 || 0},
            "priceCurrency": "COP",
            "availability": "${property.estado_texto === 'Activa' ? 'InStock' : 'OutOfStock'}"
        }` : ''},
        "provider": {
            "@type": "RealEstateAgent",
            "name": "Inmobarco",
            "url": "https://inmobarco.com",
            "telephone": "+57 304 525 8750",
            "email": "comercial@inmobarco.com"
        }
    }
    </script>
</head>
<body>
    <!-- Header con Logo -->
    <header class="property-header-with-logo">
        <div class="header-content">
            <div class="logo-section">
                <img src="/assets/images/Logo.png" alt="Inmobarco - Inmobiliaria" class="logo-inmobarco">
                <div class="header-title-section">
                    <h1 class="header-main-title">Detalles de Propiedad</h1>
                    <p class="header-subtitle">Encuentra tu hogar ideal</p>
                </div>
            </div>
            <div class="company-info">
                <p class="company-tagline">Tu hogar ideal te está esperando</p>
                <p class="company-contact">www.inmobarco.com</p>
            </div>
        </div>
    </header>

    <div class="container">
        <div id="loading" class="loading">
            Cargando detalles de la propiedad...
        </div>

        <div id="error" class="error" style="display: none;">
            Error al cargar la propiedad. Por favor, inténtelo de nuevo más tarde.
        </div>

        <div id="property-content" style="display: none;">
            <!-- Property content will be loaded here -->
        </div>
    </div>

    <!-- Load external scripts -->
    <script>
        // Pass property data to JavaScript if available
        ${property ? `
        console.log('📦 Property data preloaded by Netlify Function');
        window.PRELOADED_PROPERTY = ${JSON.stringify(property)};
        window.PRELOADED_META = ${JSON.stringify(metaTags)};
        ` : ''}
    </script>
    <script src="/js/logger.js"></script>
    <script src="/js/env-vars.js"></script>
    <script src="/js/env-config.js"></script>
    <script src="/js/property-encryption.js"></script>
    <script src="/js/arrendasoft-api.js"></script>
</body>
</html>`;
}

// Generate default HTML for homepage or errors
function generateDefaultHTML(title = '🏠 Propiedades en Inmobarco', description = 'Encuentra la propiedad perfecta | Tu hogar ideal te está esperando') {
    const defaultMetaTags = {
        title,
        description,
        imageUrl: '/assets/images/Logo.png',
        propertyType: 'Propiedades',
        location: 'Inmobarco',
        serviceType: '',
        price: '',
        rooms: null,
        bathrooms: null
    };
    
    return generateHTML(defaultMetaTags);
}

// Main handler function
exports.handler = async (event, context) => {
    const { httpMethod, queryStringParameters, headers } = event;
    
    console.log(`🚀 Netlify Function called: ${httpMethod} ${event.path}`);
    console.log(`📋 Query params:`, queryStringParameters);
    
    // Only handle GET requests
    if (httpMethod !== 'GET') {
        return {
            statusCode: 405,
            headers: {
                'Content-Type': 'text/html; charset=utf-8'
            },
            body: generateDefaultHTML('❌ Método no permitido', 'Método HTTP no permitido')
        };
    }

    const encryptedId = queryStringParameters?.id;
    const currentUrl = headers?.host ? `https://${headers.host}${event.path}${event.rawQuery ? '?' + event.rawQuery : ''}` : '';
    
    console.log(`🔐 Raw Encrypted ID: ${encryptedId}`);
    
    // Clean up malformed ID (remove duplicate URLs)
    let cleanEncryptedId = encryptedId;
    if (encryptedId && encryptedId.includes('http')) {
        // Extract only the first part before any URL
        const parts = encryptedId.split('http');
        cleanEncryptedId = parts[0];
        console.log(`🧹 Cleaned encrypted ID: ${cleanEncryptedId}`);
    }
    
    if (!cleanEncryptedId) {
        console.log('📄 No valid ID provided, returning default page');
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
                'Cache-Control': 'public, max-age=300'
            },
            body: generateDefaultHTML()
        };
    }

    try {
        // Decrypt property ID
        console.log('🔓 Attempting to decrypt property ID...');
        const propertyId = decryptPropertyId(cleanEncryptedId);
        
        if (!propertyId) {
            throw new Error('Failed to decrypt property ID');
        }
        
        console.log(`✅ Decrypted property ID: ${propertyId}`);

        // Fetch property data
        const property = await fetchPropertyData(propertyId);
        
        if (!property) {
            throw new Error('Property not found or API error');
        }

        // Check if property is active
        if (!property.estado_texto || property.estado_texto.toLowerCase() !== 'activa') {
            console.log(`⚠️ Property ${propertyId} is not active. Status: ${property.estado_texto}`);
            throw new Error('Property not available');
        }

        // Generate meta tags
        const metaTags = generateMetaTags(property);
        
        console.log(`🎯 Generated meta tags for: ${metaTags.title}`);
        
        // Generate and return HTML
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
                'Cache-Control': 'public, max-age=300',
                'X-Prerendered': 'true'
            },
            body: generateHTML(metaTags, property, currentUrl)
        };

    } catch (error) {
        console.error('❌ Error in property-ssr function:', error.message);
        
        // Return appropriate error page
        let errorTitle = '🏠 Propiedad no encontrada - Inmobarco';
        let errorDescription = 'La propiedad solicitada no está disponible. Encuentra otras propiedades en Inmobarco.';
        
        if (error.message.includes('decrypt')) {
            errorTitle = '🔐 URL inválida - Inmobarco';
            errorDescription = 'El enlace proporcionado no es válido. Verifica la URL e intenta nuevamente.';
        } else if (error.message.includes('API')) {
            errorTitle = '⚡ Servicio temporalmente no disponible - Inmobarco';
            errorDescription = 'Nuestro servicio está temporalmente no disponible. Intenta nuevamente en unos minutos.';
        }
        
        return {
            statusCode: 200, // Return 200 to avoid breaking social media crawlers
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
                'Cache-Control': 'public, max-age=60',
                'X-Error': error.message
            },
            body: generateDefaultHTML(errorTitle, errorDescription)
        };
    }
};
