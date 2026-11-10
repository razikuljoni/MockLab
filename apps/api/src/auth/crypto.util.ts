import * as crypto from "node:crypto";

export class CryptoUtil {
  /**
   * Hashes a password using scrypt with a cryptographic salt
   */
  static hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto.scryptSync(password, salt, 64).toString("hex");
    return `${salt}:${hash}`;
  }

  /**
   * Verifies a password against the stored scrypt salt:hash string
   */
  static verifyPassword(password: string, stored: string): boolean {
    const [salt, expectedHash] = stored.split(":");
    if (!salt || !expectedHash) return false;
    const computedHash = crypto.scryptSync(password, salt, 64).toString("hex");
    return crypto.timingSafeEqual(Buffer.from(computedHash, "hex"), Buffer.from(expectedHash, "hex"));
  }

  /**
   * Encodes an object or string to base64url
   */
  private static base64UrlEncode(data: string | Buffer): string {
    const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
    return buf.toString("base64url");
  }

  /**
   * Decodes a base64url string to Buffer
   */
  private static base64UrlDecode(str: string): Buffer {
    return Buffer.from(str, "base64url");
  }

  /**
   * Signs a JWT using HMAC-SHA256
   */
  static signJwt(payload: Record<string, unknown>, secret: string, expiresInSec: number = 86400): string {
    const header = { alg: "HS256", typ: "JWT" };
    const now = Math.floor(Date.now() / 1000);
    const fullPayload = {
      ...payload,
      iat: now,
      exp: now + expiresInSec,
    };

    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this.base64UrlEncode(JSON.stringify(fullPayload));
    const dataToSign = `${encodedHeader}.${encodedPayload}`;

    const signature = crypto.createHmac("sha256", secret).update(dataToSign).digest();
    const encodedSig = this.base64UrlEncode(signature);

    return `${dataToSign}.${encodedSig}`;
  }

  /**
   * Verifies and decodes an HMAC-SHA256 JWT
   */
  static verifyJwt<T extends Record<string, unknown>>(token: string, secret: string): T | null {
    try {
      const parts = token.split(".");
      if (parts.length !== 3) return null;

      const [encodedHeader, encodedPayload, encodedSig] = parts;
      const dataToSign = `${encodedHeader}.${encodedPayload}`;

      const expectedSig = crypto.createHmac("sha256", secret).update(dataToSign).digest();
      const providedSig = this.base64UrlDecode(encodedSig);

      if (expectedSig.length !== providedSig.length) return null;
      if (!crypto.timingSafeEqual(expectedSig, providedSig)) return null;

      const payloadJson = this.base64UrlDecode(encodedPayload).toString("utf8");
      const payload = JSON.parse(payloadJson) as T & { exp?: number };

      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        return null; // Expired
      }

      return payload;
    } catch {
      return null;
    }
  }

  /**
   * Encrypts a secret using AES-256-GCM (§15.6 decision)
   */
  static encrypt(plaintext: string, keyHex: string): string {
    const key = Buffer.from(keyHex.slice(0, 64).padEnd(64, "0"), "hex");
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
  }

  /**
   * Decrypts an AES-256-GCM encrypted secret
   */
  static decrypt(ciphertextBundle: string, keyHex: string): string {
    const key = Buffer.from(keyHex.slice(0, 64).padEnd(64, "0"), "hex");
    const [ivHex, authTagHex, encryptedHex] = ciphertextBundle.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const encrypted = Buffer.from(encryptedHex, "hex");
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
  }
}
