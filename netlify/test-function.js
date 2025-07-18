#!/usr/bin/env node

/**
 * Script de testing local para Netlify Functions
 * Simula el comportamiento de la función property-ssr
 */

const { handler } = require('./functions/property-ssr');

// Simulated environment variables for testing
process.env.VITE_API_BASE_URL = 'https://api.arrendasoft.com/v2';
process.env.VITE_API_TOKEN = 'tu_token_aqui'; // Replace with actual token
process.env.VITE_API_INSTANCE = 'inmobarco';
process.env.VITE_ENCRYPTION_KEY = 'tu_clave_aqui'; // Replace with actual key
process.env.VITE_ENCRYPTION_SALT = 'tu_salt_aqui'; // Replace with actual salt

async function testFunction() {
    console.log('🧪 Testing Netlify Function locally...\n');

    // Test 1: No ID provided
    console.log('📝 Test 1: No ID provided');
    const event1 = {
        httpMethod: 'GET',
        path: '/.netlify/functions/property-ssr',
        queryStringParameters: {},
        headers: { host: 'localhost:8888' },
        rawQuery: ''
    };

    try {
        const result1 = await handler(event1, {});
        console.log(`✅ Status: ${result1.statusCode}`);
        console.log(`📄 Content includes default title: ${result1.body.includes('Propiedades en Inmobarco')}`);
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 2: With encrypted ID (formato actual: ?id=QR5nXA)
    console.log('📝 Test 2: With encrypted property ID (formato ?id=QR5nXA)');
    const testPropertyId = 'QR5nXA'; // Ejemplo de ID como el tuyo
    
    const event2 = {
        httpMethod: 'GET',
        path: '/',
        queryStringParameters: { id: testPropertyId },
        headers: { host: 'localhost:8888' },
        rawQuery: `id=${testPropertyId}`
    };

    try {
        const result2 = await handler(event2, {});
        console.log(`✅ Status: ${result2.statusCode}`);
        console.log(`🔍 Headers:`, Object.keys(result2.headers));
        
        if (result2.body.includes('🏠')) {
            console.log('✅ Generated HTML contains property emoji');
        }
        
        if (result2.body.includes('og:title')) {
            console.log('✅ Generated HTML contains Open Graph tags');
        }
        
        if (result2.body.includes('twitter:card')) {
            console.log('✅ Generated HTML contains Twitter Card tags');
        }
        
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 3: Invalid method
    console.log('📝 Test 3: Invalid HTTP method');
    const event3 = {
        httpMethod: 'POST',
        path: '/.netlify/functions/property-ssr',
        queryStringParameters: {},
        headers: { host: 'localhost:8888' },
        rawQuery: ''
    };

    try {
        const result3 = await handler(event3, {});
        console.log(`✅ Status: ${result3.statusCode} (should be 405)`);
        console.log(`📄 Method not allowed handled: ${result3.statusCode === 405}`);
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }

    console.log('\n🎉 Testing completed!');
    console.log('\n💡 To test with real data:');
    console.log('1. Update environment variables in this script');
    console.log('2. Replace testPropertyId with a real encrypted ID');
    console.log('3. Run: node netlify/test-function.js');
}

// Run tests
testFunction().catch(console.error);
