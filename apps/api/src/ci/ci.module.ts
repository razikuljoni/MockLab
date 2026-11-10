import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { CiSchedulerService } from "./ci-scheduler.service";
import { CiController } from "./ci.controller";
import { ContractsModule } from "../contracts/contracts.module";

@Module({
  imports: [ScheduleModule.forRoot(), ContractsModule],
  providers: [CiSchedulerService],
  controllers: [CiController],
  exports: [CiSchedulerService],
})
export class CiModule {}
