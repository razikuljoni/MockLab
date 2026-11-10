import { Module } from "@nestjs/common";
import { RequestLoggerService } from "./request-logger.service";
import { LogsService } from "./logs.service";
import { LogsController } from "./logs.controller";

@Module({
  providers: [RequestLoggerService, LogsService],
  controllers: [LogsController],
  exports: [RequestLoggerService, LogsService],
})
export class LogsModule {}
