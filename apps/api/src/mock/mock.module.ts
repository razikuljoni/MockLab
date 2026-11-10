import { Module } from "@nestjs/common";
import { MockController } from "./mock.controller";
import { MockEngineService } from "./mock-engine.service";

@Module({
  controllers: [MockController],
  providers: [MockEngineService],
  exports: [MockEngineService],
})
export class MockModule {}
