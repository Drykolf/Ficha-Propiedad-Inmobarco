// Property ID Encryption/Decryption Module
// Simple but effective encryption to obfuscate property IDs in URLs

class PropertyEncryption {
    constructor() {
        this.key = null;
        this.salt = null;
        this.initialized = false;
    }

    // Initialize with configuration from env-config
    init(encryptionConfig = null) {
        try {
            // Use provided config or get from environment/fallback
            if (encryptionConfig) {
                this.key = encryptionConfig.key;
                this.salt = encryptionConfig.salt;
            } else {
                // Fallback only if encryption config not provided
                this.key = window.ENV?.VITE_ENCRYPTION_KEY || '';
                this.salt = window.ENV?.VITE_ENCRYPTION_SALT || '';
            }
            
            // Validate that we have proper encryption keys
            if (!this.key || !this.salt || this.key === 'TU_CLAVE_DE_ENCRIPTACION_AQUI' || this.salt === 'TU_SALT_AQUI') {
                console.error('❌ Invalid encryption configuration. Please set proper encryption keys.');
                this.initialized = false;
                return false;
            }
            
            this.initialized = true;
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize encryption:', error);
            this.initialized = false;
            return false;
        }
    }

    // Simple XOR-based encryption with Base64 encoding
    encrypt(propertyId) {
        if (!this.initialized) {
            console.error('❌ Encryption not initialized. Cannot encrypt property ID.');
            return null;
        }

        try {
            const id = String(propertyId);
            const keyWithSalt = this.key + this.salt;
            
            // XOR encryption
            let encrypted = '';
            for (let i = 0; i < id.length; i++) {
                const keyChar = keyWithSalt.charCodeAt(i % keyWithSalt.length);
                const idChar = id.charCodeAt(i);
                encrypted += String.fromCharCode(idChar ^ keyChar);
            }
            
            // Base64 encode and make URL-safe
            const base64 = btoa(encrypted);
            const urlSafe = base64
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=/g, '');
            
            return urlSafe;
        } catch (error) {
            console.error('❌ Encryption failed:', error);
            return null;
        }
    }

    // Decrypt the encrypted property ID
    decrypt(encryptedId) {
        if (!this.initialized) {
            console.error('❌ Encryption not initialized. Cannot decrypt property ID.');
            return null;
        }

        try {
            if (!encryptedId) return null;
            
            // Convert URL-safe Base64 back to normal Base64
            let base64 = encryptedId
                .replace(/-/g, '+')
                .replace(/_/g, '/');
            
            // Add padding if needed
            while (base64.length % 4) {
                base64 += '=';
            }
            
            // Decode from Base64
            const encrypted = atob(base64);
            const keyWithSalt = this.key + this.salt;
            
            // XOR decryption
            let decrypted = '';
            for (let i = 0; i < encrypted.length; i++) {
                const keyChar = keyWithSalt.charCodeAt(i % keyWithSalt.length);
                const encChar = encrypted.charCodeAt(i);
                decrypted += String.fromCharCode(encChar ^ keyChar);
            }
            
            return decrypted;
        } catch (error) {
            console.error('❌ Decryption failed:', error);
            return null;
        }
    }

    // Validate if a string looks like an encrypted ID
    isEncrypted(value) {
        if (!value || typeof value !== 'string') {
            return false;
        }
        
        // Reject purely numeric strings (like "1815", "123", etc.)
        if (/^\d+$/.test(value)) {
            return false;
        }
        
        // Check if it looks like a Base64 URL-safe string
        const base64UrlPattern = /^[A-Za-z0-9_-]+$/;
        const matchesPattern = base64UrlPattern.test(value);
        const hasMinLength = value.length >= 4;
        
        // Additional check: encrypted values should have mixed characters
        const hasMixedChars = /[A-Za-z]/.test(value) && /[0-9_-]/.test(value);
        
        return matchesPattern && hasMinLength && hasMixedChars;
    }

    // Generate encrypted URL for a property ID
    generatePropertyUrl(propertyId, baseUrl = window.location.origin) {
        const encryptedId = this.encrypt(propertyId);
        
        if (!encryptedId) {
            console.error('❌ Cannot generate URL: encryption failed for property ID:', propertyId);
            return null;
        }
        
        try {
            const url = new URL(baseUrl);
            url.searchParams.set('id', encryptedId);
            return url.toString();
        } catch (error) {
            console.error('❌ Failed to generate property URL:', error);
            return null;
        }
    }

    // Extract and decrypt property ID from current URL
    getPropertyIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        const idParam = urlParams.get('id');
        
        if (!idParam) {
            return null;
        }
        
        // Only accept encrypted IDs
        if (this.isEncrypted(idParam)) {
            const decryptedId = this.decrypt(idParam);
            if (decryptedId) {
                return decryptedId;
            } else {
                console.error('❌ Failed to decrypt property ID:', idParam);
                return null;
            }
        } else {
            // Reject non-encrypted IDs
            console.error('❌ Property ID must be encrypted. Non-encrypted IDs are not allowed:', idParam);
            return null;
        }
    }
}

// Create global instance
window.propertyEncryption = new PropertyEncryption();

// Debug helpers for development
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.debugEncryption = {
        encrypt: (id) => {
            const result = window.propertyEncryption.encrypt(id);
            console.log(`🔐 Encrypted ID ${id} → ${result}`);
            return result;
        },
        decrypt: (encrypted) => {
            const result = window.propertyEncryption.decrypt(encrypted);
            console.log(`🔓 Decrypted ${encrypted} → ${result}`);
            return result;
        },
        generateUrl: (id) => {
            const result = window.propertyEncryption.generatePropertyUrl(id);
            console.log(`🌐 Generated URL for ID ${id} → ${result}`);
            return result;
        },
        validateUrl: (url) => {
            const urlObj = new URL(url);
            const idParam = urlObj.searchParams.get('id');
            const isValid = window.propertyEncryption.isEncrypted(idParam);
            console.log(`✅ URL validation: ${url} → ID: ${idParam} → Valid: ${isValid}`);
            return isValid;
        },
        test: () => {
            console.log('🧪 Testing encryption (encrypted IDs only):');
            console.log('⚠️ Note: Only encrypted IDs are now accepted by the system');
            
            const testIds = ['123', '456', '1815', '9999'];
            testIds.forEach(id => {
                const encrypted = window.propertyEncryption.encrypt(id);
                const decrypted = window.propertyEncryption.decrypt(encrypted);
                const isValid = window.propertyEncryption.isEncrypted(encrypted);
                console.log(`ID: ${id} → Encrypted: ${encrypted} → Decrypted: ${decrypted} → Valid: ${isValid}`);
            });
            
            // Test invalid scenarios
            console.log('\n🚫 Testing rejection of non-encrypted IDs:');
            const plainIds = ['123', 'abc', '1815'];
            plainIds.forEach(id => {
                const isValid = window.propertyEncryption.isEncrypted(id);
                console.log(`Plain ID: ${id} → Accepted: ${isValid} (should be false)`);
            });
        }
    };
    
    console.log('🛠️ Debug tools available: window.debugEncryption');
    console.log('📝 Usage: debugEncryption.test() to run encryption tests');
}
