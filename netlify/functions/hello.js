const https = require('https');
const { URL } = require('url');

// Helper function to make API requests
function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const req = https.request(url, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsedData = JSON.parse(data);
                    resolve({ statusCode: res.statusCode, data: parsedData });
                } catch (e) {
                    resolve({ statusCode: res.statusCode, data: data });
                }
            });
        });
        
        req.on('error', reject);
        req.end();
    });
}

// Function to decrypt property ID (based on property-encryption.js)
function decryptPropertyId(encryptedId) {
    try {
        const key = process.env.VITE_ENCRYPTION_KEY;
        const salt = process.env.VITE_ENCRYPTION_SALT;
        
        if (!key || !salt) {
            console.error('Missing encryption keys');
            return encryptedId; // Return as-is if no keys
        }
        
        const keyWithSalt = key + salt;
        
        // Decode from URL-safe Base64
        let base64 = encryptedId
            .replace(/-/g, '+')
            .replace(/_/g, '/');
        
        // Add padding if needed
        const padding = base64.length % 4;
        if (padding) {
            base64 += '='.repeat(4 - padding);
        }
        
        // Use Buffer for more reliable base64 decoding
        let encrypted;
        try {
            encrypted = Buffer.from(base64, 'base64').toString('binary');
        } catch (e) {
            console.error('Base64 decode error:', e);
            return encryptedId;
        }
        
        // XOR transformation
        let result = '';
        const keyLength = keyWithSalt.length;
        
        for (let i = 0; i < encrypted.length; i++) {
            const keyChar = keyWithSalt.charCodeAt(i % keyLength);
            const encryptedChar = encrypted.charCodeAt(i);
            result += String.fromCharCode(encryptedChar ^ keyChar);
        }
        
        // Validate that the result looks like a valid property ID (numbers/letters)
        if (result && /^[a-zA-Z0-9]+$/.test(result)) {
            return result;
        }
        
        // If invalid result, return original
        console.log('Decrypted ID does not match expected format:', result);
        return encryptedId;
        
    } catch (error) {
        console.error('Error decrypting property ID:', error);
        return encryptedId; // Return encrypted ID as fallback
    }
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(amount);
}

