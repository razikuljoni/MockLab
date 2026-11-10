import { Injectable, Logger } from "@nestjs/common";
import { MockRuleRecord } from "../prisma/data-store.service";

export interface IncomingMockRequest {
  method: string;
  path: string; // e.g. "/pets/42" or "/nope"
  query: Record<string, string | string[] | undefined>;
  headers: Record<string, string | string[] | undefined>;
  body: any;
}

export interface MatchResult {
  matched: boolean;
  rule?: MockRuleRecord;
  params?: Record<string, string>;
  nearMiss?: {
    closestRule: string;
    operationId: string;
    missedField: string;
    reason: string;
  };
}

@Injectable()
export class MockEngineService {
  private readonly logger = new Logger(MockEngineService.name);

  /**
   * Evaluates ordered rules with first-match-wins logic.
   * If unmatched, calculates the closest near-miss rule.
   */
  evaluate(rules: MockRuleRecord[], req: IncomingMockRequest): MatchResult {
    const activeRules = rules
      .filter((r) => r.enabled)
      .sort((a, b) => a.priority - b.priority);

    let closestCandidate: { rule: MockRuleRecord; score: number; reason: string; missedField: string } | null = null;

    for (const rule of activeRules) {
      const { matches, score, reason, missedField, params } = this.checkRuleMatch(rule, req);

      if (matches) {
        return {
          matched: true,
          rule,
          params,
        };
      }

      // Track closest near-miss
      if (!closestCandidate || score > closestCandidate.score) {
        closestCandidate = { rule, score, reason, missedField };
      }
    }

    return {
      matched: false,
      nearMiss: closestCandidate
        ? {
            closestRule: closestCandidate.rule.name,
            operationId: closestCandidate.rule.operationId,
            missedField: closestCandidate.missedField,
            reason: closestCandidate.reason,
          }
        : {
            closestRule: "None",
            operationId: "N/A",
            missedField: "All",
            reason: "No rules defined for this project",
          },
    };
  }

  /**
   * Checks if an individual rule matches the incoming request
   */
  private checkRuleMatch(
    rule: MockRuleRecord,
    req: IncomingMockRequest
  ): {
    matches: boolean;
    score: number;
    reason: string;
    missedField: string;
    params?: Record<string, string>;
  } {
    let score = 0;
    const matcher = rule.matcher || {};

    // 1. Method check
    const ruleMethod = (matcher.method || rule.operationId.split(" ")[0] || "GET").toUpperCase();
    if (ruleMethod !== req.method.toUpperCase()) {
      return {
        matches: false,
        score,
        reason: `Method mismatch: expected ${ruleMethod}, got ${req.method}`,
        missedField: "method",
      };
    }
    score += 10;

    // 2. Path check
    const rawPattern = matcher.path || rule.operationId.split(" ")[1] || "/";
    const { regex, paramNames } = this.compilePathPattern(rawPattern);
    const pathMatch = req.path.match(regex);

    if (!pathMatch) {
      return {
        matches: false,
        score,
        reason: `Path '${req.path}' did not match pattern '${rawPattern}'`,
        missedField: "path",
      };
    }
    score += 40;

    // Extract route parameters (e.g. :id)
    const params: Record<string, string> = {};
    if (paramNames.length > 0) {
      paramNames.forEach((name, idx) => {
        params[name] = pathMatch[idx + 1];
      });
    }

    // 3. Query params check
    if (matcher.query && typeof matcher.query === "object") {
      for (const [qKey, qExpected] of Object.entries(matcher.query)) {
        const qActual = req.query[qKey];
        if (qActual === undefined || (qExpected !== "*" && String(qActual) !== String(qExpected))) {
          return {
            matches: false,
            score,
            reason: `Query parameter '${qKey}' expected '${qExpected}', received '${qActual ?? "undefined"}'`,
            missedField: `query.${qKey}`,
          };
        }
        score += 10;
      }
    }

    // 4. Headers check
    if (matcher.headers && typeof matcher.headers === "object") {
      for (const [hKey, hExpected] of Object.entries(matcher.headers)) {
        const lowerHKey = hKey.toLowerCase();
        const hActual = req.headers[lowerHKey];
        if (hActual === undefined || (hExpected !== "*" && String(hActual) !== String(hExpected))) {
          return {
            matches: false,
            score,
            reason: `Header '${hKey}' expected '${hExpected}', received '${hActual ?? "missing"}'`,
            missedField: `header.${hKey}`,
          };
        }
        score += 10;
      }
    }

    // 5. Body / JSONPath check
    if (matcher.jsonPath && typeof matcher.jsonPath === "string") {
      const val = this.extractSimpleJsonPath(req.body, matcher.jsonPath);
      if (val === undefined || (matcher.jsonPathValue !== undefined && val !== matcher.jsonPathValue)) {
        return {
          matches: false,
          score,
          reason: `JSONPath '${matcher.jsonPath}' condition failed (value: ${JSON.stringify(val)})`,
          missedField: `body.${matcher.jsonPath}`,
        };
      }
      score += 20;
    }

    return {
      matches: true,
      score: 100,
      reason: "All matcher clauses satisfied",
      missedField: "",
      params,
    };
  }

  /**
   * Compiles OpenAPI path pattern (e.g. "/pets/{id}" or "/pets/:id") into a regular expression
   */
  compilePathPattern(pattern: string): { regex: RegExp; paramNames: string[] } {
    const paramNames: string[] = [];
    const normalized = pattern.trim().startsWith("/") ? pattern.trim() : `/${pattern.trim()}`;

    // Replace {param} or :param with regex capture group ([^/]+)
    const regexStr = normalized
      .replace(/\{([a-zA-Z0-9_]+)\}/g, (_, name) => {
        paramNames.push(name);
        return "([^/]+)";
      })
      .replace(/:([a-zA-Z0-9_]+)/g, (_, name) => {
        paramNames.push(name);
        return "([^/]+)";
      })
      .replace(/\/+$/, ""); // drop trailing slash

    return {
      regex: new RegExp(`^${regexStr || "/"}/?$`, "i"),
      paramNames,
    };
  }

  /**
   * Simple JSONPath extractor (e.g. "$.status" or "$.user.id")
   */
  private extractSimpleJsonPath(obj: any, path: string): any {
    if (!obj || typeof obj !== "object") return undefined;
    const cleanPath = path.startsWith("$.") ? path.substring(2) : path;
    const parts = cleanPath.split(".");
    let curr = obj;
    for (const part of parts) {
      if (curr && typeof curr === "object" && part in curr) {
        curr = curr[part];
      } else {
        return undefined;
      }
    }
    return curr;
  }
}
