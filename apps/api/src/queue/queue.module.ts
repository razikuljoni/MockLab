import { Module } from "@nestjs/common";
import { QueueSpikeService } from "./spike.service";

@Module({
  providers: [QueueSpikeService],
  exports: [QueueSpikeService],
})
export class QueueModule {}
