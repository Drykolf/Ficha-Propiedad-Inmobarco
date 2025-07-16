// This script will be replaced by Netlify build process with actual environment variables
// For now, it provides a placeholder structure

(function() {
    // This will be replaced during build with actual values from Netlify environment variables
    window.ENV = {
        VITE_API_BASE_URL: '{{VITE_API_BASE_URL}}',
        VITE_API_TOKEN: '{{VITE_API_TOKEN}}',
        VITE_API_INSTANCE: '{{VITE_API_INSTANCE}}',
        VITE_COMPANY_NAME: '{{VITE_COMPANY_NAME}}',
        VITE_COMPANY_PHONE: '{{VITE_COMPANY_PHONE}}',
        VITE_COMPANY_EMAIL: '{{VITE_COMPANY_EMAIL}}'
    };

    console.log('Environment variables script loaded');
})();
