#!/usr/bin/env node

// Script para generar env-vars.js con las variables de entorno de Netlify
// Este script se ejecuta durante el build en Netlify

const fs = require('fs');
const path = require('path');

console.log('🔧 Generating env-vars.js with Netlify environment variables...');
console.log('🌍 Current environment:', process.env.NODE_ENV || 'development');
console.log('🔍 Available environment variables:');
console.log('   - NETLIFY:', !!process.env.NETLIFY);
console.log('   - BUILD_ID:', process.env.BUILD_ID || 'not set');
console.log('   - CONTEXT:', process.env.CONTEXT || 'not set');

// Obtener variables de entorno
const envVars = {
    VITE_API_BASE_URL: process.env.VITE_API_BASE_URL || 'https://inmobarco.arrendasoft.co/service/v2/public',
    VITE_API_TOKEN: process.env.VITE_API_TOKEN || '',
    VITE_API_INSTANCE: process.env.VITE_API_INSTANCE || 'inmobarco',
    VITE_COMPANY_NAME: process.env.VITE_COMPANY_NAME || 'Inmobarco',
    VITE_COMPANY_PHONE: process.env.VITE_COMPANY_PHONE || '573045258750',
    VITE_COMPANY_EMAIL: process.env.VITE_COMPANY_EMAIL || 'comercial@inmobarco.com',
    VITE_ENCRYPTION_KEY: process.env.VITE_ENCRYPTION_KEY || 'InmobarcoDefault',
    VITE_ENCRYPTION_SALT: process.env.VITE_ENCRYPTION_SALT || 'DefaultSalt'
};

console.log('🔍 Checking individual environment variables:');
Object.keys(envVars).forEach(key => {
    const value = process.env[key];
    const isSensitive = key.includes('TOKEN') || key.includes('KEY') || key.includes('SALT');
    const displayValue = isSensitive ? (value ? '***PROVIDED***' : 'NOT PROVIDED') : (value || 'NOT PROVIDED');
    console.log(`   - ${key}: ${displayValue}`);
});

// Verificar variables críticas
const criticalVars = ['VITE_API_TOKEN', 'VITE_ENCRYPTION_KEY', 'VITE_ENCRYPTION_SALT'];
const missingVars = criticalVars.filter(varName => !envVars[varName] || envVars[varName] === 'InmobarcoDefault' || envVars[varName] === 'DefaultSalt');

if (missingVars.length > 0) {
    console.warn('⚠️  Warning: The following critical environment variables are missing or using default values:');
    missingVars.forEach(varName => {
        console.warn(`   - ${varName}: ${envVars[varName] || 'NOT SET'}`);
    });
    console.warn('🔗 Make sure to set these in Netlify: Site settings > Environment variables');
}

// Generar el contenido del archivo JavaScript
const jsContent = `// Generated automatically by build-env.js during Netlify build - DO NOT EDIT MANUALLY
// This file contains environment variables injected during build process
// Template source: js/env-vars.template.js

(function() {
    // Environment variables from Netlify
    window.ENV = ${JSON.stringify(envVars, null, 8)};

    console.log('✅ Environment variables loaded from Netlify build:', {
        hasApiUrl: !!window.ENV.VITE_API_BASE_URL,
        hasToken: !!window.ENV.VITE_API_TOKEN,
        instance: window.ENV.VITE_API_INSTANCE,
        hasEncryption: !!window.ENV.VITE_ENCRYPTION_KEY
    });
})();
`;

// Escribir el archivo
const outputPath = path.join(__dirname, 'js', 'env-vars.js');
try {
    fs.writeFileSync(outputPath, jsContent, 'utf8');
    console.log('✅ env-vars.js generated successfully');
    console.log('📍 File location:', outputPath);
    
    // Mostrar resumen de variables cargadas (sin valores sensibles)
    console.log('📋 Variables loaded:');
    Object.keys(envVars).forEach(key => {
        const value = envVars[key];
        const isSensitive = key.includes('TOKEN') || key.includes('KEY') || key.includes('SALT');
        const displayValue = isSensitive ? (value ? '***SET***' : 'NOT SET') : value;
        console.log(`   ${key}: ${displayValue}`);
    });
    
} catch (error) {
    console.error('❌ Error writing env-vars.js:', error);
    process.exit(1);
}
