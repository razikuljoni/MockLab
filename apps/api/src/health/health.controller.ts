import { Controller, Get } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Controller("health")
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check() {
    let dbStatus = "unknown";
    try {
      if (process.env.DATABASE_URL) {
        await this.prisma.$queryRaw`SELECT 1`;
        dbStatus = "ok";
      } else {
        dbStatus = "not_configured";
      }
    } catch {
      dbStatus = "offline";
    }

    return {
      status: "ok",
      version: "0.1.0",
      timestamp: new Date().toISOString(),
      services: {
        database: dbStatus,
        redis: process.env.REDIS_URL ? "configured" : "not_configured",
      },
    };
  }
}
