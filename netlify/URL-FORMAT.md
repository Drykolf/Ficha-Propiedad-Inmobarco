# 🔗 Formato de URLs para Inmobarco

## 📋 Formato actual de tus URLs

Tus enlaces tienen el formato:
```
http://127.0.0.1:5500/?id=QR5nXA
```

## 🚀 Cómo funcionará con Netlify Functions

Cuando deploys a Netlify, las URLs funcionarán exactamente igual:

### ✅ URLs que funcionarán automáticamente:

1. **URL principal**: 
   ```
   https://tu-sitio.netlify.app/?id=QR5nXA
   ```

2. **URL con index.html**:
   ```
   https://tu-sitio.netlify.app/index.html?id=QR5nXA
   ```

3. **URL raíz sin parámetros** (página por defecto):
   ```
   https://tu-sitio.netlify.app/
   ```

## ⚙️ Configuración de redirects

La función de Netlify está configurada para capturar:

1. **Todas las requests a `/`** → Se redirigen a la función SSR
2. **Todas las requests a `/index.html`** → Se redirigen a la función SSR  
3. **El parámetro `id`** se mantiene y se pasa a la función

## 🧪 Testing

### Local (con Live Server):
```
http://127.0.0.1:5500/?id=QR5nXA
```

### En Netlify:
```
https://tu-sitio.netlify.app/?id=QR5nXA
```

### Para probar el pre-renderizado:
1. Deploy a Netlify
2. Copia una URL con ID: `https://tu-sitio.netlify.app/?id=QR5nXA`
3. Pégala en WhatsApp para ver el preview
4. Verifica que muestre los datos específicos de esa propiedad

## 📱 Resultado esperado en WhatsApp/Facebook:

En lugar de ver:
```
🏠 Propiedad en Inmobarco
Encuentra la propiedad perfecta
```

Verás algo como:
```
🏠 Casa en Medellín
Arriendo $2.500.000 | 3 hab, 2 baños
[Imagen de la propiedad]
```

## 🔧 Troubleshooting

Si el preview no funciona:

1. **Verifica las variables de entorno** en Netlify
2. **Checa los logs** de la función en Netlify dashboard
3. **Usa Facebook Debugger** para ver qué meta tags detecta:
   https://developers.facebook.com/tools/debug/

¡Todo está configurado para funcionar con tu formato de URL actual!
