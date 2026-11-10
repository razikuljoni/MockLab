import { Module } from "@nestjs/common";
import { MockStateService } from "./mock-state.service";
import { ScenariosService } from "./scenarios.service";
import { ScenariosController } from "./scenarios.controller";

@Module({
  providers: [MockStateService, ScenariosService],
  controllers: [ScenariosController],
  exports: [MockStateService, ScenariosService],
})
export class ScenariosModule {}
