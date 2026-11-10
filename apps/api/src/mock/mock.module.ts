import { Module } from "@nestjs/common";
import { MockController } from "./mock.controller";
import { MockEngineService } from "./mock-engine.service";
import { ScenariosModule } from "../scenarios/scenarios.module";
import { LogsModule } from "../logs/logs.module";
import { ApiKeysModule } from "../keys/api-keys.module";

@Module({
  imports: [ScenariosModule, LogsModule, ApiKeysModule],
  controllers: [MockController],
  providers: [MockEngineService],
  exports: [MockEngineService],
})
export class MockModule {}
