import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    // Only connect if DATABASE_URL is configured
    if (process.env.DATABASE_URL) {
      try {
        await this.$connect();
      } catch (err) {
        console.warn("Prisma connection deferred (database offline during initial startup):", (err as Error).message);
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
