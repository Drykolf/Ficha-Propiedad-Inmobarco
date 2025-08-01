// Netlify Function para hacer proxy a la API de WASI
// Evita problemas de CORS al hacer peticiones desde el frontend

exports.handler = async (event, context) => {
    // Configurar headers CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Manejar preflight OPTIONS request
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    // Solo permitir métodos GET para seguridad
    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        // Obtener parámetros de la query string
        const { 
            endpoint, 
            id_company, 
            wasi_token,
            property_id,
            ...otherParams 
        } = event.queryStringParameters || {};

        // Validar parámetros requeridos
        if (!endpoint || !id_company || !wasi_token) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    error: 'Missing required parameters: endpoint, id_company, wasi_token' 
                })
            };
        }

        // Construir URL de la API WASI
        const wasiBaseUrl = 'https://api.wasi.co/v1';
        let apiUrl = `${wasiBaseUrl}${endpoint}`;
        
        // Si es un endpoint de propiedad específica, agregar el ID
        if (property_id && endpoint.includes('/property/get/')) {
            apiUrl = `${wasiBaseUrl}/property/get/${property_id}`;
        }

        // Agregar parámetros de autenticación
        const urlParams = new URLSearchParams({
            id_company,
            wasi_token,
            ...otherParams
        });

        const fullUrl = `${apiUrl}?${urlParams.toString()}`;

        console.log('Petición WASI:', fullUrl);

        // Hacer petición a la API WASI
        const response = await fetch(fullUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Netlify-Function-Proxy/1.0'
            }
        });

        // Obtener datos de respuesta
        const data = await response.json();

        // Log para debugging (sin exponer tokens)
        console.log('WASI Response Status:', response.status);
        console.log('WASI Response OK:', response.ok);

        return {
            statusCode: response.status,
            headers,
            body: JSON.stringify(data)
        };

    } catch (error) {
        console.error('Error en WASI proxy:', error);
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Internal server error',
                message: error.message 
            })
        };
    }
};
