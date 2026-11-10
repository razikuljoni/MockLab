import * as crypto from "node:crypto";

export interface ParsedOperation {
  operationId: string; // stable identifier e.g. "GET /pets/{id}"
  method: string;
  path: string;
  summary: string;
  tags: string[];
  parameters: Array<{ name: string; in: string; required?: boolean; schema?: any }>;
  requestBody?: { required?: boolean; schema?: any };
  responses: Record<string, { description: string; schema?: any; example?: any }>;
  defaultResponse: {
    status: number;
    headers: Record<string, string>;
    body: any;
  };
}

export interface SpecValidationIssue {
  path: string; // JSONPath e.g. "$.paths['/pets'].get.responses['200']"
  message: string;
  severity: "error" | "warning";
}

export interface ReimportDiff {
  added: string[];
  changed: string[];
  removed: string[];
  conflicts: Array<{ operationId: string; ruleName: string; reason: string }>;
}

export class SpecParserUtil {
  /**
   * Computes sha256 hash of raw spec string
   */
  static computeHash(rawSpec: string): string {
    return crypto.createHash("sha256").update(rawSpec.trim()).digest("hex");
  }

  /**
   * Simple YAML to JSON converter for OpenAPI YAML documents without external binary dependencies
   */
  static parseYamlOrJson(input: string): { data: any; error?: SpecValidationIssue } {
    const trimmed = input.trim();
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        return { data: JSON.parse(trimmed) };
      } catch (err: any) {
        return {
          data: null,
          error: {
            path: "$",
            message: `Invalid JSON syntax: ${err.message}`,
            severity: "error",
          },
        };
      }
    }

    // Parse YAML using line-by-line hierarchy parser
    try {
      const parsed = this.parseSimpleYaml(trimmed);
      return { data: parsed };
    } catch (err: any) {
      return {
        data: null,
        error: {
          path: "$",
          message: `Invalid YAML syntax: ${err.message}`,
          severity: "error",
        },
      };
    }
  }

  private static parseSimpleYaml(yamlStr: string): any {
    const lines = yamlStr.split("\n");
    const root: any = {};
    const stack: { indent: number; obj: any; key?: string }[] = [{ indent: -1, obj: root }];

    for (let line of lines) {
      const commentIdx = line.indexOf("#");
      if (commentIdx !== -1) line = line.substring(0, commentIdx);
      if (!line.trim()) continue;

      const indent = line.search(/\S/);
      const content = line.trim();

      while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
        stack.pop();
      }

      const parent = stack[stack.length - 1].obj;

      if (content.startsWith("- ")) {
        // Array item
        const itemVal = content.substring(2).trim();
        const arrayParent = Array.isArray(parent) ? parent : [];
        if (!Array.isArray(parent) && stack[stack.length - 1].key) {
          const key = stack[stack.length - 1].key!;
          stack[stack.length - 2].obj[key] = arrayParent;
          stack[stack.length - 1].obj = arrayParent;
        }

        if (itemVal.includes(": ")) {
          const [k, ...v] = itemVal.split(": ");
          const objItem: any = { [k.trim()]: this.parseYamlValue(v.join(": ")) };
          arrayParent.push(objItem);
          stack.push({ indent, obj: objItem });
        } else {
          arrayParent.push(this.parseYamlValue(itemVal));
        }
      } else if (content.includes(":")) {
        const colonIdx = content.indexOf(":");
        const key = content.substring(0, colonIdx).trim().replace(/^['"]|['"]$/g, "");
        const rest = content.substring(colonIdx + 1).trim();

        if (rest === "" || rest === "|" || rest === ">") {
          const newObj: any = {};
          parent[key] = newObj;
          stack.push({ indent, obj: newObj, key });
        } else {
          parent[key] = this.parseYamlValue(rest);
        }
      }
    }

    return root;
  }

  private static parseYamlValue(val: string): any {
    const clean = val.trim();
    if (clean === "true" || clean === "yes") return true;
    if (clean === "false" || clean === "no") return false;
    if (clean === "null" || clean === "~") return null;
    if (!isNaN(Number(clean)) && clean !== "") return Number(clean);
    return clean.replace(/^['"]|['"]$/g, "");
  }

  /**
   * Recursively dereferences $ref components in an OpenAPI specification
   */
  static dereference(spec: any): { dereferenced: any; errors: SpecValidationIssue[] } {
    const errors: SpecValidationIssue[] = [];
    const root = JSON.parse(JSON.stringify(spec));

    const resolveRef = (refStr: string, currentPath: string, visited: Set<string>): any => {
      if (visited.has(refStr)) {
        errors.push({
          path: currentPath,
          message: `Circular reference detected at ${refStr}`,
          severity: "warning",
        });
        return { $ref: refStr, _circular: true };
      }

      const branchVisited = new Set(visited);
      branchVisited.add(refStr);
      if (!refStr.startsWith("#/")) {
        errors.push({
          path: currentPath,
          message: `External reference '${refStr}' is not supported in offline/sandboxed mode`,
          severity: "warning",
        });
        return { $ref: refStr };
      }

      const parts = refStr.substring(2).split("/");
      let current = root;
      for (const part of parts) {
        if (current && typeof current === "object" && part in current) {
          current = current[part];
        } else {
          errors.push({
            path: currentPath,
            message: `Could not resolve reference '${refStr}'`,
            severity: "error",
          });
          return null;
        }
      }

      // Recursively dereference resolved target
      return walkAndDereference(current, currentPath, branchVisited);
    };

    const walkAndDereference = (obj: any, currentPath: string, visited: Set<string>): any => {
      if (!obj || typeof obj !== "object") return obj;

      if (Array.isArray(obj)) {
        return obj.map((item, idx) => walkAndDereference(item, `${currentPath}[${idx}]`, new Set(visited)));
      }

      if (typeof obj.$ref === "string") {
        const resolved = resolveRef(obj.$ref, currentPath, visited);
        if (resolved) {
          const { $ref: _, ...rest } = obj;
          return { ...resolved, ...walkAndDereference(rest, currentPath, visited) };
        }
        return obj;
      }

      const result: any = {};
      for (const [key, val] of Object.entries(obj)) {
        result[key] = walkAndDereference(val, `${currentPath}.${key}`, visited);
      }
      return result;
    };

    const dereferenced = walkAndDereference(root, "$", new Set());
    return { dereferenced, errors };
  }

  /**
   * Validates OpenAPI structure and reports errors with JSONPath
   */
  static validate(spec: any): SpecValidationIssue[] {
    const issues: SpecValidationIssue[] = [];

    if (!spec || typeof spec !== "object") {
      issues.push({ path: "$", message: "Spec must be an object", severity: "error" });
      return issues;
    }

    if (!spec.openapi && !spec.swagger && !spec.__schema) {
      issues.push({
        path: "$",
        message: "Spec missing 'openapi' (e.g. 3.0.0, 3.1.0) or GraphQL '__schema' version",
        severity: "error",
      });
    }

    if (spec.paths && typeof spec.paths === "object") {
      for (const [pathStr, pathItem] of Object.entries<any>(spec.paths)) {
        if (!pathStr.startsWith("/")) {
          issues.push({
            path: `$.paths['${pathStr}']`,
            message: `Path '${pathStr}' must begin with a forward slash '/'`,
            severity: "error",
          });
        }

        const validMethods = ["get", "post", "put", "patch", "delete", "head", "options"];
        for (const [key, op] of Object.entries<any>(pathItem || {})) {
          if (validMethods.includes(key.toLowerCase())) {
            const opPath = `$.paths['${pathStr}'].${key}`;
            if (!op.responses || typeof op.responses !== "object") {
              issues.push({
                path: `${opPath}.responses`,
                message: `Operation '${key.toUpperCase()} ${pathStr}' missing required 'responses' definition`,
                severity: "error",
              });
            }
          }
        }
      }
    }

    return issues;
  }

  /**
   * Extracts operations and creates default example response data
   */
  static extractOperations(dereferencedSpec: any): ParsedOperation[] {
    const operations: ParsedOperation[] = [];
    if (!dereferencedSpec || !dereferencedSpec.paths) return operations;

    const validMethods = ["get", "post", "put", "patch", "delete", "head", "options"];

    for (const [pathStr, pathItem] of Object.entries<any>(dereferencedSpec.paths)) {
      if (!pathItem || typeof pathItem !== "object") continue;

      for (const [method, op] of Object.entries<any>(pathItem)) {
        if (!validMethods.includes(method.toLowerCase())) continue;

        const upperMethod = method.toUpperCase();
        const operationId = `${upperMethod} ${pathStr}`;
        const summary = op.summary || `${upperMethod} ${pathStr}`;
        const tags = Array.isArray(op.tags) && op.tags.length > 0 ? op.tags : ["General"];

        // Determine default response: 200/201/default
        const responses = op.responses || {};
        const successStatus = Object.keys(responses).find((code) => code.startsWith("2")) || "200";
        const responseDef = responses[successStatus] || {};

        let bodyExample: any = null;
        let schema: any = null;

        if (responseDef.content && responseDef.content["application/json"]) {
          const jsonContent = responseDef.content["application/json"];
          schema = jsonContent.schema;
          bodyExample = jsonContent.example || (jsonContent.examples && (Object.values(jsonContent.examples)[0] as any)?.value);
        }

        if (!bodyExample && responseDef.example) {
          bodyExample = responseDef.example;
        }

        // If no explicit example, generate sample payload from schema
        if (!bodyExample && schema) {
          bodyExample = this.generateSampleFromSchema(schema);
        }

        if (!bodyExample) {
          bodyExample = { message: `Default mock response for ${operationId}` };
        }

        operations.push({
          operationId,
          method: upperMethod,
          path: pathStr,
          summary,
          tags,
          parameters: op.parameters || [],
          requestBody: op.requestBody,
          responses,
          defaultResponse: {
            status: parseInt(successStatus, 10) || 200,
            headers: { "Content-Type": "application/json" },
            body: bodyExample,
          },
        });
      }
    }

    return operations;
  }

  /**
   * Generates deterministic mock JSON values from a JSON Schema
   */
  static generateSampleFromSchema(schema: any): any {
    if (!schema || typeof schema !== "object") return {};

    if (schema.example !== undefined) return schema.example;
    if (schema.default !== undefined) return schema.default;

    const type = schema.type || (schema.properties ? "object" : "string");

    switch (type) {
      case "object": {
        const obj: any = {};
        const props = schema.properties || {};
        for (const [propName, propSchema] of Object.entries(props)) {
          obj[propName] = this.generateSampleFromSchema(propSchema);
        }
        return obj;
      }
      case "array": {
        const itemSchema = schema.items || { type: "string" };
        return [this.generateSampleFromSchema(itemSchema)];
      }
      case "string":
        if (schema.format === "date-time") return new Date().toISOString();
        if (schema.format === "uuid") return "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d";
        if (schema.format === "email") return "user@example.com";
        return schema.enum ? schema.enum[0] : "sample_value";
      case "number":
      case "integer":
        return 42;
      case "boolean":
        return true;
      default:
        return {};
    }
  }

  /**
   * Calculates re-import diff and flags hand-edited rule conflicts
   */
  static computeReimportDiff(
    existingOperations: string[],
    newOperations: string[],
    editedRules: Array<{ operationId: string; name: string }>
  ): ReimportDiff {
    const existingSet = new Set(existingOperations);
    const newSet = new Set(newOperations);

    const added: string[] = [];
    const changed: string[] = [];
    const removed: string[] = [];
    const conflicts: Array<{ operationId: string; ruleName: string; reason: string }> = [];

    for (const op of newOperations) {
      if (!existingSet.has(op)) {
        added.push(op);
      } else {
        changed.push(op);
      }
    }

    for (const op of existingOperations) {
      if (!newSet.has(op)) {
        removed.push(op);
      }
    }

    for (const rule of editedRules) {
      if (newSet.has(rule.operationId)) {
        conflicts.push({
          operationId: rule.operationId,
          ruleName: rule.name,
          reason: "Human-edited rule protected. Won't be overwritten by spec re-import.",
        });
      }
    }

    return { added, changed, removed, conflicts };
  }
}
