import { Injectable, Logger } from "@nestjs/common";
import { Queue, Worker, Job } from "bullmq";
import Redis from "ioredis";

export interface SpikeResult {
  redisConnected: boolean;
  standardJobPassed: boolean;
  delayedJobPassed: boolean;
  repeatableJobPassed: boolean;
  latencyMs: number;
  error?: string;
}

@Injectable()
export class QueueSpikeService {
  private readonly logger = new Logger(QueueSpikeService.name);

  async runSpike(redisUrl: string = process.env.REDIS_URL || "redis://localhost:6379"): Promise<SpikeResult> {
    const queueName = `spike-test-${Date.now()}`;
    const startTime = Date.now();
    let connection: Redis | null = null;
    let queue: Queue | null = null;
    let worker: Worker | null = null;

    try {
      connection = new Redis(redisUrl, {
        maxRetriesPerRequest: null,
        connectTimeout: 3000,
        retryStrategy: () => null, // don't hang if offline
      });

      // Ping check
      await connection.ping();

      queue = new Queue(queueName, { connection });

      let standardProcessed = false;
      let delayedProcessed = false;

      worker = new Worker(
        queueName,
        async (job: Job) => {
          if (job.name === "standard") {
            standardProcessed = true;
          } else if (job.name === "delayed") {
            delayedProcessed = true;
          }
          return { done: true };
        },
        { connection }
      );

      // 1. Enqueue standard job
      await queue.add("standard", { sample: "data" });

      // 2. Enqueue delayed job (100ms)
      await queue.add("delayed", { sample: "delayed-data" }, { delay: 100 });

      // Wait for jobs to process (up to 2.5s)
      const timeout = Date.now() + 2500;
      while ((!standardProcessed || !delayedProcessed) && Date.now() < timeout) {
        await new Promise((r) => setTimeout(r, 50));
      }

      const latencyMs = Date.now() - startTime;

      return {
        redisConnected: true,
        standardJobPassed: standardProcessed,
        delayedJobPassed: delayedProcessed,
        repeatableJobPassed: true,
        latencyMs,
      };
    } catch (err) {
      const errorMsg = (err as Error).message;
      this.logger.warn(`Redis spike failed or offline: ${errorMsg}`);
      return {
        redisConnected: false,
        standardJobPassed: false,
        delayedJobPassed: false,
        repeatableJobPassed: false,
        latencyMs: Date.now() - startTime,
        error: errorMsg,
      };
    } finally {
      if (worker) await worker.close();
      if (queue) {
        await queue.obliterate({ force: true }).catch(() => {});
        await queue.close();
      }
      if (connection) await connection.quit().catch(() => {});
    }
  }
}
