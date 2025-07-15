# Imágenes del Proyecto

Esta carpeta contiene las imágenes utilizadas en la plantilla de propiedades.

## Imágenes Requeridas

### Imágenes por Defecto

- `default-property.jpg` - Imagen por defecto para propiedades sin foto (1200x800px)
- `default-agent.jpg` - Imagen por defecto para agentes sin foto (300x300px)
- `logo.png` - Logo de Inmobarco (200x60px)
- `favicon.ico` - Icono del sitio web (32x32px)

### Imágenes SEO

- `og-image.jpg` - Imagen para Open Graph/redes sociales (1200x630px)

### Iconos PWA (Opcional)

- `icon-192x192.png` - Icono para PWA (192x192px)
- `icon-512x512.png` - Icono para PWA (512x512px)

## Especificaciones Técnicas

### Formatos Recomendados

- **Fotografías:** JPEG con calidad 80-85%
- **Logos/Iconos:** PNG con transparencia
- **Iconos PWA:** PNG

### Optimización

- Usar herramientas como TinyPNG para comprimir imágenes
- Implementar lazy loading para mejorar rendimiento
- Considerar formato WebP para navegadores compatibles

### Nomenclatura

- Usar nombres descriptivos y en minúsculas
- Separar palabras con guiones: `default-property.jpg`
- Incluir dimensiones si es relevante: `logo-200x60.png`

## Integración

Las imágenes se referencian desde:

- `config.js` - Configuración de imágenes por defecto
- `utils.js` - Funciones de optimización de imágenes
- `property-detail-styles.css` - Estilos para imágenes
