# Plantilla de Detalles de Propiedad - Inmobarco

## Descripción

Esta plantilla crea una página minimalista para mostrar detalles de propiedades individuales, integrada con la API de Arrendasoft V2. La página no incluye header, footer ni navegación, enfocándose únicamente en la información de la propiedad.

## Características

- ✅ **Diseño minimalista**: Sin header, footer ni navegación
- ✅ **Integración con API Arrendasoft V2**: Consume datos en tiempo real
- ✅ **Responsive**: Optimizada para móviles y desktop
- ✅ **Rápida**: Carga sin dependencias de WordPress
- ✅ **SEO optimizada**: Meta tags dinámicos
- ✅ **Contacto integrado**: WhatsApp, email y teléfono
- ✅ **Fácil de implementar**: HTML, CSS y JavaScript puro

## Archivos Incluidos

1. **property-detail-template.html** - Plantilla HTML principal
2. **arrendasoft-api.js** - Módulo de integración con API
3. **property-detail-styles.css** - Estilos CSS avanzados
4. **README.md** - Documentación completa

## Requisitos

- Hosting web básico (Apache/Nginx)
- Acceso a la API de Arrendasoft V2
- Token de autenticación de la API
- Dominio configurado (inmobarco.com)

## Instalación

### Opción 1: Como Página Independiente

1. **Sube los archivos a tu servidor:**
   ```
   /public_html/
   ├── property/
   │   ├── index.html (renombrar property-detail-template.html)
   │   ├── arrendasoft-api.js
   │   └── property-detail-styles.css
   ```

2. **Configura la API:**
   ```javascript
   const apiConfig = {
       baseUrl: 'https://tu-instancia.arrendasoft.co/service/v2/public',
       token: 'TU_TOKEN_DE_API_AQUI',
       instance: 'tu-instancia'
   };
   ```

3. **Accede a las propiedades:**
   ```
   https://inmobarco.com/property/?id=123
   https://inmobarco.com/property/123
   ```

### Opción 2: Como Plantilla en WordPress

1. **Crea un directorio en tu tema:**
   ```
   /wp-content/themes/tu-tema/
   ├── page-property-detail.php
   ├── js/
   │   └── arrendasoft-api.js
   └── css/
       └── property-detail-styles.css
   ```

2. **Crea page-property-detail.php:**
   ```php
   <?php
   /*
   Template Name: Property Detail
   */
   
   // Contenido del archivo property-detail-template.html
   ?>
   ```

3. **Crea una página con la plantilla:**
   - Ir a Páginas > Añadir nueva
   - Título: "Detalles de Propiedad"
   - Plantilla: "Property Detail"
   - Slug: "property"

### Opción 3: Como Subdirectorio

1. **Estructura recomendada:**
   ```
   /public_html/
   ├── property/
   │   ├── index.html
   │   ├── assets/
   │   │   ├── js/
   │   │   │   └── arrendasoft-api.js
   │   │   └── css/
   │   │       └── property-detail-styles.css
   │   └── .htaccess
   ```

2. **Configurar .htaccess:**
   ```apache
   RewriteEngine On
   RewriteRule ^([0-9]+)$ index.html?id=$1 [L,QSA]
   ```

## Configuración de la API

### 1. Obtener Token de Acceso

```javascript
// Ejemplo de login para obtener token
const login = async () => {
    const response = await fetch('https://tu-instancia.arrendasoft.co/service/v2/public/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username: 'tu_usuario',
            password: 'tu_contraseña'
        })
    });
    
    const data = await response.json();
    return data.token;
};
```

### 2. Configurar Instancia

Reemplaza `tu-instancia` con el nombre de tu instancia en Arrendasoft:
```javascript
const apiConfig = {
    baseUrl: 'https://inmobarco.arrendasoft.co/service/v2/public',
    token: 'tu_token_aqui',
    instance: 'inmobarco'
};
```

## Estructura de URLs

La página soporta diferentes formatos de URL:

1. **Query Parameter:**
   ```
   https://inmobarco.com/property/?id=123
   ```

2. **Path Parameter:**
   ```
   https://inmobarco.com/property/123
   ```

3. **Subdirectorio:**
   ```
   https://inmobarco.com/property/apartamento-123
   ```

## Personalización

### Colores y Estilo

Edita las variables CSS en `property-detail-styles.css`:

```css
:root {
    --primary-color: #3498db;      /* Color principal */
    --secondary-color: #2c3e50;    /* Color secundario */
    --accent-color: #e74c3c;       /* Color de acento */
    --text-color: #333;            /* Color del texto */
    --background-color: #f8f9fa;   /* Color de fondo */
}
```

### Información de Contacto

Modifica los datos de contacto en `arrendasoft-api.js`:

```javascript
contactWhatsApp() {
    const phone = '573001234567'; // Tu número de WhatsApp
    const message = encodeURIComponent('Tu mensaje personalizado');
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
}
```

### Campos de Propiedad

Personaliza los campos mostrados en `renderPropertyFeatures()`:

