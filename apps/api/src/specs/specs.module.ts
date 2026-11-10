import { Module } from "@nestjs/common";
import { SpecsService } from "./specs.service";
import { SpecsController } from "./specs.controller";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [SpecsController],
  providers: [SpecsService],
  exports: [SpecsService],
})
export class SpecsModule {}
