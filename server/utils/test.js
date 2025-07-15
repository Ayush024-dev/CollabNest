import dotenv from 'dotenv';
dotenv.config();

import { encrypt, decrypt } from "./encryption.js";

const testId = "";
const encrypted = encrypt(testId);
console.log("Encrypted:", encrypted);
const decrypted = decrypt(encrypted);
console.log("Decrypted:", decrypted);
