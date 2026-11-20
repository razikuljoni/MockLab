import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { EmailService } from "./email.service";

describe("EmailService & Fail-Closed Secrets Verification", () => {
  let emailService: EmailService;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    emailService = new EmailService();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns false and logs warning when RESEND_API_KEY is unset", async () => {
    delete process.env.RESEND_API_KEY;

    const result = await emailService.sendBreakingChangeAlert({
      recipientEmail: "developer@example.com",
      projectName: "Petstore",
      runId: "run_test_123",
      breakingDiffs: [{ path: "$.name", message: "Missing required property" }],
    });

    expect(result).toBe(false);
  });

  it("attempts to send email via Resend when RESEND_API_KEY is configured", async () => {
    process.env.RESEND_API_KEY = "re_test_key_mock";

    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: "email_123" }) });
    vi.stubGlobal("fetch", fetchMock);

    const result = await emailService.sendBreakingChangeAlert({
      recipientEmail: "developer@example.com",
      projectName: "Petstore",
      runId: "run_test_123",
      breakingDiffs: [{ path: "$.name", message: "Missing required property" }],
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.resend.com/emails",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer re_test_key_mock",
        }),
      })
    );
    expect(result).toBe(true);

    vi.unstubAllGlobals();
  });
});
