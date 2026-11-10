import { Injectable, NotFoundException } from "@nestjs/common";
import { DataStoreService } from "../prisma/data-store.service";
import { MockStateService, ScenarioDefinition } from "./mock-state.service";

@Injectable()
export class ScenariosService {
  constructor(
    private readonly dataStore: DataStoreService,
    private readonly mockState: MockStateService
  ) {}

  async getOverview(projectId: string, scenarioKey = "default") {
    const project = await this.dataStore.findProjectById(projectId);
    if (!project) throw new NotFoundException("Project not found");

    const buckets = await this.mockState.listBuckets(projectId, scenarioKey);
    const orderScenario = await this.mockState.getScenario(projectId, scenarioKey, "order-lifecycle");
    const transitionLogs = this.mockState.getTransitionLogs(projectId, scenarioKey, 30);

    return {
      projectId,
      scenarioKey,
      buckets,
      scenarios: orderScenario ? [orderScenario] : [],
      transitionLogs,
      redisActive: this.mockState.isRedisActive,
    };
  }

  async listBucketItems(projectId: string, resource: string, scenarioKey = "default", search?: string) {
    const project = await this.dataStore.findProjectById(projectId);
    if (!project) throw new NotFoundException("Project not found");

    const items = await this.mockState.listItems(projectId, scenarioKey, resource, search);
    return {
      projectId,
      scenarioKey,
      resource,
      count: items.length,
      items,
    };
  }

  async deleteBucketItem(projectId: string, resource: string, itemId: string, scenarioKey = "default") {
    const project = await this.dataStore.findProjectById(projectId);
    if (!project) throw new NotFoundException("Project not found");

    const deleted = await this.mockState.deleteItem(projectId, scenarioKey, resource, itemId);
    if (!deleted) {
      throw new NotFoundException(`Item '${itemId}' not found in bucket '${resource}'`);
    }

    return { success: true, itemId, resource };
  }

  async resetProjectState(projectId: string, scenarioKey?: string) {
    const project = await this.dataStore.findProjectById(projectId);
    if (!project) throw new NotFoundException("Project not found");

    const result = await this.mockState.resetState(projectId, scenarioKey);
    return {
      success: true,
      projectId,
      scenarioKey: scenarioKey || "all",
      cleared: result.cleared,
    };
  }

  async applyTemplate(
    projectId: string,
    scenarioKey: string,
    template: "orders" | "crud" | "auth",
    resource?: string
  ) {
    const project = await this.dataStore.findProjectById(projectId);
    if (!project) throw new NotFoundException("Project not found");

    return this.mockState.applyTemplate(projectId, scenarioKey, template, resource);
  }

  async transitionScenarioState(
    projectId: string,
    scenarioKey: string,
    scenarioName: string,
    toState: string,
    trigger?: string
  ): Promise<ScenarioDefinition | null> {
    const project = await this.dataStore.findProjectById(projectId);
    if (!project) throw new NotFoundException("Project not found");

    return this.mockState.transitionScenario(projectId, scenarioKey, scenarioName, toState, trigger);
  }
}
