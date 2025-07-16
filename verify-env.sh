#!/bin/bash

# Script para verificar configuración de variables de entorno
# Este script te ayuda a verificar que tienes todas las variables necesarias

echo "🔍 Verificando configuración de variables de entorno..."
echo ""

# Verificar si existe .env
if [ -f ".env" ]; then
    echo "✅ Archivo .env encontrado"
    
    # Verificar variables críticas
    if grep -q "VITE_ENCRYPTION_KEY=" ".env"; then
        echo "✅ VITE_ENCRYPTION_KEY configurada"
    else
        echo "❌ VITE_ENCRYPTION_KEY no encontrada"
    fi
    
    if grep -q "VITE_ENCRYPTION_SALT=" ".env"; then
        echo "✅ VITE_ENCRYPTION_SALT configurada"
    else
        echo "❌ VITE_ENCRYPTION_SALT no encontrada"
    fi
    
    if grep -q "VITE_API_TOKEN=" ".env"; then
        echo "✅ VITE_API_TOKEN configurada"
    else
        echo "❌ VITE_API_TOKEN no encontrada"
    fi
    
else
    echo "⚠️  Archivo .env no encontrado"
    echo "💡 Copia .env.example a .env y configura las variables"
fi

echo ""
echo "📝 Recordatorios para Netlify:"
echo "1. Ve a Site settings > Environment variables"
echo "2. Configura todas las variables listadas en .env.example"
echo "3. Especialmente VITE_ENCRYPTION_KEY y VITE_ENCRYPTION_SALT"
echo "4. Haz un nuevo deploy después de configurar las variables"
echo ""
echo "🔗 Más información en ENV_SETUP.md"
