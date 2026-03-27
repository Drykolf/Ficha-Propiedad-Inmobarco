import { d as defineEventHandler, b as getRouterParam, c as createError, e as useRuntimeConfig } from '../../../../_/nitro.mjs';
import { f as fetchWasiProperty } from '../../../../_/wasi-client.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';

function xorTransform(input, key) {
  let result = "";
  const keyLength = key.length;
  for (let i = 0; i < input.length; i++) {
    result += String.fromCharCode(input.charCodeAt(i) ^ key.charCodeAt(i % keyLength));
  }
  return result;
}
function decodeFromUrlSafe(input) {
  let base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padding = base64.length % 4;
  if (padding) {
    base64 += "=".repeat(4 - padding);
  }
  return typeof Buffer !== "undefined" ? Buffer.from(base64, "base64").toString("binary") : atob(base64);
}
function decryptPropertyId(encryptedId, key, salt) {
  try {
    const keyWithSalt = key + salt;
    const encrypted = decodeFromUrlSafe(encryptedId);
    const result = xorTransform(encrypted, keyWithSalt);
    if (result && /^[a-zA-Z0-9]+$/.test(result)) {
      return result;
    }
    return null;
  } catch {
    return null;
  }
}
function isEncryptedId(value) {
  if (!value || typeof value !== "string") return false;
  if (/^\d+$/.test(value)) return false;
  return /^[A-Za-z0-9_-]+$/.test(value) && value.length >= 4;
}

const _id__get = defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Property ID is required" });
  }
  let propertyId = id;
  if (isEncryptedId(id)) {
    const config = useRuntimeConfig();
    const decrypted = decryptPropertyId(id, config.encryption.key, config.encryption.salt);
    if (!decrypted) {
      throw createError({ statusCode: 400, statusMessage: "Invalid encrypted property ID" });
    }
    propertyId = decrypted;
  }
  try {
    const property = await fetchWasiProperty(propertyId);
    if (parseInt(String(property.id_availability)) !== 1 || ![1, 3].includes(parseInt(String(property.id_status_on_page)))) {
      throw createError({ statusCode: 404, statusMessage: "La propiedad no esta disponible" });
    }
    return property;
  } catch (error) {
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    throw createError({ statusCode: 502, statusMessage: "Error al obtener datos de WASI" });
  }
});

export { _id__get as default };
//# sourceMappingURL=_id_.get.mjs.map
