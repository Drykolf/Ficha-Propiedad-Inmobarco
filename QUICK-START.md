# 🚀 Inicio Rápido - Plantilla de Propiedades Inmobarco

## ⚡ En 3 pasos

### 1. Abrir en VSCode

```bash
code .
```

### 2. Instalar Live Server

- Ctrl+Shift+X → Buscar "Live Server" → Instalar

### 3. Ejecutar

- Abrir `index.html`
- Clic derecho → "Open with Live Server"
- O botón "Go Live" en barra de estado

## 🔗 URLs de Prueba

```
http://localhost:3000/index.html?id=123
http://localhost:3000/demo.html
```

## ⚙️ Configuración Rápida

1. **Copiar configuración:**

   ```bash
   copy config.example.js config.js
   ```

2. **Editar API settings en config.js:**

   ```javascript
   API: {
       TOKEN: 'tu_token_aqui',
       BASE_URL: 'https://tu-instancia.arrendasoft.co/service/v2/public'
   }
   ```

3. **Personalizar contacto:**
   ```javascript
   CONTACT: {
       WHATSAPP: '573001234567',
       EMAIL: { GENERAL: 'info@tu-empresa.com' }
   }
   ```

## 🎨 Personalizar Colores

En `property-detail-styles.css`:

```css
:root {
  --primary-color: #3498db; /* Azul principal */
  --secondary-color: #2c3e50; /* Gris oscuro */
  --accent-color: #e74c3c; /* Rojo acento */
}
```

## 🔧 Comandos NPM

```bash
npm start      # Servidor desarrollo
npm run dev    # Con propiedad de prueba
npm run demo   # Página de demostración
```

## 🐛 Debug

En consola del navegador (F12):

```javascript
debugAPI.testProperty(123); // Cargar propiedad
debugAPI.clearCache(); // Limpiar caché
debugAPI.logConfig(); // Ver configuración
```

## 📁 Estructura Mínima

```
├── index.html                 # Página principal
├── arrendasoft-api.js         # API integration
├── property-detail-styles.css # Estilos
├── utils.js                  # Utilidades
├── config.js                 # Configuración (crear desde .example)
└── demo.html                 # Página de demostración
```

## 🚀 Deploy Rápido

1. Subir archivos a servidor web
2. Configurar URL rewrite (opcional):
   ```apache
   RewriteRule ^property/([0-9]+)$ index.html?id=$1
   ```

## 📞 Soporte

- 📧 soporte@inmobarco.com
- 📖 Ver README-dev.md para guía completa
