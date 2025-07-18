exports.handler = async (event, context) => {
    console.log('🔧 Debug function called');
    
    const { queryStringParameters } = event;
    const testId = queryStringParameters?.id || 'QR5nXA';
    
    const debugInfo = {
        timestamp: new Date().toISOString(),
        environment: {
            hasApiUrl: !!process.env.VITE_API_BASE_URL,
            hasApiToken: !!process.env.VITE_API_TOKEN,
            hasEncryptionKey: !!process.env.VITE_ENCRYPTION_KEY,
            hasEncryptionSalt: !!process.env.VITE_ENCRYPTION_SALT,
            apiUrl: process.env.VITE_API_BASE_URL || 'NOT_SET',
            nodeVersion: process.version
        },
        request: {
            testId: testId,
            originalQuery: queryStringParameters,
            httpMethod: event.httpMethod,
            path: event.path,
            headers: event.headers
        },
        testing: {}
    };
    
    // Test decryption if encryption variables are available
    if (process.env.VITE_ENCRYPTION_KEY && process.env.VITE_ENCRYPTION_SALT) {
        try {
            const { decryptPropertyId } = require('./lib/encryption');
            const decrypted = decryptPropertyId(testId);
            debugInfo.testing.decryption = {
                success: !!decrypted,
                result: decrypted || 'FAILED',
                testInput: testId
            };
        } catch (error) {
            debugInfo.testing.decryption = {
                success: false,
                error: error.message,
                testInput: testId
            };
        }
    } else {
        debugInfo.testing.decryption = {
            success: false,
            error: 'Encryption keys not configured'
        };
    }
    
    // Test API availability
    if (process.env.VITE_API_BASE_URL && process.env.VITE_API_TOKEN) {
        debugInfo.testing.api = {
            configured: true,
            baseUrl: process.env.VITE_API_BASE_URL
        };
        
        // Test API connectivity
        try {
            const testUrl = `${process.env.VITE_API_BASE_URL}/inmuebles/${testId}`;
            const testResponse = await fetch(testUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${process.env.VITE_API_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            });
            
            debugInfo.testing.api.connectivity = {
                url: testUrl,
                status: testResponse.status,
                statusText: testResponse.statusText,
                success: testResponse.ok
            };
            
        } catch (apiError) {
            debugInfo.testing.api.connectivity = {
                success: false,
                error: apiError.message
            };
        }
    } else {
        debugInfo.testing.api = {
            configured: false,
            error: 'API credentials not configured'
        };
    }
    
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-cache'
        },
        body: JSON.stringify(debugInfo, null, 2)
    };
};
