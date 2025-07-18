const crypto = require('crypto');

const ENCRYPTION_KEY = process.env.VITE_ENCRYPTION_KEY;
const SALT = process.env.VITE_ENCRYPTION_SALT;

function decryptPropertyId(encryptedData) {
    try {
        if (!ENCRYPTION_KEY || !SALT) {
            console.error('❌ Encryption key or salt not found in environment variables');
            return null;
        }

        // Use the same encryption method as the frontend
        const key = crypto.createHash('sha256').update(ENCRYPTION_KEY + SALT).digest();
        
        // Parse the encrypted data (assuming it's in base64 format)
        const encryptedBuffer = Buffer.from(encryptedData, 'base64');
        
        // Extract IV and encrypted content
        const iv = encryptedBuffer.slice(0, 16);
        const encrypted = encryptedBuffer.slice(16);
        
        // Create decipher
        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
        
        // Decrypt
        let decrypted = decipher.update(encrypted, null, 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    } catch (error) {
        console.error('❌ Decryption error:', error);
        
        // Fallback: try simple base64 decode for testing
        try {
            return Buffer.from(encryptedData, 'base64').toString('utf8');
        } catch (fallbackError) {
            console.error('❌ Fallback decryption also failed:', fallbackError);
            return null;
        }
    }
}

module.exports = { decryptPropertyId };
