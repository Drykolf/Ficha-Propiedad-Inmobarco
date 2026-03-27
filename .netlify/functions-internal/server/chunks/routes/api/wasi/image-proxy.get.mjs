import { d as defineEventHandler, a as getQuery, c as createError, s as setResponseHeaders } from '../../../_/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';

const imageProxy_get = defineEventHandler(async (event) => {
  const query = getQuery(event);
  const imageUrl = query.url;
  if (!imageUrl) {
    throw createError({ statusCode: 400, statusMessage: "Image URL is required" });
  }
  try {
    const response = await $fetch.raw(imageUrl, {
      responseType: "arrayBuffer",
      timeout: 15e3
    });
    const contentType = response.headers.get("content-type") || "image/jpeg";
    setResponseHeaders(event, {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400"
    });
    return response._data;
  } catch {
    throw createError({ statusCode: 502, statusMessage: "Failed to fetch image" });
  }
});

export { imageProxy_get as default };
//# sourceMappingURL=image-proxy.get.mjs.map
