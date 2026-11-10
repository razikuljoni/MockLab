import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { DataStoreService } from "../prisma/data-store.service";
import { ContractRunnerService } from "../contracts/contract-runner.service";
import { Verdict } from "@prisma/client";

@Injectable()
export class CiSchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CiSchedulerService.name);
  private timer: NodeJS.Timeout | null = null;
  private readonly CHECK_INTERVAL_MS = 60000; // Check every minute

  constructor(
    private readonly dataStore: DataStoreService,
    private readonly contractRunner: ContractRunnerService
  ) {}

  onModuleInit() {
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

    this.logger.log(`Executing scheduled contract run for schedule '${sched.name}'`);
    const runResult = await this.contractRunner.runSuite(sched.projectId, {
      triggeredBy: `schedule:${sched.name}`,
    });

    // Derive last verdict
    let verdict: Verdict = Verdict.PASS;
    if (runResult.results.some((r) => r.verdict === Verdict.BREAKING)) {
      verdict = Verdict.BREAKING;
    } else if (runResult.results.some((r) => r.verdict === Verdict.ERROR)) {
      verdict = Verdict.ERROR;
    } else if (runResult.results.some((r) => r.verdict === Verdict.NON_BREAKING)) {
      verdict = Verdict.NON_BREAKING;
    }

    // Schedule next run (e.g. 1 hour later)
    const nextRun = new Date(Date.now() + 3600000);

    await this.dataStore.updateContractSchedule(sched.id, {
      lastRunId: runResult.id,
      lastVerdict: verdict,
      nextRunAt: nextRun,
    });

    return {
      schedule: sched,
      run: runResult,
      verdict,
    };
  }
}
