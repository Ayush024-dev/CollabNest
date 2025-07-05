import crypto from "crypto";

const ENCRYPTION_KEY = process.env.ENCRYPTION_SECRET_KEY;
// console.log("My Encryption key: ",ENCRYPTION_KEY);
if (!ENCRYPTION_KEY) {
  throw new Error("ENCRYPTION_SECRET_KEY is not set in environment variables");
}
// Ensure the key is 32 bytes (AES-256)
const KEY = Buffer.alloc(32);
Buffer.from(ENCRYPTION_KEY).copy(KEY);

function encrypt(text) {
  const iv = crypto.randomBytes(16); 
  const cipher = crypto.createCipheriv("aes-256-cbc", KEY, iv);
  let encrypted = cipher.update(text, 'utf-8', 'base64');
  encrypted += cipher.final('base64');

  return `${iv.toString('base64')}:${encrypted}`; 
}

function decrypt(encryptedData) {
  console.log("Here is my data: ",encryptedData)
  if (!encryptedData || typeof encryptedData !== "string") {
    throw new Error("Invalid encrypted data: data is missing or not a string");
  }
  
  if (!encryptedData.includes(":")) {
    throw new Error("Invalid encrypted data format: missing separator");
  }
  
  const [ivStr, encryptedText] = encryptedData.split(':');
  if (!ivStr || !encryptedText) {
    throw new Error("Invalid encrypted data format: missing IV or encrypted text");
  }
  
  try {
    const iv = Buffer.from(ivStr, 'base64');
    const decipher = crypto.createDecipheriv("aes-256-cbc", KEY, iv);
    let decrypted = decipher.update(encryptedText, 'base64', 'utf-8');
    decrypted += decipher.final('utf-8');
    return decrypted;
  } catch (err) {
    console.error("Decryption error details:", err);
    throw new Error("Decryption failed: " + err.message);
  }
}

export { encrypt, decrypt };
