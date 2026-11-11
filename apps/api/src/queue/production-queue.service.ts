import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { Queue, Worker, Job } from "bullmq";
import Redis from "ioredis";
import { EnqueueLogPayload } from "../logs/request-logger.service";

export interface ContractRunJobPayload {
  runId: string;
  projectId: string;
  triggeredBy?: string;
  providerUrlOverride?: string;
  providerAuthOverride?: string;
}

@Injectable()
export class ProductionQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ProductionQueueService.name);
  private connection: Redis | null = null;
  private logQueue: Queue | null = null;
  private runQueue: Queue | null = null;
  private dlqQueue: Queue | null = null;
  private logWorker: Worker | null = null;
  private runWorker: Worker | null = null;
  private isRedisAvailable = false;

  // In-memory fallback buffers if Redis is offline
  private readonly inMemoryLogBuffer: EnqueueLogPayload[] = [];
  private logBatchProcessor: ((logs: EnqueueLogPayload[]) => Promise<void>) | null = null;
  private contractRunProcessor: ((job: ContractRunJobPayload) => Promise<void>) | null = null;

  async onModuleInit() {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      this.logger.log("REDIS_URL not configured. Operating queues in robust in-memory fallback mode.");
      return;
    }

    try {
      this.connection = new Redis(redisUrl, {
        maxRetriesPerRequest: null,
        connectTimeout: 2000,
        retryStrategy: () => null,
      });

      await this.connection.ping();
      this.isRedisAvailable = true;

      this.logQueue = new Queue("mocklab-request-logs", { connection: this.connection });
      this.runQueue = new Queue("mocklab-contract-runs", {
        connection: this.connection,
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: "exponential", delay: 1000 },
          removeOnComplete: true,
        },
      });
      this.dlqQueue = new Queue("mocklab-contract-runs-dlq", { connection: this.connection });

      this.logger.log("BullMQ production queues initialized with Redis connection.");
    } catch (err: any) {
      this.logger.warn(`Redis connection failed (${err.message}). Using resilient in-memory queues.`);
      this.isRedisAvailable = false;
    }
  }

  async onModuleDestroy() {
    try {
      if (this.logWorker) await this.logWorker.close();
      if (this.runWorker) await this.runWorker.close();
      if (this.logQueue) await this.logQueue.close();
      if (this.runQueue) await this.runQueue.close();
      if (this.dlqQueue) await this.dlqQueue.close();
      if (this.connection) this.connection.disconnect();
    } catch {}
  }

  registerLogBatchProcessor(handler: (logs: EnqueueLogPayload[]) => Promise<void>) {
    this.logBatchProcessor = handler;

    if (this.isRedisAvailable && this.connection) {
      this.logWorker = new Worker(
        "mocklab-request-logs",
        async (job: Job<{ log: EnqueueLogPayload }>) => {
          if (this.logBatchProcessor) {
            await this.logBatchProcessor([job.data.log]);
          }
        },
        { connection: this.connection }
      );
    }
  }

  registerContractRunProcessor(handler: (job: ContractRunJobPayload) => Promise<void>) {
    this.contractRunProcessor = handler;

    if (this.isRedisAvailable && this.connection) {
      this.runWorker = new Worker(
        "mocklab-contract-runs",
        async (job: Job<ContractRunJobPayload>) => {
          try {
            await handler(job.data);
          } catch (err: any) {
            if (job.attemptsMade >= 3 && this.dlqQueue) {
              await this.dlqQueue.add("failed-run", {
                ...job.data,
                error: err.message,
                failedAt: new Date().toISOString(),
              });
            }
            throw err;
          }
        },
        { connection: this.connection }
      );
    }
  }

  async enqueueLog(payload: EnqueueLogPayload): Promise<void> {
    if (this.isRedisAvailable && this.logQueue) {
      try {
        await this.logQueue.add("log", { log: payload });
        return;
      } catch (err: any) {
        this.logger.warn(`Failed to push to BullMQ log queue, falling back: ${err.message}`);
      }
    }

    // In-memory fallback
    this.inMemoryLogBuffer.push(payload);
    if (this.inMemoryLogBuffer.length >= 500 && this.logBatchProcessor) {
      const batch = this.inMemoryLogBuffer.splice(0, 500);
      await this.logBatchProcessor(batch);
    }
  }

  async flushInMemoryLogs(): Promise<void> {
    if (this.inMemoryLogBuffer.length > 0 && this.logBatchProcessor) {
      const batch = this.inMemoryLogBuffer.splice(0, this.inMemoryLogBuffer.length);
      await this.logBatchProcessor(batch);
    }
  }

  async enqueueContractRun(payload: ContractRunJobPayload): Promise<void> {
    if (this.isRedisAvailable && this.runQueue) {
      try {
        await this.runQueue.add("contract-run", payload);
        return;
      } catch (err: any) {
        this.logger.warn(`Failed to push to BullMQ contract-run queue: ${err.message}`);
      }
    }

    // In-memory async fallback execution
    if (this.contractRunProcessor) {
      setImmediate(() => {
        this.contractRunProcessor!(payload).catch((err) =>
          this.logger.error(`Error in async contract run worker fallback: ${err.message}`)
        );
      });
    }
  }

  isRedisConnected(): boolean {
    return this.isRedisAvailable;
  }
}
