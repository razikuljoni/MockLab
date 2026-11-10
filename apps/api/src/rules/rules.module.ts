import { Module } from "@nestjs/common";
import { RulesService } from "./rules.service";
import { RulesController } from "./rules.controller";
import { AuthModule } from "../auth/auth.module";
import { MockModule } from "../mock/mock.module";

@Module({
  imports: [AuthModule, MockModule],
  controllers: [RulesController],
  providers: [RulesService],
  exports: [RulesService],
})
export class RulesModule {}
