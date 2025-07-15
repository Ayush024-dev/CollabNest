import baseX from 'base-x';

const BASE62_ALPHABET = process.env.ENCRYPTION_SECRET_KEY || "iTDE6ZYJgklhI8pBV0WoQF5a73zryxmeunjcwKNsA9UvqbRXPS214tfHLOMdCG";

if (!BASE62_ALPHABET) {
  throw new Error("BASE62_ALPHABET is not set in environment variables");
}
if (new Set(BASE62_ALPHABET).size !== 62) {
  throw new Error("BASE62_ALPHABET must contain exactly 62 unique characters.");
}

const base62 = baseX(BASE62_ALPHABET);

function bufferToHex(buffer) {
  // Handles both Buffer and Uint8Array
  return Array.from(buffer)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function encrypt(text) {
  if (!text || typeof text !== 'string' || !/^[a-fA-F0-9]{24}$/.test(text)) {
    throw new Error("encrypt() expects a 24-character hex MongoDB _id string");
  }

  const buffer = Buffer.from(text, 'hex');      // 12-byte Buffer
  return base62.encode(buffer);                 // Base62 encoded string
}

function decrypt(encryptedData) {
  if (!encryptedData || typeof encryptedData !== 'string') {
    throw new Error("decrypt() expects a base62-encoded string");
  }

  try {
    const buffer = base62.decode(encryptedData);   // Should return 12-byte Buffer or Uint8Array
    if (buffer.length !== 12) {
      throw new Error(`Invalid buffer length after decoding. Expected 12, got ${buffer.length}`);
    }
    const hex = bufferToHex(buffer); // Use custom function
    return hex; // Return 24-char hex MongoDB ObjectId string
  } catch (err) {
    throw new Error(`Failed to decrypt Base62 string: ${err.message}`);
  }
}

export { encrypt, decrypt };
