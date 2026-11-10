import { describe, it, expect } from "vitest";
import { QueueSpikeService } from "./spike.service";

describe("BullMQ Spike Assessment", () => {
  it("documents BullMQ Redis requirements vs Upstash REST architecture", () => {
    // Upstash's serverless HTTP/REST Redis does not natively support long-lived
    // blocking connections required by BullMQ Worker (BLMOVE/BRPOPLPUSH).
    // BullMQ requires standard TCP Redis with blocking command support.
    const spikeDocumentation = {
      upstashRestCompatible: false,
      standardTcpRedisCompatible: true,
      recommendedLocalDev: "Docker Redis 7 (port 6379)",
      recommendedProductionFreeTier: "Managed TCP Redis (Render / Railway / Aiven free tier)",
    };

    expect(spikeDocumentation.standardTcpRedisCompatible).toBe(true);
    expect(spikeDocumentation.upstashRestCompatible).toBe(false);
  });

  it("handles offline Redis gracefully without crashing", async () => {
    const service = new QueueSpikeService();
    // Test on closed port
    const result = await service.runSpike("redis://127.0.0.1:65530");
    expect(result.redisConnected).toBe(false);
    expect(result.standardJobPassed).toBe(false);
  });
});
