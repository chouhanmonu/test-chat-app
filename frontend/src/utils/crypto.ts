const encoder = new TextEncoder();
const decoder = new TextDecoder();

const toBase64 = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
};

const fromBase64 = (value: string) => {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

export type KeyPair = {
  publicKey: string;
  privateKey: string;
};

export const ensureKeyPair = async (): Promise<KeyPair> => {
  const existingPublic = localStorage.getItem('publicKey');
  const existingPrivate = localStorage.getItem('privateKey');
  if (existingPublic && existingPrivate) {
    return { publicKey: existingPublic, privateKey: existingPrivate };
  }

  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256'
    },
    true,
    ['encrypt', 'decrypt']
  );

  const publicKeyBuffer = await crypto.subtle.exportKey('spki', keyPair.publicKey);
  const privateKeyBuffer = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

  const publicKey = toBase64(publicKeyBuffer);
  const privateKey = toBase64(privateKeyBuffer);

  localStorage.setItem('publicKey', publicKey);
  localStorage.setItem('privateKey', privateKey);

  return { publicKey, privateKey };
};

export const importPublicKey = async (publicKey: string) => {
  return crypto.subtle.importKey(
    'spki',
    fromBase64(publicKey),
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    true,
    ['encrypt']
  );
};

export const importPrivateKey = async (privateKey: string) => {
  return crypto.subtle.importKey(
    'pkcs8',
    fromBase64(privateKey),
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    true,
    ['decrypt']
  );
};

export const encryptWithPublicKey = async (publicKey: string, payload: ArrayBuffer) => {
  const key = await importPublicKey(publicKey);
  const encrypted = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, key, payload);
  return toBase64(encrypted);
};

export const decryptWithPrivateKey = async (privateKey: string, payloadBase64: string) => {
  const key = await importPrivateKey(privateKey);
  const decrypted = await crypto.subtle.decrypt({ name: 'RSA-OAEP' }, key, fromBase64(payloadBase64));
  return decrypted;
};

export const generateAesKey = async () => {
  return crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
};

export const exportAesKey = async (key: CryptoKey) => {
  const raw = await crypto.subtle.exportKey('raw', key);
  return raw;
};

export const importAesKey = async (rawKey: ArrayBuffer) => {
  return crypto.subtle.importKey('raw', rawKey, { name: 'AES-GCM' }, true, ['encrypt', 'decrypt']);
};

export const encryptWithAesGcm = async (key: CryptoKey, plaintext: string) => {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(plaintext)
  );
  return { cipherText: toBase64(encrypted), iv: toBase64(iv.buffer) };
};

export const decryptWithAesGcm = async (key: CryptoKey, cipherText: string, iv: string) => {
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(fromBase64(iv)) },
    key,
    fromBase64(cipherText)
  );
  return decoder.decode(decrypted);
};
