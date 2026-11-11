import { Module } from "@nestjs/common";
import { QueueSpikeService } from "./spike.service";
import { ProductionQueueService } from "./production-queue.service";

@Module({
  providers: [QueueSpikeService, ProductionQueueService],
  exports: [QueueSpikeService, ProductionQueueService],
})
export class QueueModule {}
