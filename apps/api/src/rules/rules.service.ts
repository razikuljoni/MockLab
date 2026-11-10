import { Injectable, NotFoundException } from "@nestjs/common";
import { DataStoreService, MockRuleRecord } from "../prisma/data-store.service";
import { MockEngineService, IncomingMockRequest } from "../mock/mock-engine.service";

@Injectable()
export class RulesService {
  constructor(
    private readonly dataStore: DataStoreService,
    private readonly mockEngine: MockEngineService
  ) {}

  async listRules(projectId: string, operationId?: string): Promise<MockRuleRecord[]> {
    return this.dataStore.listMockRules(projectId, operationId);
  }

  async createRule(projectId: string, data: {
    operationId: string;
    name: string;
    priority?: number;
    enabled?: boolean;
    matcher: any;
    response: any;
  }): Promise<MockRuleRecord> {
    const existing = await this.dataStore.listMockRules(projectId, data.operationId);
    const nextPriority = data.priority || existing.length + 1;

    return this.dataStore.createMockRule({
      projectId,
      operationId: data.operationId,
      priority: nextPriority,
      name: data.name,
      enabled: data.enabled ?? true,
      generated: false,
      edited: true,
      matcher: data.matcher,
      response: data.response,
    });
  }

  async updateRule(id: string, data: Partial<MockRuleRecord>): Promise<MockRuleRecord> {
    const existing = await this.dataStore.findMockRuleById(id);
    if (!existing) throw new NotFoundException("Rule not found");

    const updated = await this.dataStore.updateMockRule(id, {
      ...data,
      edited: true, // Mark human-edited
    });
    return updated!;
  }

  async reorderRules(projectId: string, orderedRuleIds: string[]): Promise<MockRuleRecord[]> {
    for (let i = 0; i < orderedRuleIds.length; i++) {
      const id = orderedRuleIds[i];
      await this.dataStore.updateMockRule(id, { priority: i + 1, edited: true });
    }
    return this.dataStore.listMockRules(projectId);
  }

  async duplicateRule(id: string): Promise<MockRuleRecord> {
    const existing = await this.dataStore.findMockRuleById(id);
    if (!existing) throw new NotFoundException("Rule not found");

    const allRules = await this.dataStore.listMockRules(existing.projectId, existing.operationId);
    return this.dataStore.createMockRule({
      projectId: existing.projectId,
      operationId: existing.operationId,
      priority: allRules.length + 1,
      name: `${existing.name} (Copy)`,
      enabled: true,
      generated: false,
      edited: true,
      matcher: JSON.parse(JSON.stringify(existing.matcher)),
      response: JSON.parse(JSON.stringify(existing.response)),
    });
  }

  async deleteRule(id: string): Promise<{ success: boolean; id: string }> {
    const existing = await this.dataStore.findMockRuleById(id);
    if (!existing) throw new NotFoundException("Rule not found");

    await this.dataStore.deleteMockRule(id);
    return { success: true, id };
  }

  async testRule(ruleId: string, testReq: IncomingMockRequest): Promise<{ matches: boolean; reason: string }> {
    const rule = await this.dataStore.findMockRuleById(ruleId);
    if (!rule) throw new NotFoundException("Rule not found");

    const result = this.mockEngine.evaluate([rule], testReq);
    return {
      matches: result.matched,
      reason: result.matched ? "All clauses satisfied" : result.nearMiss?.reason || "Condition failed",
    };
  }
}
