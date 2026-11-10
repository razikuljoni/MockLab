import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module";
import { HealthModule } from "./health/health.module";
import { QueueModule } from "./queue/queue.module";

@Module({
  imports: [PrismaModule, HealthModule, QueueModule],
})
export class AppModule {}
