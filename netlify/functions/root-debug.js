exports.handler = async (event, context) => {
    console.log('🔍 Root URL Debug Function');
    
    const debugInfo = {
        message: 'Root URL Debug - Checking query parameter passing',
        timestamp: new Date().toISOString(),
        request: {
            httpMethod: event.httpMethod,
            path: event.path,
            rawUrl: event.rawUrl,
            rawQuery: event.rawQuery,
            queryStringParameters: event.queryStringParameters,
            headers: {
                host: event.headers?.host,
                userAgent: event.headers?.['user-agent']?.substring(0, 100)
            }
        },
        analysis: {
            hasIdParameter: !!(event.queryStringParameters?.id),
            idValue: event.queryStringParameters?.id || 'NO_ID_FOUND',
            shouldRedirectToSSR: !!(event.queryStringParameters?.id),
            queryParamCount: Object.keys(event.queryStringParameters || {}).length
        }
    };
    
    // Check if this should have gone to SSR
    if (event.queryStringParameters?.id) {
        debugInfo.analysis.recommendation = 'This URL should be handled by property-ssr function';
        debugInfo.analysis.expectedSSRUrl = `/.netlify/functions/property-ssr?id=${event.queryStringParameters.id}`;
    } else {
        debugInfo.analysis.recommendation = 'This is a normal root page request';
    }
    
    console.log('Debug info:', JSON.stringify(debugInfo, null, 2));
    
    const html = `<!DOCTYPE html>
<html>
<head>
    <title>🔍 Root URL Debug - Inmobarco</title>
    <style>
        body { font-family: monospace; margin: 20px; background: #f5f5f5; }
        .debug-box { background: white; padding: 20px; border-radius: 8px; margin: 10px 0; }
        .success { color: #28a745; }
        .warning { color: #ffc107; }
        .error { color: #dc3545; }
        .info { color: #007bff; }
        pre { background: #f8f9fa; padding: 10px; border-radius: 4px; overflow-x: auto; }
    </style>
</head>
<body>
    <h1>🔍 Root URL Debug</h1>
    
    <div class="debug-box">
        <h2 class="${debugInfo.analysis.hasIdParameter ? 'error' : 'success'}">
            ${debugInfo.analysis.hasIdParameter ? '❌ Problem Found' : '✅ Normal Request'}
        </h2>
        <p><strong>Analysis:</strong> ${debugInfo.analysis.recommendation}</p>
        ${debugInfo.analysis.hasIdParameter ? 
            `<p class="error"><strong>Issue:</strong> This URL contains an ID parameter but reached the wrong function!</p>
             <p><strong>Expected URL:</strong> ${debugInfo.analysis.expectedSSRUrl}</p>` : 
            '<p class="success">This is working correctly for root page requests.</p>'
        }
    </div>
    
    <div class="debug-box">
        <h3>📋 Request Details:</h3>
        <pre>${JSON.stringify(debugInfo, null, 2)}</pre>
    </div>
    
    <div class="debug-box">
        <h3>🧪 Test URLs:</h3>
        <ul>
            <li><a href="/?id=QR5mVg">/?id=QR5mVg</a> (Should go to SSR)</li>
            <li><a href="/propiedad/?id=QR5mVg">/propiedad/?id=QR5mVg</a> (Working)</li>
            <li><a href="/.netlify/functions/property-ssr?id=QR5mVg">Direct SSR test</a></li>
            <li><a href="/">/ (Root page)</a></li>
        </ul>
    </div>
</body>
</html>`;

    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'no-cache'
        },
        body: html
    };
};
