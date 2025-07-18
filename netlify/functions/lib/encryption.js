const crypto = require('crypto');

const ENCRYPTION_KEY = process.env.VITE_ENCRYPTION_KEY;
const SALT = process.env.VITE_ENCRYPTION_SALT;

function decryptPropertyId(encryptedData) {
    try {
        if (!ENCRYPTION_KEY || !SALT) {
            console.log('⚠️ Encryption key or salt not found, using fallback decryption');
            // Fallback: try simple base64 decode
            try {
                const decoded = Buffer.from(encryptedData, 'base64').toString('utf8');
                console.log(`🔄 Fallback decryption result: ${decoded}`);
                return decoded;
            } catch (fallbackError) {
                console.error('❌ Fallback decryption failed:', fallbackError);
                return encryptedData; // Return as-is if nothing works
            }
        }

        // Use the same encryption method as the frontend
        const key = crypto.createHash('sha256').update(ENCRYPTION_KEY + SALT).digest();
        
        try {
            // Parse the encrypted data (assuming it's in base64 format)
            const encryptedBuffer = Buffer.from(encryptedData, 'base64');
            
            // Check if the buffer is long enough for IV + data
            if (encryptedBuffer.length < 17) {
                throw new Error('Encrypted data too short for IV extraction');
            }
            
            // Extract IV and encrypted content
            const iv = encryptedBuffer.slice(0, 16);
            const encrypted = encryptedBuffer.slice(16);
            
            // Create decipher
            const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
            
            // Decrypt
            let decrypted = decipher.update(encrypted, null, 'utf8');
            decrypted += decipher.final('utf8');
            
            console.log(`✅ Successfully decrypted: ${decrypted}`);
            return decrypted;
        } catch (cryptoError) {
            console.log(`⚠️ Crypto decryption failed: ${cryptoError.message}, trying fallback`);
            throw cryptoError; // Let it fall through to the fallback
        }
        
    } catch (error) {
        console.error('❌ Primary decryption error:', error.message);
        
        // Fallback: try simple base64 decode for testing
        try {
            const decoded = Buffer.from(encryptedData, 'base64').toString('utf8');
            console.log(`🔄 Fallback decryption result: ${decoded}`);
            return decoded;
        } catch (fallbackError) {
            console.error('❌ Fallback decryption also failed:', fallbackError.message);
            // Final fallback: return the encrypted data as-is
            console.log(`🆔 Using encrypted ID as-is: ${encryptedData}`);
            return encryptedData;
        }
    }
}

module.exports = { decryptPropertyId };
