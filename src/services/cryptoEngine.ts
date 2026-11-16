// Real Cryptography Engine using Web Crypto API (SubtleCrypto) + RFC 6238 TOTP + Pure-JS MD5 + LSB Steganography

const enc = new TextEncoder();
const dec = new TextDecoder();

export function toHex(buf: ArrayBuffer | Uint8Array): string {
  const arr = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function fromHex(hex: string): Uint8Array {
  const clean = hex.replace(/[^0-9a-fA-F]/g, '');
  const out = new Uint8Array(Math.floor(clean.length / 2));
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

export function toBase64(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

export function fromBase64(b64: string): Uint8Array {
  const bin = atob(b64.trim());
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

// Pure-JS RFC 1321 MD5
export function md5(str: string): string {
  const bytes = enc.encode(str);
  const len = bytes.length;
  const wordsLen = (((len + 8) >>> 6) + 1) * 16;
  const x = new Int32Array(wordsLen);
  for (let i = 0; i < len; i++) {
    x[i >> 2] |= bytes[i] << ((i % 4) * 8);
  }
  x[len >> 2] |= 0x80 << ((len % 4) * 8);
  x[wordsLen - 2] = len * 8;

  let a = 0x67452301;
  let b = 0xefcdab89;
  let c = 0x98badcfe;
  let d = 0x10325476;

  const s = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
  ];
  const K = new Int32Array(64);
  for (let i = 0; i < 64; i++) K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 0x100000000) | 0;

  for (let k = 0; k < wordsLen; k += 16) {
    const AA = a, BB = b, CC = c, DD = d;
    for (let i = 0; i < 64; i++) {
      let f = 0, g = 0;
      if (i < 16) { f = (b & c) | (~b & d); g = i; }
      else if (i < 32) { f = (d & b) | (~d & c); g = (5 * i + 1) % 16; }
      else if (i < 48) { f = b ^ c ^ d; g = (3 * i + 5) % 16; }
      else { f = c ^ (b | ~d); g = (7 * i) % 16; }
      const temp = d;
      d = c;
      c = b;
      const sum = (a + f + K[i] + x[k + g]) | 0;
      b = (b + ((sum << s[i]) | (sum >>> (32 - s[i])))) | 0;
      a = temp;
    }
    a = (a + AA) | 0;
    b = (b + BB) | 0;
    c = (c + CC) | 0;
    d = (d + DD) | 0;
  }

  const out = new Uint8Array(16);
  const view = new DataView(out.buffer);
  view.setInt32(0, a, true);
  view.setInt32(4, b, true);
  view.setInt32(8, c, true);
  view.setInt32(12, d, true);
  return toHex(out);
}

export async function digestText(text: string, algo: 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512'): Promise<string> {
  const hash = await crypto.subtle.digest(algo, enc.encode(text));
  return toHex(hash);
}

export async function digestBytes(bytes: ArrayBuffer, algo: 'SHA-1' | 'SHA-256' | 'SHA-512' = 'SHA-256'): Promise<string> {
  const hash = await crypto.subtle.digest(algo, bytes);
  return toHex(hash);
}

export async function hmacSign(message: string, secret: string, algo: 'SHA-256' | 'SHA-512' = 'SHA-256'): Promise<string> {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: algo }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return toHex(sig);
}

async function deriveAesKey(password: string, salt: Uint8Array, iterations = 100000): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function aesEncrypt(plaintext: string, password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveAesKey(password, salt);
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plaintext));
  const combined = new Uint8Array(salt.length + iv.length + cipher.byteLength);
  combined.set(salt, 0);
  combined.set(iv, 16);
  combined.set(new Uint8Array(cipher), 28);
  return toBase64(combined);
}

export async function aesDecrypt(ciphertextB64: string, password: string): Promise<string> {
  const data = fromBase64(ciphertextB64);
  if (data.length < 29) throw new Error('Invalid ciphertext');
  const salt = data.slice(0, 16);
  const iv = data.slice(16, 28);
  const cipher = data.slice(28);
  const key = await deriveAesKey(password, salt);
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher);
  return dec.decode(plain);
}

