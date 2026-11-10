import { Module } from "@nestjs/common";
import { MockController } from "./mock.controller";
import { MockEngineService } from "./mock-engine.service";
import { ScenariosModule } from "../scenarios/scenarios.module";

@Module({
  imports: [ScenariosModule],
  controllers: [MockController],
  providers: [MockEngineService],
  exports: [MockEngineService],
})
export class MockModule {}
