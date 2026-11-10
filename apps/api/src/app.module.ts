import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module";
import { HealthModule } from "./health/health.module";
import { QueueModule } from "./queue/queue.module";
import { AuthModule } from "./auth/auth.module";
import { WorkspacesModule } from "./workspaces/workspaces.module";
import { ProjectsModule } from "./projects/projects.module";
import { SpecsModule } from "./specs/specs.module";
import { MockModule } from "./mock/mock.module";
import { RulesModule } from "./rules/rules.module";
import { ScenariosModule } from "./scenarios/scenarios.module";
import { LogsModule } from "./logs/logs.module";

@Module({
  imports: [
    PrismaModule,
    HealthModule,
    QueueModule,
    AuthModule,
    WorkspacesModule,
    ProjectsModule,
    SpecsModule,
    MockModule,
    RulesModule,
    ScenariosModule,
    LogsModule,
  ],
})
export class AppModule {}
