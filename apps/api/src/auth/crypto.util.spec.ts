import { describe, it, expect } from "vitest";
import { CryptoUtil } from "./crypto.util";

describe("CryptoUtil", () => {
  it("hashes and verifies passwords correctly", () => {
    const password = "superSecretPassword123!";
    const hash = CryptoUtil.hashPassword(password);
    expect(hash).toContain(":");
    expect(CryptoUtil.verifyPassword(password, hash)).toBe(true);
    expect(CryptoUtil.verifyPassword("wrongPassword", hash)).toBe(false);
  });

  it("signs and verifies JWT tokens", () => {
    const secret = "test-secret-key-at-least-32-chars-long";
    const payload = { userId: "user-123", email: "test@mocklab.dev" };
    const token = CryptoUtil.signJwt(payload, secret, 3600);

    const verified = CryptoUtil.verifyJwt<typeof payload>(token, secret);
    expect(verified).not.toBeNull();
    expect(verified?.userId).toBe("user-123");
    expect(verified?.email).toBe("test@mocklab.dev");

    // Invalid secret
    expect(CryptoUtil.verifyJwt(token, "wrong-secret")).toBeNull();

    // Expired token
    const expiredToken = CryptoUtil.signJwt(payload, secret, -10);
    expect(CryptoUtil.verifyJwt(expiredToken, secret)).toBeNull();
  });

  it("encrypts and decrypts secrets with AES-256-GCM", () => {
    const masterKey = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
    const secret = "bearer_token_xyz_987654";
    const encrypted = CryptoUtil.encrypt(secret, masterKey);

    expect(encrypted).not.toBe(secret);
    expect(encrypted.split(":").length).toBe(3);

    const decrypted = CryptoUtil.decrypt(encrypted, masterKey);
    expect(decrypted).toBe(secret);
  });
});
