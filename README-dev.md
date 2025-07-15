# 🏠 Plantilla de Propiedades Inmobarco - Guía de Desarrollo

## 🚀 Inicio Rápido con VSCode y Live Server

### Requisitos Previos

- **Visual Studio Code** (versión 1.60 o superior)
- **Live Server Extension** para VSCode
- **Navegador web moderno** (Chrome, Firefox, Safari, Edge)
- **Conexión a internet** (para la API de Arrendasoft)

### 📦 Instalación

1. **Clonar o descargar el proyecto:**

   ```bash
   git clone https://github.com/inmobarco/property-template.git
   cd property-template
   ```

2. **Abrir en VSCode:**

   ```bash
   code .
   ```

   O arrastra la carpeta del proyecto al VSCode

3. **Instalar extensiones recomendadas:**
   - VSCode te sugerirá automáticamente las extensiones al abrir el proyecto
   - O instala manualmente: `Ctrl+Shift+P` → "Extensions: Show Recommended Extensions"

### 🔧 Configuración Inicial

1. **Configurar la API:**

   - Copia `config.example.js` a `config.js`
   - Actualiza los valores según tu configuración:

   ```javascript
   const CONFIG = {
     API: {
       BASE_URL: "https://tu-instancia.arrendasoft.co/service/v2/public",
       TOKEN: "tu_token_aqui",
       INSTANCE: "tu_instancia",
     },
   };
   ```

2. **Configurar información de contacto:**
   ```javascript
   CONTACT: {
       WHATSAPP: '573001234567',
       EMAIL: {
           GENERAL: 'info@tu-empresa.com'
       }
   }
   ```

### 🚀 Ejecutar el Proyecto

#### Opción 1: Con Live Server (Recomendado)

1. **Abrir `index.html`**
2. **Clic derecho** → "Open with Live Server"
3. **O usar el botón "Go Live"** en la barra de estado de VSCode

#### Opción 2: Con NPM Scripts

```bash
# Instalar dependencias (opcional)
npm install

# Ejecutar servidor de desarrollo
npm start

# Ejecutar con propiedad de prueba
npm run dev

# Servidor de vista previa
npm run preview
```

#### Opción 3: Comando Manual

```bash
# Si tienes Node.js instalado
npx live-server --port=3000 --open=index.html

# O con Python (si no tienes Node.js)
python -m http.server 8000
```

### 🔗 URLs de Prueba

Una vez ejecutando el servidor, puedes probar con:

```
http://localhost:3000/index.html?id=123
http://localhost:3000/index.html?property_id=456
http://localhost:3000/property/789
```

### 🛠️ Estructura del Proyecto

```
inmobarco-property-template/
├── .vscode/
│   ├── settings.json          # Configuración de VSCode
│   ├── extensions.json        # Extensiones recomendadas
│   └── launch.json           # Configuración de debugging
├── assets/
│   └── images/               # Imágenes del proyecto
├── index.html                # Página principal
├── arrendasoft-api.js        # Módulo de API
├── property-detail-styles.css # Estilos CSS
├── utils.js                  # Funciones utilitarias
├── config.example.js         # Configuración de ejemplo
├── package.json              # Configuración NPM
├── .gitignore               # Archivos a ignorar por Git
└── README-dev.md            # Esta guía
```

### 🎯 Funcionalidades Principales

#### ✅ Integración con API

- Consumo de Arrendasoft V2 API
- Manejo automático de errores
- Caché de respuestas
- Reintento automático

#### ✅ Diseño Responsive

- Mobile-first approach
- Breakpoints optimizados
- Imágenes adaptables
- Touch-friendly

#### ✅ SEO Optimizado

- Meta tags dinámicos
- Open Graph tags
- Structured data
- URLs amigables

#### ✅ Contacto Integrado

- WhatsApp directo
- Email automático
- Llamada telefónica
- Compartir propiedad

### 🔧 Desarrollo y Personalización

#### Modificar Estilos

```css
/* En property-detail-styles.css */
:root {
  --primary-color: #3498db; /* Color principal */
  --secondary-color: #2c3e50; /* Color secundario */
  --accent-color: #e74c3c; /* Color de acento */
}
```

#### Agregar Nuevos Campos

```javascript
// En arrendasoft-api.js - método renderPropertyFeatures()
const features = [
  { label: "Habitaciones", value: property.bedrooms },
  { label: "Baños", value: property.bathrooms },
  { label: "Tu Nuevo Campo", value: property.tu_campo },
  // ...
];
```

#### Personalizar Contacto

```javascript
// En arrendasoft-api.js - método contactWhatsApp()
contactWhatsApp() {
    const phone = '573001234567'; // Tu número
    const message = 'Tu mensaje personalizado';
    // ...
}
```

### 🧪 Testing y Debugging

#### Modo Debug

