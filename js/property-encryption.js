// Property ID Encryption/Decryption Module - Optimized for performance and security
class PropertyEncryption {
    constructor() {
        this.key = null;
        this.salt = null;
        this.initialized = false;
        this.keyWithSalt = null; // Cache for performance
        this.encryptionPattern = /^[A-Za-z0-9_-]+$/; // Compiled regex for better performance
    }

    // Initialize with configuration - optimized for performance
    init(encryptionConfig = null) {
        try {
            this.key = encryptionConfig?.key || window.ENV?.VITE_ENCRYPTION_KEY || '';
            this.salt = encryptionConfig?.salt || window.ENV?.VITE_ENCRYPTION_SALT || '';
            
            if (!this._validateKeys()) {
                return this._initializationFailed();
            }
            
            // Cache key with salt for performance
            this.keyWithSalt = this.key + this.salt;
            this.initialized = true;
            return true;
            
        } catch (error) {
            console.error('❌ Failed to initialize encryption:', error);
            return this._initializationFailed();
        }
    }

    _validateKeys() {
        const invalidKeys = ['TU_CLAVE_DE_ENCRIPTACION_AQUI', 'TU_SALT_AQUI'];
        return this.key && 
               this.salt && 
               !invalidKeys.includes(this.key) && 
               !invalidKeys.includes(this.salt);
    }

    _initializationFailed() {
        console.error('❌ Invalid encryption configuration. Please set proper encryption keys.');
        this.initialized = false;
        this.keyWithSalt = null;
        return false;
    }

    // Optimized XOR-based encryption with error handling
    encrypt(propertyId) {
        if (!this._isInitialized('encrypt')) return null;

        try {
            const id = String(propertyId);
            const encrypted = this._xorTransform(id, this.keyWithSalt);
            return this._encodeToUrlSafe(encrypted);
        } catch (error) {
            console.error('❌ Encryption failed:', error);
            return null;
        }
    }

    // Optimized decryption with better error handling
    decrypt(encryptedId) {
        if (!this._isInitialized('decrypt') || !encryptedId) return null;

        try {
            const encrypted = this._decodeFromUrlSafe(encryptedId);
            return this._xorTransform(encrypted, this.keyWithSalt);
        } catch (error) {
            console.error('❌ Decryption failed:', error);
            return null;
        }
    }

    // Optimized XOR transformation (used for both encrypt/decrypt)
    _xorTransform(input, key) {
        let result = '';
        const keyLength = key.length;
        
        for (let i = 0; i < input.length; i++) {
            const keyChar = key.charCodeAt(i % keyLength);
            const inputChar = input.charCodeAt(i);
            result += String.fromCharCode(inputChar ^ keyChar);
        }
        
        return result;
    }

    // Encode to URL-safe Base64
    _encodeToUrlSafe(input) {
        return btoa(input)
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');
    }

    // Decode from URL-safe Base64
    _decodeFromUrlSafe(input) {
        let base64 = input
            .replace(/-/g, '+')
            .replace(/_/g, '/');
        
        // Add padding if needed
        const padding = base64.length % 4;
        if (padding) {
            base64 += '='.repeat(4 - padding);
        }
        
        return atob(base64);
    }

    // Helper to check initialization status
    _isInitialized(operation) {
        if (!this.initialized) {
            console.error(`❌ Encryption not initialized. Cannot ${operation} property ID.`);
            return false;
        }
        return true;
    }

    // Optimized validation for encrypted IDs
    isEncrypted(value) {
        if (!value || typeof value !== 'string') return false;
        
        // Quick numeric check
        if (/^\d+$/.test(value)) return false;
        
        // Use cached regex pattern
        return this.encryptionPattern.test(value) && 
               value.length >= 4 && 
               this._hasMixedCharacters(value);
    }

    // Helper to check for mixed characters
    _hasMixedCharacters(value) {
        return /[A-Za-z]/.test(value) && /[0-9_-]/.test(value) || /[A-Za-z]/.test(value);
    }

    // Generate encrypted URL with better error handling
    generatePropertyUrl(propertyId, baseUrl = window.location.origin) {
        const encryptedId = this.encrypt(propertyId);
        
        if (!encryptedId) {
            console.error('❌ Cannot generate URL: encryption failed for property ID:', propertyId);
            return null;
        }
        
        return this._buildUrl(baseUrl, encryptedId);
    }

    // Helper to build URL safely
    _buildUrl(baseUrl, encryptedId) {
        try {
            const url = new URL(baseUrl);
            url.searchParams.set('id', encryptedId);
            return url.toString();
        } catch (error) {
            console.error('❌ Failed to generate property URL:', error);
            return null;
        }
    }

    // Extract and decrypt property ID from current URL - cached for performance
    getPropertyIdFromUrl() {
        if (this._cachedPropertyId !== undefined) {
            return this._cachedPropertyId;
        }

        const urlParams = new URLSearchParams(window.location.search);
        const idParam = urlParams.get('id');
        
        if (!idParam) {
            this._cachedPropertyId = null;
            return null;
        }

        // Only accept encrypted IDs
        if (this.isEncrypted(idParam)) {
            const decryptedId = this.decrypt(idParam);
            if (decryptedId) {
                this._cachedPropertyId = decryptedId;
                return decryptedId;
            } else {
                console.error('❌ Failed to decrypt property ID:', idParam);
                this._cachedPropertyId = null;
                return null;
            }
        } else {
            // Reject non-encrypted IDs
            console.error('❌ Property ID must be encrypted. Non-encrypted IDs are not allowed:', idParam);
            this._cachedPropertyId = null;
            return null;
        }
    }

    // Clear cached property ID (call when URL changes)
    clearCache() {
        this._cachedPropertyId = undefined;
    }

    // Cleanup method for memory management
    cleanup() {
        this.key = null;
        this.salt = null;
        this.keyWithSalt = null;
        this.initialized = false;
        this._cachedPropertyId = undefined;
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
