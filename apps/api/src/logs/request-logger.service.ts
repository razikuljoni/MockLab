import { Injectable, Logger, OnModuleInit, OnModuleDestroy, Optional } from "@nestjs/common";
import { DataStoreService, RequestLogRecord } from "../prisma/data-store.service";
import { ProductionQueueService } from "../queue/production-queue.service";

export interface EnqueueLogPayload {
  projectId: string;
  method: string;
  path: string;
  status: number;
  matchedRuleId?: string | null;
  nearMiss?: any;
  latencyMs: number;
  injectedMs?: number;
  requestHeaders?: Record<string, any>;
  requestBody?: any;
  responseHeaders?: Record<string, any>;
  responseBody?: any;
}

const MAX_BODY_BYTES = 100 * 1024; // 100 KB cap (§6.4)

@Injectable()
export class RequestLoggerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RequestLoggerService.name);
  private buffer: Omit<RequestLogRecord, "id" | "createdAt">[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private readonly BATCH_SIZE = 500;
  private readonly FLUSH_INTERVAL_MS = 5000;

  constructor(
    private readonly dataStore: DataStoreService,
    @Optional() private readonly queueService?: ProductionQueueService
  ) {}

  onModuleInit() {
    if (this.queueService) {
      this.queueService.registerLogBatchProcessor(async (logs) => {
        const mapped = logs.map((l) => ({
          projectId: l.projectId,
          method: l.method.toUpperCase(),
          path: l.path,
          status: l.status,
          matchedRuleId: l.matchedRuleId || null,
          nearMiss: l.nearMiss || null,
          latencyMs: l.latencyMs,
          injectedMs: l.injectedMs || 0,
          requestSize: l.requestBody ? JSON.stringify(l.requestBody).length : 0,
          responseSize: l.responseBody ? JSON.stringify(l.responseBody).length : 0,
          requestHeaders: this.redactHeaders(l.requestHeaders),
          requestBody: this.sanitizeBody(l.path, l.requestBody),
          responseHeaders: this.redactHeaders(l.responseHeaders),
          responseBody: this.capBody(l.responseBody),
        }));
        await this.dataStore.createRequestLogsBatch(mapped);
      });
    }

    this.flushTimer = setInterval(() => {
      this.flush().catch((err) => this.logger.error(`Error in periodic log flush: ${err.message}`));
    }, this.FLUSH_INTERVAL_MS);
  }

  async onModuleDestroy() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    await this.flush();
  }

  /**
   * Non-blocking hot-path enqueue: NEVER blocks mock request execution.
   */
  enqueueLog(payload: EnqueueLogPayload): void {
    const sanitizedReqHeaders = this.redactHeaders(payload.requestHeaders);
    const sanitizedReqBody = this.sanitizeBody(payload.path, payload.requestBody);
    const sanitizedResHeaders = this.redactHeaders(payload.responseHeaders);
    const sanitizedResBody = this.capBody(payload.responseBody);

    const reqSize = sanitizedReqBody ? JSON.stringify(sanitizedReqBody).length : 0;
    const resSize = sanitizedResBody ? JSON.stringify(sanitizedResBody).length : 0;

    const entry: Omit<RequestLogRecord, "id" | "createdAt"> = {
      projectId: payload.projectId,
      method: payload.method.toUpperCase(),
      path: payload.path,
      status: payload.status,
      matchedRuleId: payload.matchedRuleId || null,
      nearMiss: payload.nearMiss || null,
      latencyMs: payload.latencyMs,
      injectedMs: payload.injectedMs || 0,
      requestSize: reqSize,
      responseSize: resSize,
      requestHeaders: sanitizedReqHeaders,
      requestBody: sanitizedReqBody,
      responseHeaders: sanitizedResHeaders,
      responseBody: sanitizedResBody,
    };

    if (this.queueService) {
      this.queueService.enqueueLog(payload).catch((err) =>
        this.logger.warn(`Failed to enqueue log via queueService: ${err.message}`)
      );
    } else {
      this.buffer.push(entry);
    }

    if (this.buffer.length >= this.BATCH_SIZE) {
      // Async flush without blocking caller
      setImmediate(() => {
        this.flush().catch((err) => this.logger.error(`Batch flush failed: ${err.message}`));
      });
    }
  }

  /**
   * Flushes current buffer in one batch insert
   */
  async flush(): Promise<number> {
    if (this.buffer.length === 0) return 0;
    const batch = this.buffer.splice(0, this.buffer.length);
    try {
      const written = await this.dataStore.createRequestLogsBatch(batch);
      return written;
    } catch (err: any) {
      this.logger.error(`Failed to flush batch of ${batch.length} logs: ${err.message}`);
      return 0;
    }
  }

  getBufferSize(): number {
    return this.buffer.length;
  }

  // ── Redaction and Capping Utilities (§6.4) ──

  private redactHeaders(headers?: Record<string, any>): Record<string, string> {
    if (!headers) return {};
    const sanitized: Record<string, string> = {};
    const sensitiveKeys = new Set(["authorization", "x-mocklab-key", "cookie", "set-cookie", "x-api-key"]);

    for (const [k, v] of Object.entries(headers)) {
      const lower = k.toLowerCase();
      if (sensitiveKeys.has(lower)) {
        sanitized[k] = "[REDACTED]";
      } else {
        sanitized[k] = String(v);
      }
    }
    return sanitized;
  }

  private sanitizeBody(path: string, body: any): any {
    if (!body || typeof body !== "object") return this.capBody(body);

    const isAuthEndpoint = /(login|signup|auth|token)/i.test(path);
    if (!isAuthEndpoint) return this.capBody(body);

    // Deep redact password/secret fields
    const clone = JSON.parse(JSON.stringify(body));
    const sensitiveFields = new Set(["password", "secret", "token", "refreshtoken", "accesstoken"]);

    const redact = (obj: any) => {
      if (!obj || typeof obj !== "object") return;
      for (const [k, v] of Object.entries(obj)) {
        if (sensitiveFields.has(k.toLowerCase())) {
          obj[k] = "[REDACTED]";
        } else if (typeof v === "object") {
          redact(v);
        }
      }
    };

    redact(clone);
    return this.capBody(clone);
  }

  private capBody(body: any): any {
    if (body === undefined || body === null) return body;
    const serialized = typeof body === "string" ? body : JSON.stringify(body);
    if (serialized.length <= MAX_BODY_BYTES) {
      return body;
    }

    return {
      _truncated: true,
      _originalBytes: serialized.length,
      _capBytes: MAX_BODY_BYTES,
      _note: "Body exceeded 100 KB cap and was truncated for scale honesty (§6.4).",
      preview: serialized.slice(0, 1024) + "... [truncated]",
    };
  }
}
