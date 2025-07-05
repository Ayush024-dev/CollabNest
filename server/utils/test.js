import dotenv from 'dotenv';
dotenv.config();

import { encrypt, decrypt } from "./encryption.js";

const testId = "676b05cfca56bdcae3d1807b";
const encrypted = encrypt(testId);
console.log("Encrypted:", encrypted);
const decrypted = decrypt(encrypted);
console.log("Decrypted:", decrypted);
