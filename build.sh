#!/bin/bash

# Build script for Netlify
echo "🚀 Starting Netlify build process..."

# Create the env-vars.js file with actual environment variables
echo "📝 Generating environment variables file..."

cat > js/env-vars.js << EOF
// Environment variables injected during Netlify build
(function() {
    window.ENV = {
        VITE_API_BASE_URL: '${VITE_API_BASE_URL}',
        VITE_API_TOKEN: '${VITE_API_TOKEN}',
        VITE_API_INSTANCE: '${VITE_API_INSTANCE}',
        VITE_COMPANY_NAME: '${VITE_COMPANY_NAME}',
        VITE_COMPANY_PHONE: '${VITE_COMPANY_PHONE}',
        VITE_COMPANY_EMAIL: '${VITE_COMPANY_EMAIL}'
    };
    
    console.log('Environment variables loaded for production');
    console.log('Config status:', {
        hasApiUrl: !!window.ENV.VITE_API_BASE_URL,
        hasToken: !!window.ENV.VITE_API_TOKEN,
        instance: window.ENV.VITE_API_INSTANCE
    });
})();
EOF

echo "✅ Environment variables file generated successfully"
echo "🏁 Build process completed!"