```javascript
const features = [
    { label: 'Habitaciones', value: property.bedrooms },
    { label: 'Baños', value: property.bathrooms },
    { label: 'Área', value: this.formatArea(property.area) },
    { label: 'Parqueaderos', value: property.parking },
    // Agrega más campos según tus necesidades
];
```

## Desarrollo Local

### Usando Live Server en VSCode

1. **Instala Live Server:**
   - Abre VSCode
   - Ir a Extensions (Ctrl+Shift+X)
   - Buscar "Live Server"
   - Instalar la extensión de Ritwick Dey

2. **Ejecutar el servidor:**
   - Abrir `property-detail-template.html`
   - Clic derecho > "Open with Live Server"
   - O usar el botón "Go Live" en la barra de estado

3. **Acceder a la página:**
   ```
   http://localhost:5500/property-detail-template.html?id=123
   ```

### Usando Node.js

```bash
# Instalar live-server globalmente
npm install -g live-server

# Ejecutar desde el directorio del proyecto
live-server --port=3000

# Acceder a la página
http://localhost:3000/property-detail-template.html?id=123
```

## SEO y Optimización

### Meta Tags Dinámicos

La página actualiza automáticamente:
- `<title>`: Título de la propiedad
- `<meta name="description">`: Descripción generada
- Open Graph tags para redes sociales

### Optimización de Imágenes

```javascript
// Ejemplo de optimización de imágenes
const optimizeImage = (src, width = 800) => {
    return `${src}?w=${width}&q=80&fm=webp`;
};
```

### Lazy Loading

Para optimizar la carga:

```javascript
// Implementar lazy loading para imágenes
const lazyImages = document.querySelectorAll('img[data-src]');
const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.classList.remove('lazy');
            imageObserver.unobserve(img);
        }
    });
});

lazyImages.forEach(img => imageObserver.observe(img));
```

## Seguridad

### Validación de Datos

```javascript
// Validar ID de propiedad
const validatePropertyId = (id) => {
    return /^[0-9]+$/.test(id) && parseInt(id) > 0;
};

// Sanitizar contenido
const sanitizeContent = (content) => {
    const div = document.createElement('div');
    div.textContent = content;
    return div.innerHTML;
};
```

### Variables de Entorno

Para producción, usa variables de entorno:

```javascript
const apiConfig = {
    baseUrl: process.env.ARRENDASOFT_API_URL || 'https://default-url.com',
    token: process.env.ARRENDASOFT_TOKEN || 'default-token',
    instance: process.env.ARRENDASOFT_INSTANCE || 'default-instance'
};
```

## Troubleshooting

### Problemas Comunes

1. **Error de CORS:**
   ```
   Solución: Configurar headers CORS en el servidor de Arrendasoft
   O usar un proxy server
   ```

2. **Token expirado:**
   ```javascript
   // Implementar renovación automática de token
   if (response.status === 401) {
       await this.refreshToken();
       return this.request(endpoint, options);
   }
   ```

3. **Propiedad no encontrada:**
   ```javascript
   // Manejar errores 404
   if (response.status === 404) {
       this.showError('Propiedad no encontrada');
       return;
   }
   ```

### Debugging

```javascript
// Activar modo debug
const DEBUG = true;

const debugLog = (message, data) => {
    if (DEBUG) {
        console.log(`[DEBUG] ${message}`, data);
    }
};
```

## Despliegue

### Hosting Compartido

1. Subir archivos via FTP
2. Configurar permisos (755 para directorios, 644 para archivos)
3. Configurar DNS si es necesario

### CDN (Recomendado)

```html
<!-- Cargar desde CDN para mejor rendimiento -->
<link rel="preload" href="https://cdn.inmobarco.com/css/property-detail-styles.css" as="style">
<script defer src="https://cdn.inmobarco.com/js/arrendasoft-api.js"></script>
```

## Monitoreo

### Analytics

```javascript
// Integrar Google Analytics
gtag('event', 'property_view', {
    'property_id': this.propertyId,
    'property_title': this.property.title
});
```

### Error Tracking

```javascript
// Integrar Sentry para tracking de errores
Sentry.captureException(error);
```

## Soporte

Para soporte técnico:
- Email: soporte@inmobarco.com
- Documentación API: https://docs.arrendasoft.co
- GitHub Issues: [Crear issue]

## Licencia

Este proyecto está bajo la licencia MIT. Ver archivo LICENSE para más detalles.

## Contribución

1. Fork el proyecto
2. Crear feature branch (`git checkout -b feature/nueva-caracteristica`)
3. Commit cambios (`git commit -am 'Agregar nueva característica'`)
4. Push al branch (`git push origin feature/nueva-caracteristica`)
5. Crear Pull Request

## Changelog

### v1.0.0
- ✅ Implementación inicial
- ✅ Integración con API Arrendasoft V2
- ✅ Diseño responsive
- ✅ Contacto por WhatsApp, email y teléfono

### Próximas Versiones
- 🔄 Galería de imágenes avanzada
- 🔄 Mapa interactivo
- 🔄 Compartir en redes sociales
- 🔄 Comparar propiedades
- 🔄 Calculadora de hipoteca