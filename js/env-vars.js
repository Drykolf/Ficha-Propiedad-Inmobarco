// Environment variables - This file gets replaced during Netlify build
// If you see placeholder values ({{...}}), the build process didn't run properly

(function() {
    // Check if this is a built version (will be replaced by build-env.js)
    const isBuilt = !'{{VITE_API_BASE_URL}}'.includes('{{');
    
    if (!isBuilt) {
        // Development fallback when build process hasn't run
        console.warn('⚠️ Using fallback environment variables - build process may not have run');
        window.ENV = {
            VITE_API_BASE_URL: 'https://inmobarco.arrendasoft.co/service/v2/public',
            VITE_API_TOKEN: '', // This should be set in Netlify environment variables
            VITE_API_INSTANCE: 'inmobarco',
            VITE_COMPANY_NAME: 'Inmobarco',
            VITE_COMPANY_PHONE: '573045258750',
            VITE_COMPANY_EMAIL: 'comercial@inmobarco.com',
            VITE_ENCRYPTION_KEY: 'InmobarcoDefault',
            VITE_ENCRYPTION_SALT: 'DefaultSalt'
        };
    } else {
        // This will be replaced by build-env.js during Netlify build
        window.ENV = {
            VITE_API_BASE_URL: '{{VITE_API_BASE_URL}}',
            VITE_API_TOKEN: '{{VITE_API_TOKEN}}',
            VITE_API_INSTANCE: '{{VITE_API_INSTANCE}}',
            VITE_COMPANY_NAME: '{{VITE_COMPANY_NAME}}',
            VITE_COMPANY_PHONE: '{{VITE_COMPANY_PHONE}}',
            VITE_COMPANY_EMAIL: '{{VITE_COMPANY_EMAIL}}',
            VITE_ENCRYPTION_KEY: '{{VITE_ENCRYPTION_KEY}}',
            VITE_ENCRYPTION_SALT: '{{VITE_ENCRYPTION_SALT}}'
        };
    }

    console.log('Environment variables script loaded:', {
        isBuilt: isBuilt,
        hasToken: !!window.ENV.VITE_API_TOKEN && window.ENV.VITE_API_TOKEN !== '',
        hasEncryption: !!window.ENV.VITE_ENCRYPTION_KEY && window.ENV.VITE_ENCRYPTION_KEY !== 'InmobarcoDefault'
    });
})();