```javascript
// En la consola del navegador
window.debugAPI.testProperty(123); // Cargar propiedad específica
window.debugAPI.clearCache(); // Limpiar caché
window.debugAPI.logConfig(); // Ver configuración
```

#### Debugging en VSCode

1. **Configurar breakpoints** en el código JavaScript
2. **F5** para iniciar debugging
3. **Seleccionar "Debug JavaScript"**

#### Testing de API

```javascript
// Probar llamadas a la API
const api = new ArrendasoftAPI(CONFIG.API);
api.getProperty(123).then(console.log);
```

### 🔍 Solución de Problemas

#### Error de CORS

```
Problema: Error de CORS al cargar desde file://
Solución: Usar Live Server o servidor HTTP
```

#### Token Expirado

```
Problema: Error 401 Unauthorized
Solución: Actualizar token en config.js
```

#### Propiedad No Encontrada

```
Problema: Error 404 al cargar propiedad
Solución: Verificar ID de propiedad en la URL
```

#### Estilos No Se Cargan

```
Problema: CSS no se aplica correctamente
Solución: Verificar ruta del archivo CSS en index.html
```

### 🚀 Despliegue

#### Hosting Estático (Recomendado)

1. **Subir archivos** a tu servidor web
2. **Configurar redirects** para URLs amigables
3. **Habilitar HTTPS**
4. **Configurar caché** para archivos estáticos

#### Apache .htaccess

```apache
RewriteEngine On
RewriteRule ^property/([0-9]+)$ index.html?id=$1 [L,QSA]

# Cache static files
<FilesMatch "\.(css|js|jpg|jpeg|png|gif|ico|svg)$">
    ExpiresActive On
    ExpiresDefault "access plus 1 month"
</FilesMatch>
```

#### Nginx

```nginx
location ~ ^/property/([0-9]+)$ {
    try_files $uri /index.html?id=$1;
}

# Cache static files
location ~* \.(css|js|jpg|jpeg|png|gif|ico|svg)$ {
    expires 1M;
    add_header Cache-Control "public, immutable";
}
```

### 📊 Optimización y Performance

#### Lazy Loading de Imágenes

```javascript
// Ya implementado en utils.js
const images = document.querySelectorAll("img[data-src]");
Utils.lazyLoadImages(images);
```

#### Minificación

```bash
# Para producción, minificar archivos
npm install -g uglify-js clean-css-cli html-minifier

uglifyjs arrendasoft-api.js -o arrendasoft-api.min.js
cleancss property-detail-styles.css -o property-detail-styles.min.css
```

#### Compresión de Imágenes

```bash
# Optimizar imágenes
npm install -g imagemin-cli

imagemin assets/images/*.jpg --out-dir=assets/images/optimized
```

### 🔐 Seguridad

#### Variables de Entorno

```javascript
// Para producción, usar variables de entorno
const CONFIG = {
  API: {
    TOKEN: process.env.ARRENDASOFT_TOKEN,
    BASE_URL: process.env.ARRENDASOFT_URL,
  },
};
```

#### Validación de Datos

```javascript
// Siempre validar datos de entrada
const propertyId = Utils.getPropertyIdFromUrl();
if (!Utils.isValidPropertyId(propertyId)) {
  throw new Error("Invalid property ID");
}
```

### 📱 Progressive Web App (PWA)

#### Manifest.json

```json
{
  "name": "Inmobarco Properties",
  "short_name": "Inmobarco",
  "description": "Encuentra tu propiedad ideal",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3498db",
  "icons": [
    {
      "src": "/assets/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    }
  ]
}
```

#### Service Worker

```javascript
// sw.js - Para funcionalidad offline
self.addEventListener("fetch", (event) => {
  if (event.request.url.includes("/api/")) {
    // Cache API responses
    event.respondWith(cacheFirst(event.request));
  }
});
```

### 📈 Analytics y Monitoreo

#### Google Analytics 4

```javascript
// En config.js
ANALYTICS: {
  GOOGLE_ANALYTICS_ID: "G-XXXXXXXXXX";
}

// Tracking de eventos
gtag("event", "property_view", {
  property_id: propertyId,
  property_title: property.title,
});
```

#### Error Tracking con Sentry

```javascript
// Configurar Sentry para tracking de errores
import * as Sentry from "@sentry/browser";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
});
```

### 🤝 Contribución

1. **Fork** el repositorio
2. **Crear branch** para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. **Commit** tus cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. **Push** al branch (`git push origin feature/nueva-funcionalidad`)
5. **Crear Pull Request**

### 📞 Soporte

- **Email:** soporte@inmobarco.com
- **Documentación:** [Wiki del proyecto]
- **Issues:** [GitHub Issues]
- **Chat:** [Discord/Slack]

### 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver `LICENSE` para más detalles.

---

**¡Happy coding! 🚀**

Para más información, consulta la documentación completa en `README-implementacion.md`.
