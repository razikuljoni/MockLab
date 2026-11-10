import { describe, it, expect, beforeEach } from "vitest";
import { DataStoreService } from "../prisma/data-store.service";
import { PrismaService } from "../prisma/prisma.service";
import { ContractRunnerService } from "./contract-runner.service";
import { ContractDiffUtil } from "./contract-diff.util";
import { MockAuth, Verdict, RunStatus } from "@prisma/client";

describe("Phase 8 Contract Tests Acceptance Suite", () => {
  let dataStore: DataStoreService;
  let contractRunner: ContractRunnerService;
  let projectId: string;

  beforeEach(async () => {
    const mockPrisma = {} as PrismaService;
    dataStore = new DataStoreService(mockPrisma);
    dataStore.clear();

    contractRunner = new ContractRunnerService(dataStore);

    const ws = await dataStore.createWorkspace({ name: "Contracts WS", slug: "contractsws" });
    const project = await dataStore.createProject({
      workspaceId: ws.id,
      name: "Petstore",
      slug: "petstore",
      mockAuth: MockAuth.PUBLIC,
    });
    projectId = project.id;

    // Seed a spec version so run links to spec hash
    await dataStore.createSpecVersion({
      projectId,
      version: 1,
      hash: "sha256_mocklab_petstore_v1",
      sourceUrl: "https://petstore.swagger.io/v2/swagger.json",
      raw: {},
      deref: {
        paths: {
          "/pets": {
            get: {
              summary: "List Pets",
              responses: {
                "200": {
                  content: {
                    "application/json": {
                      schema: {
                        type: "array",
                        items: {
                          type: "object",
                          required: ["id", "name"],
                          properties: {
                            id: { type: "string" },
                            name: { type: "string" },
                            tag: { type: "string" },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
  });

  it("1. F4 Acceptance Criteria: removed required field is flagged BREAKING (red)", () => {
    const expected = {
      id: "101",
      name: "Fido",
      tag: "dog",
    };
    // Real provider response missing required field "name"
    const actualWithRemovedField = {
      id: "101",
      tag: "dog",
    };

    const diff = ContractDiffUtil.compare(
      200,
      200,
      expected,
      actualWithRemovedField,
      {
        type: "object",
        required: ["id", "name"],
      }
    );

    expect(diff.verdict).toBe(Verdict.BREAKING);
    expect(diff.summary.removed).toBe(1);
    const removedLine = diff.lines.find((l) => l.path === "$.name");
    expect(removedLine).toBeDefined();
    expect(removedLine?.type).toBe("REMOVED");
    expect(removedLine?.breaking).toBe(true);
  });

  it("2. F4 Acceptance Criteria: added field is flagged NON-BREAKING (amber)", () => {
    const expected = {
      id: "101",
      name: "Fido",
    };
    // Real provider response added a new field "breed"
    const actualWithAddedField = {
      id: "101",
      name: "Fido",
      breed: "Golden Retriever",
    };

    const diff = ContractDiffUtil.compare(
      200,
      200,
      expected,
      actualWithAddedField,
      {
        type: "object",
        required: ["id", "name"],
      }
    );

    expect(diff.verdict).toBe(Verdict.NON_BREAKING);
    expect(diff.summary.added).toBe(1);
    const addedLine = diff.lines.find((l) => l.path === "$.breed");
    expect(addedLine).toBeDefined();
    expect(addedLine?.type).toBe("ADDED");
    expect(addedLine?.breaking).toBe(false);
  });

  it("3. F4 Acceptance Criteria: unreachable real provider is flagged ERROR (not a contract failure)", async () => {
    // Create an expectation
    await dataStore.createExpectation({
      projectId,
      operationId: "GET /pets",
      name: "List Pets Contract",
      providerState: null,
      request: { method: "GET", path: "/pets" },
      expectedStatus: 200,
      expectedSchema: { type: "object" },
      matchers: {},
      generated: true,
      enabled: true,
    });

    // Run contract suite with an unreachable provider URL
    const runResult = await contractRunner.runSuite(projectId, {
      providerUrlOverride: "unreachable",
    });

    expect(runResult.status).toBe(RunStatus.ERROR);
    expect(runResult.results.length).toBe(1);
    expect(runResult.results[0].verdict).toBe(Verdict.ERROR);
    expect(runResult.results[0].realStatus).toBeNull();
    // Verify run links to exact spec hash
    expect(runResult.specHash).toBe("sha256_mocklab_petstore_v1");
  });

  it("4. Auto-generate expectations from OpenAPI spec on import", async () => {
    const generated = await contractRunner.generateFromSpec(projectId);
    expect(generated.length).toBe(1);
    expect(generated[0].operationId).toBe("GET /pets");
    expect(generated[0].name).toBe("List Pets");
    expect(generated[0].expectedStatus).toBe(200);
    expect(generated[0].generated).toBe(true);
  });
});
