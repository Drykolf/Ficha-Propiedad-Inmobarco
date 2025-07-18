const { decryptPropertyId } = require('./lib/encryption');

exports.handler = async (event, context) => {
    const { queryStringParameters, headers } = event;
    
    console.log('🧪 Social Preview Test Function called');
    console.log('📋 Query params:', queryStringParameters);
    console.log('🤖 User Agent:', headers['user-agent']);
    
    const testId = queryStringParameters?.id || 'QR5mVg';
    
    // Simulate property data
    const mockProperty = {
        clase_inmueble: 'Apartamento',
        municipio: 'Bogotá',
        valor_arriendo1: 2500000,
        habitaciones: 3,
        banos: 2,
        imagenes: [
            { imagen: 'https://example.com/property-image.jpg' }
        ],
        estado_texto: 'Activa'
    };
    
    const title = `🏠 ${mockProperty.clase_inmueble} en ${mockProperty.municipio}`;
    const description = `Disponible $2,500,000 | 3 hab, 2 baños`;
    const imageUrl = mockProperty.imagenes[0].imagen;
    
    const html = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - Inmobarco</title>
    <meta name="description" content="${description}">
    
    <!-- Open Graph / Facebook / WhatsApp -->
    <meta property="og:type" content="article">
    <meta property="og:site_name" content="Inmobarco">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${imageUrl}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="${title} - Imagen principal">
    <meta property="og:locale" content="es_CO">

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="${imageUrl}">
    
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .preview-card {
            background: white;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .success { color: #28a745; }
        .info { color: #007bff; }
        .warning { color: #ffc107; }
    </style>
</head>
<body>
    <div class="preview-card">
        <h1 class="success">✅ Preview de Redes Sociales Funcionando</h1>
        
        <div class="info">
            <h2>📊 Información del Test:</h2>
            <p><strong>ID Probado:</strong> ${testId}</p>
            <p><strong>Título:</strong> ${title}</p>
            <p><strong>Descripción:</strong> ${description}</p>
            <p><strong>Imagen:</strong> ${imageUrl}</p>
        </div>
        
        <div class="warning">
            <h2>🧪 Para probar previews:</h2>
            <ol>
                <li><strong>Facebook Debugger:</strong> <a href="https://developers.facebook.com/tools/debug/" target="_blank">https://developers.facebook.com/tools/debug/</a></li>
                <li><strong>WhatsApp:</strong> Envía el link en un chat</li>
                <li><strong>Twitter:</strong> <a href="https://cards-dev.twitter.com/validator" target="_blank">https://cards-dev.twitter.com/validator</a></li>
                <li><strong>LinkedIn:</strong> <a href="https://www.linkedin.com/post-inspector/" target="_blank">https://www.linkedin.com/post-inspector/</a></li>
            </ol>
        </div>
        
        <p><small>⏰ Generado: ${new Date().toISOString()}</small></p>
    </div>
</body>
</html>`;

    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'public, max-age=300',
            'X-Test-Preview': 'true',
            'X-Robots-Tag': 'index, follow'
        },
        body: html
    };
};
