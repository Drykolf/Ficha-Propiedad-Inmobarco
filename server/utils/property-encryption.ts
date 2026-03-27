/**
 * XOR cipher + URL-safe Base64 for property ID encryption/decryption.
 * Works in both server (Node.js) and client (browser) contexts.
 */

function xorTransform(input: string, key: string): string {
  let result = ''
  const keyLength = key.length
  for (let i = 0; i < input.length; i++) {
    result += String.fromCharCode(input.charCodeAt(i) ^ key.charCodeAt(i % keyLength))
  }
  return result
}

function encodeToUrlSafe(input: string): string {
  // Use Buffer on server, btoa on client
  const base64 = typeof Buffer !== 'undefined'
    ? Buffer.from(input, 'binary').toString('base64')
    : btoa(input)
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function decodeFromUrlSafe(input: string): string {
  let base64 = input.replace(/-/g, '+').replace(/_/g, '/')
  const padding = base64.length % 4
  if (padding) {
    base64 += '='.repeat(4 - padding)
  }
  // Use Buffer on server, atob on client
  return typeof Buffer !== 'undefined'
    ? Buffer.from(base64, 'base64').toString('binary')
    : atob(base64)
}

export function encryptPropertyId(propertyId: string | number, key: string, salt: string): string | null {
  try {
    const keyWithSalt = key + salt
    const encrypted = xorTransform(String(propertyId), keyWithSalt)
    return encodeToUrlSafe(encrypted)
  }
  catch {
    return null
  }
}

export function decryptPropertyId(encryptedId: string, key: string, salt: string): string | null {
  try {
    const keyWithSalt = key + salt
    const encrypted = decodeFromUrlSafe(encryptedId)
    const result = xorTransform(encrypted, keyWithSalt)
    // Validate result looks like a valid property ID
    if (result && /^[a-zA-Z0-9]+$/.test(result)) {
      return result
    }
    return null
  }
  catch {
    return null
  }
}

export function isEncryptedId(value: string): boolean {
  if (!value || typeof value !== 'string') return false
  if (/^\d+$/.test(value)) return false
  return /^[A-Za-z0-9_-]+$/.test(value) && value.length >= 4
}
