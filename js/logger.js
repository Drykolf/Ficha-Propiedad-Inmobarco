// Centralized logging utility for development
// Automatically disables verbose logging in production

class Logger {
    constructor() {
        this.isDevelopment = window.location.hostname === 'localhost' || 
                           window.location.hostname === '127.0.0.1' ||
                           window.location.hostname.includes('netlify.app');
        this.isVerbose = this.isDevelopment;
    }

    // Log information (always shown)
    info(message, data = null) {
        if (data) {
            console.log(`ℹ️ ${message}`, data);
        } else {
            console.log(`ℹ️ ${message}`);
        }
    }

    // Log success (always shown)
    success(message, data = null) {
        if (data) {
            console.log(`✅ ${message}`, data);
        } else {
            console.log(`✅ ${message}`);
        }
    }

    // Log errors (always shown)
    error(message, error = null) {
        if (error) {
            console.error(`❌ ${message}`, error);
        } else {
            console.error(`❌ ${message}`);
        }
    }

    // Log warnings (always shown)
    warn(message, data = null) {
        if (data) {
            console.warn(`⚠️ ${message}`, data);
        } else {
            console.warn(`⚠️ ${message}`);
        }
    }

    // Verbose debug logging (only in development)
    debug(message, data = null) {
        if (!this.isVerbose) return;
        
        if (data) {
            console.log(`🔍 ${message}`, data);
        } else {
            console.log(`🔍 ${message}`);
        }
    }

    // Verbose trace logging (only in development)
    trace(message, data = null) {
        if (!this.isVerbose) return;
        
        if (data) {
            console.log(`🔧 ${message}`, data);
        } else {
            console.log(`🔧 ${message}`);
        }
    }

    // Performance timing
    time(label) {
        if (this.isVerbose) {
            console.time(`⏱️ ${label}`);
        }
    }

    timeEnd(label) {
        if (this.isVerbose) {
            console.timeEnd(`⏱️ ${label}`);
        }
    }

    // Group related logs
    group(label) {
        if (this.isVerbose) {
            console.group(`📁 ${label}`);
        }
    }

    groupEnd() {
        if (this.isVerbose) {
            console.groupEnd();
        }
    }
}

// Create global logger instance
window.logger = new Logger();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Logger;
}
