// Template for environment variables - DO NOT EDIT
// This file will be replaced by build-env.js during Netlify build
// For local development, use .env file

(function() {
    // This will be replaced during build with actual values from Netlify environment variables
    window.ENV = {
        VITE_API_BASE_URL: '{{VITE_API_BASE_URL}}',
        VITE_API_TOKEN: '{{VITE_API_TOKEN}}',
        VITE_API_INSTANCE: '{{VITE_API_INSTANCE}}',
        VITE_COMPANY_NAME: '{{VITE_COMPANY_NAME}}',
        VITE_COMPANY_PHONE: '{{VITE_COMPANY_PHONE}}',
        VITE_COMPANY_EMAIL: '{{VITE_COMPANY_EMAIL}}',
        VITE_ENCRYPTION_KEY: '{{VITE_ENCRYPTION_KEY}}',
        VITE_ENCRYPTION_SALT: '{{VITE_ENCRYPTION_SALT}}',
        WASI_API_TOKEN: '{{WASI_API_TOKEN}}',
        WASI_API_ID: '{{WASI_API_ID}}',
        WASI_API_URL: '{{WASI_API_URL}}',
        PROPERTIES_KEY: '{{PROPERTIES_KEY}}',
    };

    console.log('Environment variables template loaded - will be replaced during build');
})();
