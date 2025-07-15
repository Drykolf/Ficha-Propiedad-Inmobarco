// Configuración Segura de API
// Este archivo maneja las credenciales de forma más segura

class SecureAPIConfig {
    constructor() {
        this.config = this.getConfig();
    }

    getConfig() {
        // En desarrollo local
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return {
                baseUrl: 'https://inmobarco.arrendasoft.co/service/v2/public',
                token: this.getEncodedToken(),
                instance: 'inmobarco'
            };
        }

        // En producción, las credenciales deben venir del servidor
        return {
            baseUrl: window.INMOBARCO_CONFIG?.apiUrl || '/api/v2/public',
            token: window.INMOBARCO_CONFIG?.token || '',
            instance: window.INMOBARCO_CONFIG?.instance || 'inmobarco'
        };
    }

    // Token codificado para desarrollo (no completamente seguro, pero mejor que texto plano)
    getEncodedToken() {
        // Token codificado en base64 (solo para desarrollo)
        const encoded = 'YThhYWZkNDcwOTY0NDU5MDRhZDQzMDhjZDBiZmI5ZjQ4NTcwOTU2OS03MGszbjpkZXY=';
        try {
            return atob(encoded).split(':')[0];
        } catch (e) {
            console.warn('Error decodificando token');
            return '';
        }
    }

    getApiConfig() {
        return this.config;
    }
}

// Crear instancia global
window.SecureConfig = new SecureAPIConfig();
