import { e as useRuntimeConfig, c as createError } from './nitro.mjs';

async function fetchWasiProperty(propertyId) {
  const config = useRuntimeConfig();
  const { apiUrl, apiToken, apiId } = config.wasi;
  if (!apiToken || !apiId) {
    throw createError({ statusCode: 500, statusMessage: "WASI API not configured" });
  }
  const url = `${apiUrl}/property/get/${propertyId}`;
  const data = await $fetch(url, {
    params: {
      id_company: apiId,
      wasi_token: apiToken
    },
    headers: {
      Accept: "application/json"
    },
    timeout: 1e4
  });
  return data;
}
async function searchWasiProperties(filters = {}) {
  const config = useRuntimeConfig();
  const { apiUrl, apiToken, apiId } = config.wasi;
  if (!apiToken || !apiId) {
    throw createError({ statusCode: 500, statusMessage: "WASI API not configured" });
  }
  const url = `${apiUrl}/property/search`;
  const data = await $fetch(url, {
    params: {
      id_company: apiId,
      wasi_token: apiToken,
      ...filters
    },
    headers: {
      Accept: "application/json"
    },
    timeout: 15e3
  });
  return data;
}

export { fetchWasiProperty as f, searchWasiProperties as s };
//# sourceMappingURL=wasi-client.mjs.map
