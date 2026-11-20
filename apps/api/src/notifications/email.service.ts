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

    if (!process.env.RESEND_API_KEY) {
      this.logger.warn(
        `[NO EMAIL PROVIDER CONFIGURED] Resend API key not set — breaking alert for run ${runId} (${projectName}) not sent.`
      );
      return false;
    }

    this.logger.log(
      `[EMAIL ALERT DISPATCHING] To: ${recipientEmail} | Project: ${projectName} | Run: ${runId}`
    );

    try {
      const res = await fetch("https://api.resend.com/emails", {
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
      return res.ok;
    } catch (err: any) {
      this.logger.error(`Failed to send email via Resend: ${err.message}`);
      return false;
    }
  }
}
