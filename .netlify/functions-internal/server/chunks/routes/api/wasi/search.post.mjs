import { d as defineEventHandler, r as readBody, c as createError } from '../../../_/nitro.mjs';
import { s as searchWasiProperties } from '../../../_/wasi-client.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';

const search_post = defineEventHandler(async (event) => {
  const body = await readBody(event);
  const filters = body || {};
  try {
    return await searchWasiProperties(filters);
  } catch (error) {
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    throw createError({ statusCode: 502, statusMessage: "Error al buscar propiedades en WASI" });
  }
});

export { search_post as default };
//# sourceMappingURL=search.post.mjs.map
