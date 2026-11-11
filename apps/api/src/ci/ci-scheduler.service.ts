import { Injectable, Logger, OnModuleInit, OnModuleDestroy, Optional } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { DataStoreService } from "../prisma/data-store.service";
import { ContractRunnerService } from "../contracts/contract-runner.service";
import { ProductionQueueService } from "../queue/production-queue.service";
import { EmailService } from "../notifications/email.service";
import { Verdict } from "@prisma/client";

@Injectable()
export class CiSchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CiSchedulerService.name);
  private timer: NodeJS.Timeout | null = null;
  private readonly CHECK_INTERVAL_MS = 60000;

  constructor(
    private readonly dataStore: DataStoreService,
    private readonly contractRunner: ContractRunnerService,
    @Optional() private readonly queueService?: ProductionQueueService,
    @Optional() private readonly emailService?: EmailService
  ) {}

  onModuleInit() {
    if (this.queueService) {
      this.queueService.registerContractRunProcessor(async (job) => {
        await this.executeJob(job.projectId, job.triggeredBy);
      });
    }

    this.timer = setInterval(() => {
      this.sweepDueSchedules().catch((err) =>
        this.logger.error(`Error in schedule sweeper: ${err.message}`)
      );
    }, this.CHECK_INTERVAL_MS);
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async sweepDueSchedules(): Promise<number> {
    const allProjects = Array.from((this.dataStore as any).projects.values());
    let triggeredCount = 0;

    for (const project of allProjects as any[]) {
      const schedules = await this.dataStore.listContractSchedules(project.id);
      const now = new Date();

      for (const sched of schedules) {
        if (!sched.enabled) continue;
        if (sched.nextRunAt && sched.nextRunAt <= now) {
          await this.triggerSchedule(sched.id);
          triggeredCount++;
        }
      }
    }

    return triggeredCount;
  }

  async triggerSchedule(scheduleId: string) {
    const sched = await this.dataStore.findContractScheduleById(scheduleId);
    if (!sched) return null;

    this.logger.log(`Enqueueing scheduled contract run for schedule '${sched.name}'`);

    if (this.queueService) {
      await this.queueService.enqueueContractRun({
        runId: `run_${Date.now()}`,
        projectId: sched.projectId,
        triggeredBy: `schedule:${sched.name}`,
      });
    }

    return this.executeJob(sched.projectId, `schedule:${sched.name}`, sched.id);
  }

  private async executeJob(projectId: string, triggeredBy?: string, scheduleId?: string) {
    const runResult = await this.contractRunner.runSuite(projectId, {
      triggeredBy: triggeredBy || "schedule:cron",
    });

    // Derive last verdict
    let verdict: Verdict = Verdict.PASS;
    if (runResult.results.some((r) => r.verdict === Verdict.BREAKING)) {
      verdict = Verdict.BREAKING;
      if (this.emailService) {
        const breakingResults = runResult.results.filter((r) => r.verdict === Verdict.BREAKING);
        const diffs = breakingResults.flatMap((r) =>
          r.diff?.lines?.filter((l) => l.breaking) || [{ path: "$", message: "Breaking contract failure" }]
        );
        this.emailService.sendBreakingChangeAlert({
          recipientEmail: "team-alerts@mocklab.dev",
          projectName: projectId,
          runId: runResult.id,
          triggeredBy,
          breakingDiffs: diffs,
        }).catch((err) => this.logger.error(`Failed to send breaking alert: ${err.message}`));
      }
    } else if (runResult.results.some((r) => r.verdict === Verdict.ERROR)) {
      verdict = Verdict.ERROR;
    } else if (runResult.results.some((r) => r.verdict === Verdict.NON_BREAKING)) {
      verdict = Verdict.NON_BREAKING;
    }

    if (scheduleId) {
      // Schedule next run (e.g. 1 hour later)
      const nextRun = new Date(Date.now() + 3600000);
      await this.dataStore.updateContractSchedule(scheduleId, {
        lastRunId: runResult.id,
        lastVerdict: verdict,
        nextRunAt: nextRun,
      });
    }

    return runResult;
  }
}
