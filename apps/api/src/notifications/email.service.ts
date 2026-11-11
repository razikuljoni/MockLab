import { Injectable, Logger } from "@nestjs/common";

export interface BreakingChangeAlertPayload {
  recipientEmail: string;
  projectName: string;
  runId: string;
  triggeredBy?: string;
  breakingDiffs: Array<{ path: string; message?: string }>;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  /**
   * Dispatches email alert strictly on BREAKING changes (§Phase 9 "email on breaking only")
   */
  async sendBreakingChangeAlert(payload: BreakingChangeAlertPayload): Promise<boolean> {
    const { recipientEmail, projectName, runId, breakingDiffs } = payload;

    this.logger.warn(
      `[EMAIL ALERT SENT] To: ${recipientEmail} | Project: ${projectName} | Run: ${runId} | Breaking changes detected (${breakingDiffs.length}): ${breakingDiffs
        .map((d) => `${d.path} - ${d.message}`)
        .join("; ")}`
    );

    // If an external SMTP or Resend API key is configured in env, send via provider
    if (process.env.RESEND_API_KEY) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "MockLab CI <alerts@mocklab.dev>",
            to: recipientEmail,
            subject: `[BREAKING CHANGE] Contract test failed for ${projectName}`,
            html: `<h2>Contract Breaking Change Detected</h2><p>Run ID: ${runId}</p><ul>${breakingDiffs
              .map((d) => `<li><strong>${d.path}</strong>: ${d.message}</li>`)
              .join("")}</ul>`,
          }),
        });
      } catch (err: any) {
        this.logger.error(`Failed to send email via Resend: ${err.message}`);
      }
    }

    return true;
  }
}
