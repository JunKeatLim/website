export const COOKIE_NAME = "finsight_auth"
export const COOKIE_MAX_AGE = 60 * 60 * 24 // 1 day

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

function fromHex(hex: string): Uint8Array<ArrayBuffer> {
  const buffer = new ArrayBuffer(hex.length / 2)
  const bytes = new Uint8Array(buffer)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16)
  }
  return bytes
}

async function getKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  )
}

export async function createSessionToken(secret: string): Promise<string> {
  const key = await getKey(secret)
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode("authenticated")
  )
  return toHex(signature)
}

export async function verifySessionToken(token: string, secret: string): Promise<boolean> {
  try {
    const key = await getKey(secret)
    return await crypto.subtle.verify(
      "HMAC",
      key,
      fromHex(token),
      new TextEncoder().encode("authenticated")
    )
  } catch {
    return false
  }
}
