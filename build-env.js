#!/usr/bin/env node

// Script para generar env-vars.js con las variables de entorno de Netlify
// Este script se ejecuta durante el build en Netlify

const fs = require('fs');
const path = require('path');

console.log('🔧 Generating env-vars.js with Netlify environment variables...');

// Obtener variables de entorno
const envVars = {
    VITE_API_BASE_URL: process.env.VITE_API_BASE_URL || 'https://inmobarco.arrendasoft.co/service/v2/public',
    VITE_API_TOKEN: process.env.VITE_API_TOKEN || '',
    VITE_API_INSTANCE: process.env.VITE_API_INSTANCE || 'inmobarco',
    VITE_COMPANY_NAME: process.env.VITE_COMPANY_NAME || 'Inmobarco',
    VITE_COMPANY_PHONE: process.env.VITE_COMPANY_PHONE || '573045258750',
    VITE_COMPANY_EMAIL: process.env.VITE_COMPANY_EMAIL || 'comercial@inmobarco.com',
    VITE_ENCRYPTION_KEY: process.env.VITE_ENCRYPTION_KEY || '',
    VITE_ENCRYPTION_SALT: process.env.VITE_ENCRYPTION_SALT || ''
};

// Verificar variables críticas
const criticalVars = ['VITE_API_TOKEN', 'VITE_ENCRYPTION_KEY', 'VITE_ENCRYPTION_SALT'];
const missingVars = criticalVars.filter(varName => !envVars[varName] || envVars[varName] === '');

if (missingVars.length > 0) {
    console.warn('⚠️  Warning: Missing critical environment variables:', missingVars.join(', '));
    console.warn('🔗 Make sure to set these in Netlify: Site settings > Environment variables');
    console.warn('🚨 The application may not work correctly without these variables');
}

// Generar el contenido del archivo JavaScript
const jsContent = `// Generated automatically by build-env.js during Netlify build - DO NOT EDIT MANUALLY
// This file contains environment variables injected during build process
// Template source: js/env-vars.template.js

(function() {
    // Environment variables from Netlify
    window.ENV = ${JSON.stringify(envVars, null, 8)};
})();
`;

// Escribir el archivo
const outputPath = path.join(__dirname, 'js', 'env-vars.js');
try {
    fs.writeFileSync(outputPath, jsContent, 'utf8');
    console.log('✅ env-vars.js generated successfully');
    
    // Mostrar resumen de variables cargadas (sin valores sensibles)
    const summary = Object.keys(envVars).map(key => {
        const value = envVars[key];
        const isSensitive = key.includes('TOKEN') || key.includes('KEY') || key.includes('SALT');
        return `${key}: ${isSensitive ? (value ? 'SET' : 'NOT SET') : value || 'NOT SET'}`;
    });
    console.log('📋 Variables loaded:', summary.join(', '));
    
} catch (error) {
    console.error('❌ Error writing env-vars.js:', error);
    process.exit(1);
}
