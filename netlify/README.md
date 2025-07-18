# 🚀 Netlify Functions para Pre-renderizado de Propiedades

Este directorio contiene las 4. Configura las variables de entorno
5. Actualiza `netlify.toml` con la configuración template
6. ¡Listo! Las URLs de propiedades tendrán pre-renderizado automático

### 📝 Ejemplos de URLs que funcionarán:

- `https://tu-sitio.netlify.app/?id=QR5nXA`
- `https://tu-sitio.netlify.app/index.html?id=QR5nXA`
- `https://tu-sitio.netlify.app/` (página por defecto)lify Functions implementadas para generar páginas pre-renderizadas con meta tags dinámicas para cada propiedad.

## 📁 Estructura

```
netlify/
├── functions/
│   ├── lib/
│   │   └── encryption.js          # Módulo de encriptación/desencriptación
│   └── property-ssr.js           # Función principal de SSR
├── netlify-config-template.toml   # Plantilla de configuración
└── README.md                     # Este archivo
```

## ⚙️ Configuración

### 1. Variables de Entorno

En el dashboard de Netlify, configura estas variables:

```
VITE_API_BASE_URL=https://api.arrendasoft.com/v2
VITE_API_TOKEN=tu_token_de_api_aqui
VITE_API_INSTANCE=inmobarco
VITE_ENCRYPTION_KEY=tu_clave_de_encriptacion
VITE_ENCRYPTION_SALT=tu_salt_de_encriptacion
```

### 2. Configuración de Netlify

Copia el contenido de `netlify-config-template.toml` a tu archivo `netlify.toml` principal.

## 🎯 Cómo Funciona

1. **URL de Propiedad**: `https://tu-sitio.netlify.app/?id=QR5nXA`
2. **Netlify redirige** la URL a la función `property-ssr`
3. **La función**:
   - Desencripta el ID de la propiedad (QR5nXA)
   - Consulta la API de Arrendasoft
   - Genera HTML con meta tags dinámicas
   - Retorna página pre-renderizada
4. **Los bots de redes sociales** ven las meta tags correctas
5. **JavaScript del frontend** detecta datos pre-cargados y los usa

## ✅ Beneficios

- ✅ **Previews perfectas** en WhatsApp, Facebook, Twitter
- ✅ **SEO optimizado** con meta tags específicas
- ✅ **Carga rápida** con datos pre-cargados
- ✅ **Fallback inteligente** en caso de errores
- ✅ **Caché eficiente** para mejor rendimiento

## 🧪 Testing Local

1. Instala Netlify CLI: `npm install -g netlify-cli`
2. Ejecuta localmente: `netlify dev`
3. Prueba URLs: `http://localhost:8888/?id=QR5nXA`

## 📱 Testing en Redes Sociales

1. Deploy a Netlify
2. Obtén URL de propiedad: `https://tu-sitio.netlify.app/?id=QR5nXA`
3. Comparte en WhatsApp/Facebook para ver preview
4. Usa Facebook Debugger: https://developers.facebook.com/tools/debug/

## 🔧 Troubleshooting

### Error: "API token not configured"
- Verifica que `VITE_API_TOKEN` esté configurado en Netlify

### Error: "Failed to decrypt property ID"
- Verifica que `VITE_ENCRYPTION_KEY` y `VITE_ENCRYPTION_SALT` estén configurados
- Asegúrate de que coincidan con la configuración del frontend

### Error: "Property not found"
- Verifica que el ID de propiedad sea válido
- Verifica que la propiedad esté activa en Arrendasoft

## 💡 Logs y Debug

La función incluye logs detallados. Para verlos:

1. En Netlify dashboard: **Functions** → **property-ssr** → **Function log**
2. En desarrollo local: Los logs aparecen en la consola de `netlify dev`

## 🚀 Deploy

1. Commit y push de los archivos a tu repositorio
2. Netlify detectará automáticamente las funciones
3. Configura las variables de entorno
4. Actualiza `netlify.toml` con la configuración template
5. ¡Listo! Las URLs de propiedades tendrán pre-renderizado automático

## 📊 Límites Gratuitos Netlify

- ✅ 125,000 invocaciones/mes
- ✅ 100 horas de ejecución/mes
- ✅ Bandwidth ilimitado
- ✅ 1 build concurrente

Para la mayoría de inmobiliarias, estos límites son más que suficientes.
