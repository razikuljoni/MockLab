import { Controller, Get } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import Redis from "ioredis";

@Controller("health")
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check() {
    let dbStatus = "not_configured";
    let redisStatus = "not_configured";
    let healthy = true;

    if (process.env.DATABASE_URL) {
      try {
        await this.prisma.$queryRaw`SELECT 1`;
        dbStatus = "ok";
      } catch {
        dbStatus = "offline";
        healthy = false;
      }
    } else if (process.env.NODE_ENV === "production") {
      healthy = false;
    }

    if (process.env.REDIS_URL) {
      try {
        const client = new Redis(process.env.REDIS_URL, {
          connectTimeout: 1000,
          maxRetriesPerRequest: 1,
          lazyConnect: true,
          retryStrategy: () => null,
          enableOfflineQueue: false,
        });
        await client.connect();
        const pong = await client.ping();
        await client.quit();
        redisStatus = pong === "PONG" ? "ok" : "offline";
        if (redisStatus !== "ok") healthy = false;
      } catch {
        redisStatus = "offline";
        healthy = false;
      }
    } else if (process.env.NODE_ENV === "production") {
      healthy = false;
    }

    return {
      status: healthy ? "ok" : "degraded",
      version: "0.2.1",
      timestamp: new Date().toISOString(),
      services: {
        database: dbStatus,
        redis: redisStatus,
      },
    };
  }
}
