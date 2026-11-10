import { Module } from "@nestjs/common";
import { MockController } from "./mock.controller";
import { MockEngineService } from "./mock-engine.service";
import { ScenariosModule } from "../scenarios/scenarios.module";
import { LogsModule } from "../logs/logs.module";

@Module({
  imports: [ScenariosModule, LogsModule],
  controllers: [MockController],
  providers: [MockEngineService],
  exports: [MockEngineService],
})
export class MockModule {}
