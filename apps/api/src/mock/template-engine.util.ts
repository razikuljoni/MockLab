import * as crypto from "node:crypto";

export interface TemplateContext {
  body?: any;
  query?: Record<string, any>;
  params?: Record<string, any>;
  headers?: Record<string, any>;
}

export class TemplateEngineUtil {
  /**
   * Renders templated placeholders inside strings, objects, or arrays
   */
  static render(template: any, context: TemplateContext): any {
    if (template === null || template === undefined) return template;

    if (typeof template === "string") {
      return this.renderString(template, context);
    }

    if (Array.isArray(template)) {
      return template.map((item) => this.render(item, context));
    }

    if (typeof template === "object") {
      const result: Record<string, any> = {};
      for (const [key, val] of Object.entries(template)) {
        result[key] = this.render(val, context);
      }
      return result;
    }

    return template;
  }

  private static renderString(str: string, context: TemplateContext): string {
    return str.replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, (match, path) => {
      // 1. Built-in generators
      if (path === "uuid") return crypto.randomUUID();
      if (path === "now") return new Date().toISOString();
      if (path.startsWith("faker.")) return this.generateFakerValue(path);

      // 2. Context lookups: body.x, query.x, params.x, headers.x
      const parts = path.split(".");
      const rootKey = parts[0];
      const rest = parts.slice(1);

      let targetRoot: any;
      if (rootKey === "body") targetRoot = context.body;
      else if (rootKey === "query") targetRoot = context.query;
      else if (rootKey === "params") targetRoot = context.params;
      else if (rootKey === "headers") targetRoot = context.headers;
      else targetRoot = context.body; // default fallback

      if (targetRoot && rest.length > 0) {
        let curr = targetRoot;
        for (const p of rest) {
          if (curr && typeof curr === "object" && p in curr) {
            curr = curr[p];
          } else {
            return match; // Return unchanged if not found
          }
        }
        return String(curr);
      }

      return match;
    });
  }

  private static generateFakerValue(path: string): string {
    switch (path) {
      case "faker.person.fullName":
      case "faker.name":
        return "Alex Morgan";
      case "faker.person.firstName":
        return "Alex";
      case "faker.person.lastName":
        return "Morgan";
      case "faker.internet.email":
      case "faker.email":
        return "alex.morgan@example.com";
      case "faker.location.city":
      case "faker.city":
        return "San Francisco";
      case "faker.location.country":
        return "United States";
      case "faker.phone":
        return "+1-555-0199";
      case "faker.company.name":
        return "Acme Labs Inc";
      default:
        return "sample_data";
    }
  }
}
