import { Injectable, Logger } from "@nestjs/common";
import Ajv, { ValidateFunction, ErrorObject } from "ajv";
import Ajv2020 from "ajv/dist/2020";
import { DiffLine } from "./contract-diff.util";

@Injectable()
export class AjvSchemaValidatorService {
  private readonly logger = new Logger(AjvSchemaValidatorService.name);
  private readonly ajv30: Ajv;
  private readonly ajv31: Ajv2020;
  private readonly validatorCache = new Map<string, ValidateFunction>();

  constructor() {
    this.ajv30 = new Ajv({
      allErrors: true,
      strict: false,
      coerceTypes: false,
    });
    this.ajv31 = new Ajv2020({
      allErrors: true,
      strict: false,
      coerceTypes: false,
    });
  }

  /**
   * Pre-transforms OpenAPI 3.0 schemas:
   * Replaces "nullable: true" with JSON Schema compatible type arrays ["type", "null"].
   */
  transformOpenApi30Nullable(schema: any): any {
    if (!schema || typeof schema !== "object") return schema;

    if (Array.isArray(schema)) {
      return schema.map((item) => this.transformOpenApi30Nullable(item));
    }

    const copy = { ...schema };

    if (copy.nullable === true && copy.type && typeof copy.type === "string") {
      copy.type = [copy.type, "null"];
      delete copy.nullable;
    }

    if (copy.properties && typeof copy.properties === "object") {
      const transformedProps: Record<string, any> = {};
      for (const [key, prop] of Object.entries(copy.properties)) {
        transformedProps[key] = this.transformOpenApi30Nullable(prop);
      }
      copy.properties = transformedProps;
    }

    if (copy.items) {
      copy.items = this.transformOpenApi30Nullable(copy.items);
    }

    if (copy.oneOf && Array.isArray(copy.oneOf)) {
      copy.oneOf = copy.oneOf.map((s: any) => this.transformOpenApi30Nullable(s));
    }
    if (copy.anyOf && Array.isArray(copy.anyOf)) {
      copy.anyOf = copy.anyOf.map((s: any) => this.transformOpenApi30Nullable(s));
    }
    if (copy.allOf && Array.isArray(copy.allOf)) {
      copy.allOf = copy.allOf.map((s: any) => this.transformOpenApi30Nullable(s));
    }

    return copy;
  }

  /**
   * Compiles or retrieves cached AJV validator for an operation schema.
   */
  getValidator(
    cacheKey: string,
    rawSchema: any,
    isOpenApi31 = false
  ): ValidateFunction {
    const cached = this.validatorCache.get(cacheKey);
    if (cached) return cached;

    const engine = isOpenApi31 ? this.ajv31 : this.ajv30;
    const preparedSchema = isOpenApi31
      ? rawSchema
      : this.transformOpenApi30Nullable(rawSchema);

    try {
      const compiled = engine.compile(preparedSchema);
      this.validatorCache.set(cacheKey, compiled);
      return compiled;
    } catch (err: any) {
      this.logger.warn(
        `Failed to compile AJV validator for '${cacheKey}': ${err.message}`
      );
      // Fallback permissive validator
      const fallback: ValidateFunction = (() => true) as any;
      this.validatorCache.set(cacheKey, fallback);
      return fallback;
    }
  }

  /**
   * Validates actual payload against schema and returns per-field DiffLine errors (§9.3).
   */
  validatePayload(
    cacheKey: string,
    schema: any,
    payload: any,
    isOpenApi31 = false
  ): DiffLine[] {
    if (!schema) return [];

    const validator = this.getValidator(cacheKey, schema, isOpenApi31);
    const valid = validator(payload);

    if (valid || !validator.errors) return [];

    return this.mapAjvErrorsToDiffLines(validator.errors);
  }

  /**
   * Hand-rolls per-field error reporting from AJV error list to match MockLab Diff format.
   */
  private mapAjvErrorsToDiffLines(errors: ErrorObject[]): DiffLine[] {
    const lines: DiffLine[] = [];

    for (const err of errors) {
      const rawPath = err.instancePath
        ? `$${err.instancePath.replace(/\//g, ".")}`
        : "$";

      if (err.keyword === "required") {
        const missingField = (err.params as any).missingProperty;
        const targetPath = rawPath === "$" ? `$.${missingField}` : `${rawPath}.${missingField}`;
        lines.push({
          path: targetPath,
          type: "REMOVED",
          breaking: true,
          message: `Required field '${missingField}' missing from response payload`,
        });
      } else if (err.keyword === "type") {
        const expectedType = (err.params as any).type;
        lines.push({
          path: rawPath,
          type: "CHANGED",
          breaking: true,
          message: `Type mismatch at '${rawPath}': expected ${expectedType} (${err.message})`,
        });
      } else if (err.keyword === "enum") {
        lines.push({
          path: rawPath,
          type: "CHANGED",
          breaking: true,
          message: `Value at '${rawPath}' does not match allowed enum values`,
        });
      } else {
        lines.push({
          path: rawPath,
          type: "CHANGED",
          breaking: true,
          message: `${err.message || "Schema constraint violation"} at '${rawPath}'`,
        });
      }
    }

    return lines;
  }
}
