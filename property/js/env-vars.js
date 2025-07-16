// This script generates environment variables for production build
// It will be executed during the Netlify build process

(function() {
    // Get environment variables from Netlify build environment
    const envVars = {
        VITE_API_BASE_URL: process.env.VITE_API_BASE_URL,
        VITE_API_TOKEN: process.env.VITE_API_TOKEN,
        VITE_API_INSTANCE: process.env.VITE_API_INSTANCE,
        VITE_COMPANY_NAME: process.env.VITE_COMPANY_NAME,
        VITE_COMPANY_PHONE: process.env.VITE_COMPANY_PHONE,
        VITE_COMPANY_EMAIL: process.env.VITE_COMPANY_EMAIL
    };

    // Create global ENV object that will be available in the browser
    window.ENV = envVars;

    // Log configuration status (without sensitive data)
    console.log('Environment configuration loaded:', {
        hasApiUrl: !!envVars.VITE_API_BASE_URL,
        hasToken: !!envVars.VITE_API_TOKEN,
        instance: envVars.VITE_API_INSTANCE,
        companyName: envVars.VITE_COMPANY_NAME
    });
})();
