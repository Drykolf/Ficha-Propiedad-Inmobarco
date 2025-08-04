const propertyTypes = {
        "1": "Casa",
        "2": "Apartamento",
        "3": "Local comercial",
        "4": "Oficina",
        "5": "Lote / Terreno",
        "6": "Lote Comercial",
        "7": "Finca",
        "8": "Bodega",
        "10": "Chalet",
        "11": "Casa de Campo",
        "12": "Hoteles",
        "13": "Finca - Hoteles",
        "14": "Aparta-Estudio",
        "15": "Consultorio",
        "16": "Edificio",
        "17": "Lote de Playa",
        "18": "Hostal",
        "19": "Condominio",
        "20": "Duplex",
        "21": "Ático",
        "22": "Bungalow",
        "23": "Galpón Industrial",
        "24": "Casa de Playa",
        "25": "Piso",
        "26": "Garaje",
        "27": "Cortijo",
        "28": "Cabañas",
        "29": "Isla",
        "30": "Nave Industrial",
        "31": "Campos, Chacras y Quintas",
        "32": "Terreno"
    };
// Export para ES6 modules
export { propertyTypes };

// Export para CommonJS (compatibilidad)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { propertyTypes };
}