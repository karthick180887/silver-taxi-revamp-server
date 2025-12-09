import CryptoJS from 'crypto-js';
import env from './env';

const MASTER_SECRET = env.ADMIN_MASTER_KEY!;

export function encryptKey(str: string): string {
    return CryptoJS.AES.encrypt(str, MASTER_SECRET).toString();
}

export function decryptKey(encryptedStr: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedStr, MASTER_SECRET);
    return bytes.toString(CryptoJS.enc.Utf8);
}