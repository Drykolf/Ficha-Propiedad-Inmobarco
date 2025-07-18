exports.handler = async (event, context) => {
    console.log('🔧 Simple test function called');
    
    const responseData = {
        message: '✅ Netlify Function is working!',
        timestamp: new Date().toISOString(),
        event: {
            httpMethod: event.httpMethod,
            path: event.path,
            queryStringParameters: event.queryStringParameters,
            rawUrl: event.rawUrl,
            rawQuery: event.rawQuery,
            headers: {
                host: event.headers?.host,
                userAgent: event.headers?.['user-agent']
            }
        }
    };
    
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-cache'
        },
        body: JSON.stringify(responseData, null, 2)
    };
};