// Function to fetch property data from Arrendasoft API
async function fetchPropertyDataNuby(propertyId) {
    try {
        // Log environment variables (safely)
        console.log('API Config:', {
            baseUrl: process.env.VITE_API_BASE_URL ? 'SET' : 'MISSING',
            token: process.env.VITE_API_TOKEN ? 'SET' : 'MISSING',
            propertyId: propertyId
        });
        
        if (!process.env.VITE_API_BASE_URL || !process.env.VITE_API_TOKEN) {
            console.error('Missing required API configuration');
            return null;
        }
        
        const apiUrl = `${process.env.VITE_API_BASE_URL}/properties/${propertyId}`;
        console.log('Making API request to:', apiUrl);
        const response = await makeRequest(apiUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${process.env.VITE_API_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('API Response:', {
            statusCode: response.statusCode,
            hasData: !!response.data,
            dataPreview: response.statusCode !== 200 ? response.data : 'SUCCESS'
        });

        if (response.statusCode === 200 && response.data) {
            // Map Arrendasoft API response to our format
            const property = response.data;
            const getCharacteristicValue = (descripcion) => {
                if (!property.caracteristicas || !Array.isArray(property.caracteristicas)) return null;
                const characteristic = property.caracteristicas.find(c => 
                    c.descripcion.toLowerCase().includes(descripcion.toLowerCase())
                );
                return characteristic ? characteristic.valor : null;
            };
            return {
                title: property.title || property.name || `Propiedad en ${property.tipo_servicio}`,
                description: `${getCharacteristicValue('Habitaciones') + ' Cuartos' || ''} | ${getCharacteristicValue('Baños') + ' Baños' || ''}`.trim()||'Hermosa propiedad',
                price: formatCurrency(property.valor_arriendo1 || property.valor_venta1) || 'Consultar precio',
                location: `${property.barrio || ''}, ${property.municipio || ''}`.trim() || 'Excelente ubicación',
                images: property.imagenes && property.imagenes.length > 0 ? 
                    property.imagenes.map(img => img.imagen|| img.path || img) : 
                    []
            };
        }
        
        console.error('API returned non-200 status:', response.statusCode);
        return null;
    } catch (error) {
        console.error('Error fetching property data:', error);
        return null;
    }
}
async function fetchPropertyDataWasi(propertyId) {
    try {
        // Log environment variables (safely)
        console.log('WASI API Config:', {
            wasiUrl: process.env.WASI_API_URL ? 'SET' : 'MISSING',
            wasiToken: process.env.WASI_API_TOKEN ? 'SET' : 'MISSING',
            wasiId: process.env.WASI_API_ID ? 'SET' : 'MISSING',
            propertyId: propertyId
        });
        
        if (!process.env.WASI_API_URL || !process.env.WASI_API_TOKEN || !process.env.WASI_API_ID) {
            console.error('Missing required WASI API configuration');
            return null;
        }
        
        // Construct WASI API URL for getting a single property
        const wasiApiUrl = new URL(`${process.env.WASI_API_URL}/property/get/${propertyId}`);
        wasiApiUrl.searchParams.append('id_company', process.env.WASI_API_ID);
        wasiApiUrl.searchParams.append('wasi_token', process.env.WASI_API_TOKEN);
        
        console.log('Making WASI API request to:', wasiApiUrl.toString());
        
        const response = await makeRequest(wasiApiUrl.toString(), {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Inmobarco-Property-Template/1.0'
            }
        });

        console.log('WASI API Response:', {
            statusCode: response.statusCode,
            hasData: !!response.data,
            dataPreview: response.statusCode !== 200 ? response.data : 'SUCCESS'
        });

        if (response.statusCode === 200 && response.data) {
            const property = response.data;
            
            // Map WASI API response to our format
            const formatPrice = (forRent, forSale, rentPrice, salePrice) => {
                const rentPriceFormatted = rentPrice ? formatCurrency(rentPrice) : null;
                const salePriceFormatted = salePrice ? formatCurrency(salePrice) : null;
                
                if (forRent === "true" && forSale === "true") {
                    return `Arriendo: ${rentPriceFormatted || 'Consultar'} | Venta: ${salePriceFormatted || 'Consultar'}`;
                } else if (forRent === "true") {
                    return `Arriendo: ${rentPriceFormatted || 'Consultar precio'}`;
                } else if (forSale === "true") {
                    return `Venta: ${salePriceFormatted || 'Consultar precio'}`;
                } else {
                    return 'Consultar precio';
                }
            };
            
            const formatLocation = (city, zone, neighborhood) => {
                const parts = [];
                if (neighborhood) parts.push(neighborhood);
                if (zone) parts.push(zone);
                if (city) parts.push(city);
                return parts.join(', ') || 'Excelente ubicación';
            };
            
            const formatDescription = (bedrooms, bathrooms, area, propertyType) => {
                const parts = [];
                if (bedrooms) parts.push(`${bedrooms} hab`);
                if (bathrooms) parts.push(`${bathrooms} baños`);
                if (area) parts.push(`${area} m²`);
                if (propertyType) parts.push(propertyType);
                return parts.join(' • ') || 'Hermosa propiedad';
            };
            
            // Extract images from WASI format
            const extractImages = (property) => {
                const images = [];
                
                // WASI stores images in different possible fields
                if (property.images && Array.isArray(property.images)) {
                    images.push(...property.images.map(img => typeof img === 'string' ? img : img.url || img.path));
                }
                
                if (property.photos && Array.isArray(property.photos)) {
                    images.push(...property.photos.map(photo => typeof photo === 'string' ? photo : photo.url || photo.path));
                }

                if (property.main_image) {
                    images.push(property.main_image.url);
                }
                // Filter out invalid URLs and ensure they're properly formatted
                return images.filter(img => img && typeof img === 'string' && img.trim().length > 0);
            };
            
            return {
                title: `${property.property_type_label || 'Propiedad'} en ${property.city_label || 'Excelente ubicación'}`,
                description: formatDescription(
                    property.bedrooms, 
                    property.bathrooms, 
                    property.area, 
                    property.property_type_label
                ),
                price: formatPrice(
                    property.for_rent, 
                    property.for_sale, 
                    property.rent_price, 
                    property.sale_price
                ),
                location: formatLocation(
                    property.city_label, 
                    property.zone_label, 
                    property.neighborhood_label
                ),
                images: extractImages(property)
            };
        }
        
        console.error('WASI API returned non-200 status:', response.statusCode);
        return null;
    } catch (error) {
        console.error('Error fetching WASI property data:', error);
        return null;
    }
}
// Generate dynamic HTML with property meta tags
function generateHTML(property, url) {
    const baseUrl = new URL(url).origin;
    
    const baseTitle = property ? 
        `🏠 ${property.title || 'Propiedad'} - Inmobarco` : 
        '🏠 Propiedad en Inmobarco';
        
    const baseDescription = property ? 
        `${property.description || 'Encuentra la propiedad perfecta'} | ${property.price || 'Consultar precio'} | ${property.location || 'Excelente ubicación'}` :
        'Encuentra la propiedad perfecta | Tu hogar ideal te está esperando';
        
    const imageUrl = property && property.images && property.images.length > 0 ? 
        property.images[0] : 
        `${baseUrl}/assets/images/Logo.png`;

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${baseTitle}</title>
    <meta name="description" content="${baseDescription}">
    <meta name="keywords" content="inmuebles, propiedades, venta, arriendo, Inmobarco">
    
    <!-- Open Graph / Facebook / WhatsApp -->
    <meta property="og:type" content="article">
    <meta property="og:site_name" content="Inmobarco">
    <meta property="og:url" content="${url}">
    <meta property="og:title" content="${baseTitle}">
    <meta property="og:description" content="${baseDescription}">
    <meta property="og:image" content="${imageUrl}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="Vista de propiedad en Inmobarco">
    <meta property="og:locale" content="es_CO">

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:site" content="@Inmobarco">
    <meta name="twitter:url" content="${url}">
    <meta name="twitter:title" content="${baseTitle}">
    <meta name="twitter:description" content="${baseDescription}">
    <meta name="twitter:image" content="${imageUrl}">
    <meta name="twitter:image:alt" content="Vista de propiedad en Inmobarco">

    <!-- Favicon -->
    <link rel="icon" type="image/png" href="${baseUrl}/assets/images/Logo.png">
    <link rel="apple-touch-icon" href="${baseUrl}/assets/images/Logo.png">
    
    <!-- Stylesheets -->
    <link rel="stylesheet" href="${baseUrl}/css/property-detail-styles.css">
    <link rel="stylesheet" href="${baseUrl}/css/preview-generator.css">
    
    <!-- Preload critical resources -->
    <link rel="preload" href="${baseUrl}/js/api/arrendasoft-api.js" as="script">
    <link rel="preload" href="${baseUrl}/js/api/wasi-api.js" as="script">
    
    <!-- Structured Data -->
    <script type="application/ld+json" id="property-schema">
    {
        "@context": "https://schema.org",
        "@type": "RealEstate",
        "name": "${property ? (property.title || 'Propiedad en Inmobarco').replace(/"/g, '\\"') : 'Propiedad en Inmobarco'}",
        "description": "${baseDescription.replace(/"/g, '\\"')}",
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
                <img src="${baseUrl}/assets/images/Logo.png" alt="Inmobarco - Inmobiliaria" class="logo-inmobarco">
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
    <script src="${baseUrl}/js/logger.js"></script>
    <script src="${baseUrl}/js/env-vars.js"></script>
    <script src="${baseUrl}/js/env-config.js"></script>
    <script src="${baseUrl}/js/property-encryption.js"></script>
    <script type="module" src="${baseUrl}/js/property-detail.js"></script>
