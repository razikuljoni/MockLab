import { describe, it, expect, beforeEach } from "vitest";
import { DataStoreService } from "../prisma/data-store.service";
import { PrismaService } from "../prisma/prisma.service";
import { ProjectsService } from "../projects/projects.service";
import { SpecsService } from "./specs.service";
import { BadRequestException } from "@nestjs/common";

describe("Phase 2 Projects & OpenAPI Import Acceptance Suite", () => {
  let dataStore: DataStoreService;
  let projectsService: ProjectsService;
  let specsService: SpecsService;
  let projectId: string;

  const validPetstoreYaml = `
openapi: 3.0.3
info:
  title: Swagger Petstore
  version: 1.0.0
paths:
  /pets:
    get:
      summary: List all pets
      tags:
        - Pets
      responses:
        '200':
          description: A paged array of pets
          content:
            application/json:
              example:
                - id: 1
                  name: Fido
                  status: available
    post:
      summary: Create a pet
      tags:
        - Pets
      responses:
        '201':
          description: Created
          content:
            application/json:
              example:
                id: 2
                name: Fluffy
  /pets/{petId}:
    get:
      summary: Info for a specific pet
      tags:
        - Pets
      responses:
        '200':
          description: Expected response
          content:
            application/json:
              example:
                id: 42
                name: Sparky
`;

  beforeEach(async () => {
    const mockPrisma = {} as PrismaService;
    dataStore = new DataStoreService(mockPrisma);
    dataStore.clear();

    projectsService = new ProjectsService(dataStore);
    specsService = new SpecsService(dataStore);

    const ws = await dataStore.createWorkspace({ name: "Test Corp", slug: "testcorp" });
    const project = await projectsService.createProject(ws.id, {
      name: "Petstore",
      slug: "petstore",
    });
    projectId = project.id;
  });

  it("Imports valid Petstore spec with zero errors, generates rules, and returns mock URL", async () => {
    const result = await specsService.importSpec(projectId, validPetstoreYaml, "https://petstore.swagger.io/v2/swagger.json");

    expect(result.version).toBe(1);
    expect(result.operationsCount).toBe(3);
    expect(result.issues.filter((i) => i.severity === "error").length).toBe(0);
    expect(result.mockUrl).toBe("https://petstore.mocklab.dev");
    expect(result.hash).toBeDefined();

    // Verify rules were generated
    const rules = await dataStore.listMockRules(projectId);
    expect(rules.length).toBe(3);
    const getPetRule = rules.find((r) => r.operationId === "GET /pets/{petId}");
    expect(getPetRule).toBeDefined();
    expect(getPetRule?.response.body.name).toBe("Sparky");

    // Verify endpoint listing
    const { endpoints, tags } = await specsService.listEndpoints(projectId);
    expect(endpoints.length).toBe(3);
    expect(tags).toContain("Pets");
  });

  it("Rejects invalid spec and pinpoints errors by JSONPath", async () => {
    const brokenSpec = JSON.stringify({
      openapi: "3.0.0",
      paths: {
        "broken-no-slash": {
          get: {
            summary: "Missing slash and missing responses",
          },
        },
      },
    });

    try {
      await specsService.importSpec(projectId, brokenSpec);
      expect.fail("Should have thrown BadRequestException");
    } catch (err: any) {
      expect(err).toBeInstanceOf(BadRequestException);
      const resp = err.getResponse();
      expect(resp.issues).toBeDefined();

      const pathIssue = resp.issues.find((i: any) => i.path === "$.paths['broken-no-slash']");
      expect(pathIssue).toBeDefined();
      expect(pathIssue.message).toContain("must begin with a forward slash");
    }
  });

  it("Protects hand-edited rules on re-import and computes operation diff", async () => {
    // 1. Initial import
    await specsService.importSpec(projectId, validPetstoreYaml);

    // 2. Mark a rule as hand-edited
    const rules = await dataStore.listMockRules(projectId);
    const petRule = rules.find((r) => r.operationId === "GET /pets")!;
    await dataStore.updateMockRule(petRule.id, {
      edited: true,
      name: "Custom Human Edited Rule",
      response: { status: 200, body: [{ id: 999, name: "Custom Dog" }] },
    });

    // 3. Re-import modified spec (added DELETE /pets/{id}, changed POST /pets)
    const modifiedSpecYaml = `
openapi: 3.0.3
paths:
  /pets:
    get:
      summary: List all pets
      responses:
        '200':
          description: List pets
    post:
      summary: Create a pet (updated)
      responses:
        '201':
          description: Created
  /pets/{id}:
    delete:
      summary: Delete pet
      responses:
        '204':
          description: Deleted
`;

    const reimportResult = await specsService.importSpec(projectId, modifiedSpecYaml);

    expect(reimportResult.version).toBe(2);
    expect(reimportResult.diff.added).toContain("DELETE /pets/{id}");
    expect(reimportResult.diff.removed).toContain("GET /pets/{petId}");
    expect(reimportResult.diff.conflicts.length).toBe(1);
    expect(reimportResult.diff.conflicts[0].operationId).toBe("GET /pets");

    // Verify hand-edited rule was NOT overwritten
    const updatedRule = await dataStore.findMockRuleById(petRule.id);
    expect(updatedRule?.edited).toBe(true);
    expect(updatedRule?.name).toBe("Custom Human Edited Rule");
    expect(updatedRule?.response.body[0].id).toBe(999);
  });
});
