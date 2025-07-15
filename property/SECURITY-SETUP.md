# Configuración de Seguridad - API Inmobarco

## 🔒 Configuración Segura de Credenciales API

### Desarrollo Local

Para desarrollo local, ya está incluido el archivo `js/secure-config.js` que utiliza codificación Base64 básica:

```javascript
class SecureAPIConfig {
  constructor() {
    this.environment = this.detectEnvironment();
  }

  // Los tokens están codificados en Base64 para desarrollo
  getAuthToken() {
    // Token codificado para desarrollo
    return atob("YThhYWZkNDcwOTY0NDU5MDRhZDQzMDhjZDBiZmI5ZjQ4NTcwOTU2OS03MGs0");
  }
}
```

### ⚠️ Producción (Requerido)

**IMPORTANTE:** Para producción, debe implementar un endpoint seguro del lado del servidor que proporcione las credenciales.

#### Opción 1: Endpoint del Servidor (Recomendado)

1. Crear un endpoint en su servidor backend:

```javascript
// Ejemplo para Node.js/Express
app.get("/api/config", authenticateUser, (req, res) => {
  res.json({
    apiUrl: process.env.ARRENDASOFT_API_URL,
    token: process.env.ARRENDASOFT_TOKEN,
    instance: process.env.ARRENDASOFT_INSTANCE,
  });
});
```

2. Modificar `secure-config.js` para usar fetch:

```javascript
async getAuthToken() {
    if (this.environment === 'production') {
        const response = await fetch('/api/config');
        const config = await response.json();
        return config.token;
    }
    // Fallback para desarrollo
    return atob('...');
}
```

#### Opción 2: Variables de Entorno del Build

Para aplicaciones SPA con procesos de build:

1. Configurar variables de entorno en el servidor:

```bash
REACT_APP_API_URL=https://inmobarco.arrendasoft.co/service/v2/public
REACT_APP_API_TOKEN=su_token_aqui
REACT_APP_INSTANCE=inmobarco
```

2. Usar en el build process para inyectar las variables.

### 🛡️ Mejores Prácticas de Seguridad

1. **Nunca hardcodear tokens en el código fuente**
2. **Usar HTTPS en producción**
3. **Implementar rotación de tokens**
4. **Validar origen de requests en el servidor**
5. **Usar CSP (Content Security Policy) headers**

### 🔍 Verificación de Seguridad

Para verificar que la configuración segura está funcionando:

1. Abrir DevTools > Console
2. Buscar el mensaje: "✅ Using secure API configuration"
3. Verificar que no aparezcan tokens en el código fuente

### 🚀 Implementación Rápida

Para implementar rápidamente en un servidor:

1. **PHP:**

```php
<?php
header('Content-Type: application/json');
echo json_encode([
    'apiUrl' => $_ENV['ARRENDASOFT_API_URL'],
    'token' => $_ENV['ARRENDASOFT_TOKEN'],
    'instance' => $_ENV['ARRENDASOFT_INSTANCE']
]);
?>
```

2. **Python/Flask:**

```python
import os
from flask import jsonify

@app.route('/api/config')
def get_config():
    return jsonify({
        'apiUrl': os.environ.get('ARRENDASOFT_API_URL'),
        'token': os.environ.get('ARRENDASOFT_TOKEN'),
        'instance': os.environ.get('ARRENDASOFT_INSTANCE')
    })
```

### 📞 Soporte

Si necesita ayuda con la implementación de seguridad, contacte al equipo de desarrollo de Inmobarco.