</body>
</html>`;
}

exports.handler = async (event, context) => {
    try {
        console.log('Function invoked with:', {
            path: event.path,
            rawUrl: event.rawUrl,
            query: event.queryStringParameters,
            headers: event.headers
        });
        
        // Get the full URL
        const protocol = event.headers['x-forwarded-proto'] || 'https';
        const host = event.headers.host;
        const path = event.path || '/';
        const queryString = event.rawQuery || '';
        const fullUrl = `${protocol}://${host}${path}${queryString ? '?' + queryString : ''}`;
        
        console.log('Full URL:', fullUrl);
        
        // Extract property ID from query parameters
        const urlObj = new URL(fullUrl);
        const encryptedId = urlObj.searchParams.get('id');
        
        let propertyData = null;
        
        if (encryptedId) {
            console.log('Property ID found:', encryptedId);
            
            try {
                // Decrypt the property ID
                const propertyId = decryptPropertyId(encryptedId);
                console.log('Decrypted property ID:', propertyId);
                
                // Only try to fetch if we have a valid decrypted ID
                if (propertyId && propertyId !== encryptedId) {
                    // Fetch property data from appropriate API based on property ID
                    if (propertyId < 2000) {
                        console.log(`Using Arrendasoft API for property ID: ${propertyId}`);
                        propertyData = await fetchPropertyDataNuby(propertyId);
                    } else {
                        console.log(`Using WASI API for property ID: ${propertyId}`);
                        propertyData = await fetchPropertyDataWasi(propertyId);
                    }
                    
                    if (propertyData) {
                        console.log('Property data loaded successfully');
                    } else {
                        console.log('Could not fetch property data, using mock data for testing');
                        // Mock data for testing
                        propertyData = {
                            title: `Propiedad en Medellín`,
                            description: 'Hermosa propiedad en excelente ubicación',
                            price: 'Consultar Precio',
                            location: 'Medellín, Colombia',
                            images: [`https://ficha.inmobarco.com/assets/images/Logo.png`]
                        };
                    }
                }
            } catch (decryptError) {
                console.error('Error processing property ID:', decryptError);
            }
        } else {
            console.log('No property ID in URL, serving default page');
        }
        
        // Generate HTML with meta tags
        const html = generateHTML(propertyData, fullUrl);
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
                'Cache-Control': encryptedId ? 'public, max-age=300' : 'public, max-age=60', // Longer cache for property pages
                'X-Property-ID': encryptedId || 'none',
            },
            body: html
        };
        
    } catch (error) {
        console.error('Function error:', error);
        
        // Fallback HTML in case of errors
        const fallbackUrl = event.headers.host ? 
            `https://${event.headers.host}` : 
            'https://ficha.inmobarco.com';
        const fallbackHtml = generateHTML(null, fallbackUrl);
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
                'Cache-Control': 'public, max-age=60', // Shorter cache for errors
                'X-Error': 'fallback-mode'
            },
            body: fallbackHtml
        };
    }
};
