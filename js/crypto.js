/* Shared AES-128-GCM helpers */
const AES_PASSWORD = "CuriousData2026Oscar!";
const AES_SALT = "curious-data-salt-v2";
const DATA_URL = "./data/data.json";
const SESSION_KEY = "curiousDataSession";
const SESSION_OK = "curiousDataVerified";

function isLocalMode() {
  return location.protocol === "file:";
}

async function deriveKey(password) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: enc.encode(AES_SALT),
      iterations: 100000,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 128 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encryptPayload(obj) {
  const key = await deriveKey(AES_PASSWORD);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = new TextEncoder().encode(JSON.stringify(obj));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext);
  const result = new Uint8Array(iv.length + ciphertext.byteLength);
  result.set(iv, 0);
  result.set(new Uint8Array(ciphertext), iv.length);
  return result;
}

async function decryptData(encryptedBuffer) {
  const key = await deriveKey(AES_PASSWORD);
  const bytes = new Uint8Array(encryptedBuffer);
  if (bytes.length < 13) throw new Error("Archivo demasiado corto");
  const iv = bytes.slice(0, 12);
  const ciphertext = bytes.slice(12);
  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
  return JSON.parse(new TextDecoder().decode(decrypted));
}

function looksLikePlainJson(buffer) {
  try {
    const head = new TextDecoder().decode(buffer.slice(0, Math.min(32, buffer.byteLength))).trim();
    return head.startsWith("{") || head.startsWith("[");
  } catch (e) {
    return false;
  }
}

async function fetchAndDecrypt(onProgress) {
  if (onProgress) onProgress(10, "Buscando data/data.json...");
  let buffer;
  try {
    const res = await fetch(DATA_URL + "?t=" + Date.now(), {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache" }
    });
    if (!res.ok) {
      if (res.status === 404) {
        if (onProgress) onProgress(100, "No hay data.json");
        return { ok: true, empty: true, data: [] };
      }
      throw new Error("HTTP " + res.status);
    }
    if (onProgress) onProgress(35, "Leyendo binario...");
    buffer = await res.arrayBuffer();
    if (onProgress) onProgress(50, "Binario: " + buffer.byteLength + " bytes");
  } catch (e) {
    if (onProgress) onProgress(100, "No se pudo leer el archivo");
    return { ok: true, empty: true, data: [], note: e.message };
  }

  if (!buffer || buffer.byteLength === 0) {
    if (onProgress) onProgress(100, "Archivo vacío");
    return { ok: true, empty: true, data: [] };
  }

  if (looksLikePlainJson(buffer)) {
    return {
      ok: false,
      reason: "data.json no está cifrado.\nDebes generarlo desde data.html (botón guardar)."
    };
  }

  if (onProgress) onProgress(70, "Descifrando AES-128...");
  try {
    const parsed = await decryptData(buffer);
    if (!Array.isArray(parsed)) throw new Error("Formato inválido");
    if (onProgress) onProgress(95, "Integridad OK · " + parsed.length + " datos");
    return { ok: true, empty: parsed.length === 0, data: parsed };
  } catch (e) {
    return {
      ok: false,
      reason:
        "Integridad comprometida: no se pudo descifrar data.json (AES-128).\n" +
        "El archivo fue modificado o es inválido.\nBytes: " +
        buffer.byteLength
    };
  }
}

function saveSession(data) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
    sessionStorage.setItem(SESSION_OK, "1");
  } catch (e) {}
}

function loadSession() {
  try {
    if (sessionStorage.getItem(SESSION_OK) !== "1") return null;
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch (e) {
    return null;
  }
}

function clearSession() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_OK);
  } catch (e) {}
}
