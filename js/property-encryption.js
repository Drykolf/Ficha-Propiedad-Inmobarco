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
                // Fallback to environment variables or defaults
                this.key = window.ENV?.VITE_ENCRYPTION_KEY || 'InmobarcoSecretKey2025';
                this.salt = window.ENV?.VITE_ENCRYPTION_SALT || 'PropertySalt';
            }
            
            this.initialized = true;
            console.log('🔐 Property ID encryption initialized');
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize encryption:', error);
            // Fallback to default values
            this.key = 'InmobarcoSecretKey2025';
            this.salt = 'PropertySalt';
            this.initialized = true;
            return false;
        }
    }

    // Simple XOR-based encryption with Base64 encoding
    encrypt(propertyId) {
        if (!this.initialized) {
            this.init();
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
            return propertyId; // Fallback to original ID
        }
    }

    // Decrypt the encrypted property ID
    decrypt(encryptedId) {
        if (!this.initialized) {
            this.init();
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
        if (!value || typeof value !== 'string') return false;
        
        // Check if it looks like a Base64 URL-safe string
        const base64UrlPattern = /^[A-Za-z0-9_-]+$/;
        return base64UrlPattern.test(value) && value.length > 4;
    }

    // Generate encrypted URL for a property ID
    generatePropertyUrl(propertyId, baseUrl = window.location.origin) {
        const encryptedId = this.encrypt(propertyId);
        const url = new URL(baseUrl);
        url.searchParams.set('id', encryptedId);
        return url.toString();
    }

    // Extract and decrypt property ID from current URL
    getPropertyIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        const idParam = urlParams.get('id');
        
        if (!idParam) return null;
        
        // Check if it's encrypted
        if (this.isEncrypted(idParam)) {
            const decryptedId = this.decrypt(idParam);
            console.log('🔓 Decrypted property ID:', decryptedId);
            return decryptedId;
        } else {
            // Legacy support for non-encrypted IDs
            console.log('⚠️ Using non-encrypted property ID (legacy mode)');
            return idParam;
        }
    }
}

// Create global instance
window.propertyEncryption = new PropertyEncryption();

// Debug helpers for development
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.debugEncryption = {
        encrypt: (id) => window.propertyEncryption.encrypt(id),
        decrypt: (encrypted) => window.propertyEncryption.decrypt(encrypted),
        generateUrl: (id) => window.propertyEncryption.generatePropertyUrl(id),
        test: () => {
            const testIds = ['123', '456', '1815', '9999'];
            console.log('🧪 Testing encryption:');
            testIds.forEach(id => {
                const encrypted = window.propertyEncryption.encrypt(id);
                const decrypted = window.propertyEncryption.decrypt(encrypted);
                console.log(`ID: ${id} → Encrypted: ${encrypted} → Decrypted: ${decrypted}`);
            });
        }
    };
}
