// Utility Functions for Property Template
// Common helper functions used across the application

class Utils {
    // URL and Parameter Helpers
    static getUrlParameter(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    }

    static getPropertyIdFromUrl() {
        // Try multiple methods to get property ID
        const methods = [
            () => this.getUrlParameter('id'),
            () => this.getUrlParameter('property_id'),
            () => this.getUrlParameter('pid'),
            () => {
                const pathParts = window.location.pathname.split('/');
                const propertyIndex = pathParts.findIndex(part => part === 'property');
                return propertyIndex !== -1 && pathParts[propertyIndex + 1] 
                    ? pathParts[propertyIndex + 1] 
                    : null;
            },
            () => {
                const pathParts = window.location.pathname.split('/');
                const lastPart = pathParts[pathParts.length - 1];
                return /^\d+$/.test(lastPart) ? lastPart : null;
            }
        ];

        for (const method of methods) {
            const result = method();
            if (result && this.isValidPropertyId(result)) {
                return result;
            }
        }

        return null;
    }

    static isValidPropertyId(id) {
        return id && /^[0-9]+$/.test(id.toString()) && parseInt(id) > 0;
    }

    static updateUrl(propertyId, title = '') {
        if (history.pushState) {
            const newUrl = `${window.location.pathname}?id=${propertyId}`;
            const pageTitle = title ? `${title} - Inmobarco` : document.title;
            history.pushState({ propertyId }, pageTitle, newUrl);
        }
    }

    // Formatting Helpers
    static formatCurrency(amount, locale = 'es-CO', currency = 'COP') {
        if (!amount || isNaN(amount)) return 'Precio a consultar';
        
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    static formatArea(area, unit = 'm²') {
        if (!area || isNaN(area)) return 'N/A';
        return `${parseInt(area).toLocaleString()} ${unit}`;
    }

    static formatNumber(number) {
        if (!number || isNaN(number)) return 'N/A';
        return parseInt(number).toLocaleString();
    }

    // Date and Time Helpers
    static formatDate(date, locale = 'es-CO') {
        if (!date) return '';
        
        const dateObj = new Date(date);
        return dateObj.toLocaleDateString(locale, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    static timeAgo(date) {
        if (!date) return '';
        
        const now = new Date();
        const diffInSeconds = Math.floor((now - new Date(date)) / 1000);
        
        const intervals = {
            año: 31536000,
            mes: 2592000,
            semana: 604800,
            día: 86400,
            hora: 3600,
            minuto: 60
        };

        for (const [unit, seconds] of Object.entries(intervals)) {
            const interval = Math.floor(diffInSeconds / seconds);
            if (interval >= 1) {
                return `hace ${interval} ${unit}${interval > 1 ? 's' : ''}`;
            }
        }

        return 'hace un momento';
    }

    // String Helpers
    static capitalizeWords(str) {
        if (!str) return '';
        return str.replace(/\w\S*/g, (txt) => 
            txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        );
    }

    static truncateText(text, maxLength = 100, suffix = '...') {
        if (!text || text.length <= maxLength) return text;
        return text.substr(0, maxLength).trim() + suffix;
    }

    static slugify(text) {
        return text
            .toLowerCase()
            .replace(/[áàäâ]/g, 'a')
            .replace(/[éèëê]/g, 'e')
            .replace(/[íìïî]/g, 'i')
            .replace(/[óòöô]/g, 'o')
            .replace(/[úùüû]/g, 'u')
            .replace(/ñ/g, 'n')
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    }

    // Image Helpers
    static getOptimizedImageUrl(url, width = 800, height = 600, quality = 80) {
        if (!url) return '/assets/images/default-property.jpg';
        
        // Add image optimization parameters if the URL supports it
        const separator = url.includes('?') ? '&' : '?';
        return `${url}${separator}w=${width}&h=${height}&q=${quality}&fm=webp`;
    }

    static createImageGallery(images, maxVisible = 4) {
        if (!images || !Array.isArray(images)) return [];
        
        return {
            visible: images.slice(0, maxVisible),
            remaining: Math.max(0, images.length - maxVisible),
            total: images.length
        };
    }

    // Validation Helpers
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    static isValidPhone(phone) {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
    }

    static sanitizeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // Storage Helpers
    static saveToStorage(key, data, useSessionStorage = false) {
        try {
            const storage = useSessionStorage ? sessionStorage : localStorage;
            storage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.warn('Could not save to storage:', error);
            return false;
        }
    }

    static getFromStorage(key, useSessionStorage = false) {
        try {
            const storage = useSessionStorage ? sessionStorage : localStorage;
            const data = storage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.warn('Could not retrieve from storage:', error);
            return null;
        }
    }

    static removeFromStorage(key, useSessionStorage = false) {
        try {
            const storage = useSessionStorage ? sessionStorage : localStorage;
            storage.removeItem(key);
            return true;
        } catch (error) {
            console.warn('Could not remove from storage:', error);
            return false;
        }
    }

    // Performance Helpers
    static debounce(func, wait, immediate = false) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func(...args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func(...args);
        };
    }

    static throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Device Detection
    static isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    static isIOS() {
        return /iPad|iPhone|iPod/.test(navigator.userAgent);
    }

    static isAndroid() {
        return /Android/.test(navigator.userAgent);
    }

    // Share Helpers
    static shareProperty(property, url = window.location.href) {
        const shareData = {
            title: property.title || 'Propiedad en Inmobarco',
            text: `${property.title} - ${this.formatCurrency(property.price)}`,
            url: url
        };

        if (navigator.share) {
            return navigator.share(shareData);
        } else {
            // Fallback for browsers that don't support Web Share API
            if (navigator.clipboard) {
                navigator.clipboard.writeText(url);
                this.showNotification('Enlace copiado al portapapeles');
            }
            return Promise.resolve();
        }
    }

    // Notification Helper
    static showNotification(message, type = 'info', duration = 3000) {
        // Simple notification system
        const notification = document.createElement('div');
        notification.className = `notification notification--${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#e74c3c' : type === 'success' ? '#2ecc71' : '#3498db'};
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    }

    // Error Handling
    static handleError(error, context = '') {
        console.error(`Error in ${context}:`, error);
        
        // Log to external service if configured
        if (window.CONFIG?.ANALYTICS?.SENTRY_DSN) {
            // Sentry.captureException(error);
        }

        // Show user-friendly message
        this.showNotification(
            'Ha ocurrido un error. Por favor, inténtelo de nuevo.',
            'error'
        );
    }

    // Loading States
    static showLoading(element, text = 'Cargando...') {
        if (typeof element === 'string') {
            element = document.getElementById(element);
        }
        
        if (element) {
            element.innerHTML = `
                <div class="loading-spinner">
                    <div class="spinner"></div>
                    <p>${text}</p>
                </div>
            `;
            element.style.display = 'flex';
        }
    }

    static hideLoading(element) {
        if (typeof element === 'string') {
            element = document.getElementById(element);
        }
        
        if (element) {
            element.style.display = 'none';
        }
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
} else {
    window.Utils = Utils;
}
