import { Module } from "@nestjs/common";
import { ContractRunnerService } from "./contract-runner.service";
import { ContractsController } from "./contracts.controller";

@Module({
  providers: [ContractRunnerService],
  controllers: [ContractsController],
  exports: [ContractRunnerService],
})
export class ContractsModule {}