export async function generateRsaKeyPair(): Promise<{ publicPem: string; privatePem: string }> {
  const kp = await crypto.subtle.generateKey(
    { name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true,
    ['encrypt', 'decrypt']
  );
  const spki = await crypto.subtle.exportKey('spki', kp.publicKey);
  const pkcs8 = await crypto.subtle.exportKey('pkcs8', kp.privateKey);
  const wrap = (b64: string, label: string) =>
    `-----BEGIN ${label}-----\n${b64.match(/.{1,64}/g)?.join('\n')}\n-----END ${label}-----`;
  return {
    publicPem: wrap(toBase64(new Uint8Array(spki)), 'PUBLIC KEY'),
    privatePem: wrap(toBase64(new Uint8Array(pkcs8)), 'PRIVATE KEY'),
  };
}

export async function generateEccKeyPair(): Promise<{ publicPem: string; privatePem: string; keyPair: CryptoKeyPair }> {
  const kp = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const spki = await crypto.subtle.exportKey('spki', kp.publicKey);
  const pkcs8 = await crypto.subtle.exportKey('pkcs8', kp.privateKey);
  const wrap = (b64: string, label: string) =>
    `-----BEGIN ${label}-----\n${b64.match(/.{1,64}/g)?.join('\n')}\n-----END ${label}-----`;
  return {
    publicPem: wrap(toBase64(new Uint8Array(spki)), 'PUBLIC KEY'),
    privatePem: wrap(toBase64(new Uint8Array(pkcs8)), 'PRIVATE KEY'),
    keyPair: kp,
  };
}

// RFC 4648 Base32 decode for TOTP/HOTP
export function base32Decode(input: string): Uint8Array {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const clean = input.toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of clean) {
    const idx = alphabet.indexOf(ch);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return new Uint8Array(out);
}

export async function generateHotp(secretBase32: string, counter: number, digits = 6): Promise<string> {
  const keyBytes = base32Decode(secretBase32);
  if (!keyBytes.length) return '000000';
  const msg = new ArrayBuffer(8);
  const view = new DataView(msg);
  view.setUint32(0, Math.floor(counter / 0x100000000), false);
  view.setUint32(4, counter >>> 0, false);
  const key = await crypto.subtle.importKey('raw', keyBytes as BufferSource, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
  const hmac = new Uint8Array(await crypto.subtle.sign('HMAC', key, msg));
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    (((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff)) %
    Math.pow(10, digits);
  return String(code).padStart(digits, '0');
}

export async function generateTotp(secretBase32: string, period = 30, digits = 6): Promise<{ code: string; remaining: number }> {
  const nowSec = Math.floor(Date.now() / 1000);
  const counter = Math.floor(nowSec / period);
  const remaining = period - (nowSec % period);
  const code = await generateHotp(secretBase32, counter, digits);
  return { code, remaining };
}

export function evaluatePasswordStrength(pwd: string): {
  score: number;
  entropyBits: number;
  labelFa: string;
  crackTime: string;
  color: string;
} {
  if (!pwd) return { score: 0, entropyBits: 0, labelFa: 'خالی', crackTime: 'آنی', color: '#ef4444' };
  let charset = 0;
  if (/[a-z]/.test(pwd)) charset += 26;
  if (/[A-Z]/.test(pwd)) charset += 26;
  if (/[0-9]/.test(pwd)) charset += 10;
  if (/[^a-zA-Z0-9]/.test(pwd)) charset += 32;
  const entropyBits = Math.round(pwd.length * Math.log2(Math.max(charset, 2)));
  const guessesPerSec = 1e10;
  const seconds = Math.pow(2, entropyBits) / guessesPerSec;
  let crackTime = 'کمتر از ۱ ثانیه';
  if (seconds > 3.15e10) crackTime = 'قرن‌ها (غیرقابل شکستن)';
  else if (seconds > 3.15e7) crackTime = `${Math.round(seconds / 3.15e7).toLocaleString()} سال`;
  else if (seconds > 86400) crackTime = `${Math.round(seconds / 86400)} روز`;
  else if (seconds > 3600) crackTime = `${Math.round(seconds / 3600)} ساعت`;
  else if (seconds > 60) crackTime = `${Math.round(seconds / 60)} دقیقه`;

  if (entropyBits >= 80) return { score: 100, entropyBits, labelFa: 'فوق‌العاده امن', crackTime, color: '#10b981' };
  if (entropyBits >= 60) return { score: 80, entropyBits, labelFa: 'قوی', crackTime, color: '#06b6d4' };
  if (entropyBits >= 40) return { score: 55, entropyBits, labelFa: 'متوسط', crackTime, color: '#f59e0b' };
  return { score: 25, entropyBits, labelFa: 'ضعیف', crackTime, color: '#ef4444' };
}

export function generateSecurePassword(opts: {
  length: number;
  upper: boolean;
  lower: boolean;
  numbers: boolean;
  symbols: boolean;
}): string {
  let chars = '';
  if (opts.lower) chars += 'abcdefghijkmnopqrstuvwxyz';
  if (opts.upper) chars += 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  if (opts.numbers) chars += '23456789';
  if (opts.symbols) chars += '!@#$%^&*()-_=+[]{}';
  if (!chars) chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const rand = crypto.getRandomValues(new Uint32Array(opts.length));
  return Array.from(rand, (n) => chars[n % chars.length]).join('');
}

// LSB Image Steganography (Hide / Extract UTF-8 text inside Canvas ImageData)
export function stegoHideMessage(imageData: ImageData, message: string): ImageData {
  const payload = enc.encode(message + '\0OMNI_END\0');
  const bits: number[] = [];
  for (const byte of payload) {
    for (let b = 7; b >= 0; b--) bits.push((byte >> b) & 1);
  }
  const out = new ImageData(new Uint8ClampedArray(imageData.data), imageData.width, imageData.height);
  if (bits.length > (out.data.length / 4) * 3) {
    throw new Error('پیام برای این تصویر بیش از حد طولانی است');
  }
  let bitIdx = 0;
  for (let i = 0; i < out.data.length && bitIdx < bits.length; i++) {
    if ((i + 1) % 4 === 0) continue; // skip alpha
    out.data[i] = (out.data[i] & 0xfe) | bits[bitIdx++];
  }
  return out;
}

export function stegoExtractMessage(imageData: ImageData): string {
  const bytes: number[] = [];
  let curByte = 0;
  let bitCount = 0;
  const marker = '\0OMNI_END\0';
  for (let i = 0; i < imageData.data.length; i++) {
    if ((i + 1) % 4 === 0) continue;
    curByte = (curByte << 1) | (imageData.data[i] & 1);
    bitCount++;
    if (bitCount === 8) {
      bytes.push(curByte);
      curByte = 0;
      bitCount = 0;
      if (bytes.length >= marker.length) {
        const tail = dec.decode(new Uint8Array(bytes.slice(-marker.length)));
        if (tail === marker) {
          return dec.decode(new Uint8Array(bytes.slice(0, -marker.length)));
        }
      }
      if (bytes.length > 50000) break;
    }
  }
  return '';
}
