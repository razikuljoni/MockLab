import { describe, it, expect } from "vitest";
import { SpecParserUtil } from "./spec-parser.util";

describe("SpecParserUtil", () => {
  const samplePetstoreSpec = {
    openapi: "3.0.3",
    info: { title: "Swagger Petstore", version: "1.0.0" },
    paths: {
      "/pets": {
        get: {
          summary: "List all pets",
          tags: ["Pets"],
          responses: {
            "200": {
              description: "A paged array of pets",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/Pet" },
                  },
                },
              },
            },
          },
        },
        post: {
          summary: "Create a pet",
          tags: ["Pets"],
          responses: {
            "201": {
              description: "Null response",
              content: {
                "application/json": {
                  example: { id: 101, name: "Bella", status: "available" },
                },
              },
            },
          },
        },
      },
      "/pets/{petId}": {
        get: {
          summary: "Info for a specific pet",
          tags: ["Pets"],
          responses: {
            "200": {
              description: "Expected response to a valid request",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Pet" },
                },
              },
            },
          },
        },
      },
    },
    components: {
      schemas: {
        Pet: {
          type: "object",
          required: ["id", "name"],
          properties: {
            id: { type: "integer" },
            name: { type: "string" },
            tag: { type: "string" },
          },
        },
      },
    },
  };

  it("validates and dereferences OpenAPI schemas without circular crash", () => {
    const issues = SpecParserUtil.validate(samplePetstoreSpec);
    expect(issues.length).toBe(0);

    const { dereferenced, errors } = SpecParserUtil.dereference(samplePetstoreSpec);
    expect(errors.length).toBe(0);
    expect(dereferenced.paths["/pets"].get.responses["200"].content["application/json"].schema.items.type).toBe("object");
  });

  it("reports invalid spec errors with precise JSONPath locations", () => {
    const invalidSpec = {
      openapi: "3.0.0",
      paths: {
        "no-slash-path": {
          get: {
            summary: "Missing slash and missing responses",
          },
        },
      },
    };

    const issues = SpecParserUtil.validate(invalidSpec);
    expect(issues.length).toBeGreaterThan(0);

    const pathIssue = issues.find((i) => i.path === "$.paths['no-slash-path']");
    expect(pathIssue).toBeDefined();
    expect(pathIssue?.message).toContain("must begin with a forward slash");

    const respIssue = issues.find((i) => i.path === "$.paths['no-slash-path'].get.responses");
    expect(respIssue).toBeDefined();
    expect(respIssue?.message).toContain("missing required 'responses'");
  });

  it("extracts operations and produces deterministic default mock bodies", () => {
    const { dereferenced } = SpecParserUtil.dereference(samplePetstoreSpec);
    const operations = SpecParserUtil.extractOperations(dereferenced);

    expect(operations.length).toBe(3);

    const getPets = operations.find((op) => op.operationId === "GET /pets");
    expect(getPets).toBeDefined();
    expect(getPets?.tags).toContain("Pets");
    expect(Array.isArray(getPets?.defaultResponse.body)).toBe(true);
    expect(getPets?.defaultResponse.body[0].id).toBe(42);

    const postPets = operations.find((op) => op.operationId === "POST /pets");
    expect(postPets?.defaultResponse.status).toBe(201);
    expect(postPets?.defaultResponse.body.name).toBe("Bella");
  });

  it("computes re-import diffs and protects human-edited rules", () => {
    const existingOps = ["GET /pets", "POST /pets", "DELETE /pets/{id}"];
    const newOps = ["GET /pets", "POST /pets", "GET /pets/{petId}"];
    const editedRules = [{ operationId: "GET /pets", name: "Custom status 200 with latency" }];

    const diff = SpecParserUtil.computeReimportDiff(existingOps, newOps, editedRules);

    expect(diff.added).toEqual(["GET /pets/{petId}"]);
    expect(diff.removed).toEqual(["DELETE /pets/{id}"]);
    expect(diff.changed).toEqual(["GET /pets", "POST /pets"]);
    expect(diff.conflicts.length).toBe(1);
    expect(diff.conflicts[0].operationId).toBe("GET /pets");
  });

  it("handles circular $ref loops safely without stack overflow", () => {
    const circularSpec = {
      openapi: "3.0.0",
      info: { title: "Circular Tree", version: "1.0.0" },
      paths: {
        "/tree": {
          get: {
            responses: {
              "200": {
                content: {
                  "application/json": {
                    schema: { $ref: "#/components/schemas/TreeNode" },
                  },
                },
              },
            },
          },
        },
      },
      components: {
        schemas: {
          TreeNode: {
            type: "object",
            properties: {
              id: { type: "string" },
              child: { $ref: "#/components/schemas/TreeNode" },
            },
          },
        },
      },
    };

    const { dereferenced, errors } = SpecParserUtil.dereference(circularSpec);
    expect(dereferenced).toBeDefined();
    // Warning emitted for the circular reference
    const circularWarn = errors.find((e) => e.message.includes("Circular reference detected"));
    expect(circularWarn).toBeDefined();
    expect(circularWarn?.severity).toBe("warning");
  });

  it("handles external $ref references and non-existent refs with JSONPath error reporting", () => {
    const externalRefSpec = {
      openapi: "3.0.0",
      info: { title: "External & Missing Refs", version: "1.0.0" },
      paths: {
        "/external": {
          get: {
            responses: {
              "200": {
                content: {
                  "application/json": {
                    schema: { $ref: "https://api.example.com/schemas/account.json" },
                  },
                },
              },
            },
          },
        },
        "/missing": {
          get: {
            responses: {
              "200": {
                content: {
                  "application/json": {
                    schema: { $ref: "#/components/schemas/NonExistentSchema" },
                  },
                },
              },
            },
          },
        },
      },
    };

    const { dereferenced, errors } = SpecParserUtil.dereference(externalRefSpec);
    expect(dereferenced).toBeDefined();

    // External ref warning
    const extErr = errors.find((e) => e.message.includes("External reference"));
    expect(extErr).toBeDefined();
    expect(extErr?.path).toBe("$.paths./external.get.responses.200.content.application/json.schema");

    // Missing ref error
    const missingErr = errors.find((e) => e.message.includes("Could not resolve reference"));
    expect(missingErr).toBeDefined();
    expect(missingErr?.severity).toBe("error");
    expect(missingErr?.path).toBe("$.paths./missing.get.responses.200.content.application/json.schema");
  });
});
