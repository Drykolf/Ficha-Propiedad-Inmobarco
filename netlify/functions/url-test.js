exports.handler = async (event, context) => {
    const queryParams = event.queryStringParameters || {};
    const hasId = !!queryParams.id;
    
    // Simple response to test query parameter passing
    const html = `<!DOCTYPE html>
<html>
<head>
    <title>🧪 URL Test Result</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f0f0f0; }
        .result { background: white; padding: 20px; border-radius: 8px; margin: 10px 0; }
        .success { color: #28a745; border-left: 4px solid #28a745; }
        .error { color: #dc3545; border-left: 4px solid #dc3545; }
        .info { color: #007bff; }
        pre { background: #f8f9fa; padding: 10px; border-radius: 4px; }
    </style>
</head>
<body>
    <h1>🧪 URL Parameter Test</h1>
    
    <div class="result ${hasId ? 'success' : 'error'}">
        <h2>${hasId ? '✅ SUCCESS: ID Parameter Received!' : '❌ FAIL: No ID Parameter'}</h2>
        <p><strong>ID Value:</strong> ${queryParams.id || 'NOT_FOUND'}</p>
        <p><strong>URL Path:</strong> ${event.path}</p>
        <p><strong>Raw Query:</strong> ${event.rawQuery || 'NO_QUERY'}</p>
    </div>
    
    <div class="result info">
        <h3>📋 Full Request Data:</h3>
        <pre>${JSON.stringify({
            path: event.path,
            queryStringParameters: queryParams,
            rawQuery: event.rawQuery,
            httpMethod: event.httpMethod
        }, null, 2)}</pre>
    </div>
    
    <div class="result">
        <h3>🔗 Test These URLs:</h3>
        <ul>
            <li><a href="/?id=QR5mVg">/?id=QR5mVg</a> (Root with ID)</li>
            <li><a href="/url-test?id=QR5mVg">/url-test?id=QR5mVg</a> (This page with ID)</li>
            <li><a href="/propiedad/?id=QR5mVg">/propiedad/?id=QR5mVg</a> (Known working)</li>
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
