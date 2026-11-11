import { describe, it, expect, beforeEach } from "vitest";
import { AjvSchemaValidatorService } from "./ajv-schema-validator.service";

describe("AjvSchemaValidatorService", () => {
  let service: AjvSchemaValidatorService;

  beforeEach(() => {
    service = new AjvSchemaValidatorService();
  });

  it("validates OpenAPI 3.0 schema with nullable fields", () => {
    const schema = {
      type: "object",
      required: ["id", "name"],
      properties: {
        id: { type: "integer" },
        name: { type: "string" },
        bio: { type: "string", nullable: true },
      },
    };

    // Valid with null bio
    const errors1 = service.validatePayload("test:user:1", schema, {
      id: 1,
      name: "Alice",
      bio: null,
    });
    expect(errors1).toHaveLength(0);

    // Invalid missing required name
    const errors2 = service.validatePayload("test:user:2", schema, {
      id: 1,
      bio: "Engineer",
    });
    expect(errors2).toHaveLength(1);
    expect(errors2[0].breaking).toBe(true);
    expect(errors2[0].path).toBe("$.name");
    expect(errors2[0].type).toBe("REMOVED");

    // Invalid type mismatch
    const errors3 = service.validatePayload("test:user:3", schema, {
      id: "not-an-integer",
      name: "Alice",
    });
    expect(errors3).toHaveLength(1);
    expect(errors3[0].breaking).toBe(true);
    expect(errors3[0].path).toBe("$.id");
    expect(errors3[0].type).toBe("CHANGED");
  });

  it("validates OpenAPI 3.1 2020-12 schema", () => {
    const schema31 = {
      $schema: "https://json-schema.org/draft/2020-12/schema",
      type: "object",
      properties: {
        email: { type: "string" },
        tags: { type: "array", prefixItems: [{ type: "string" }] },
      },
      required: ["email"],
    };

    const errors = service.validatePayload("test:31:1", schema31, { email: 12345 }, true);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].breaking).toBe(true);
  });
});
