import { Module } from "@nestjs/common";
import { ContractRunnerService } from "./contract-runner.service";
import { ContractsController } from "./contracts.controller";
import { AjvSchemaValidatorService } from "./ajv-schema-validator.service";

@Module({
  providers: [ContractRunnerService, AjvSchemaValidatorService],
  controllers: [ContractsController],
  exports: [ContractRunnerService, AjvSchemaValidatorService],
})
export class ContractsModule {}
