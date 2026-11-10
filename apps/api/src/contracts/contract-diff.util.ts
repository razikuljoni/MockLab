import { Verdict } from "@prisma/client";

export interface DiffLine {
  path: string; // JSONPath, e.g. "$.id", "$.user.email", "$.items[0]"
  type: "ADDED" | "REMOVED" | "CHANGED";
  expected?: any;
  actual?: any;
  breaking: boolean;
  message?: string;
}

export interface DiffReport {
  verdict: Verdict;
  summary: {
    added: number;
    removed: number;
    changed: number;
    total: number;
  };
  lines: DiffLine[];
}

export class ContractDiffUtil {
  /**
   * Performs recursive structural comparison of expected payload (or schema) against actual response payload.
   * Classifies changes strictly per §6.6:
   * - BREAKING: required field removed, type changed, status changed.
   * - NON-BREAKING: field added, optional field removed, enum added.
   * - PASS: exact or schema match.
   */
  static compare(
    expectedStatus: number,
    actualStatus: number,
    expectedBody: any,
    actualBody: any,
    expectedSchema?: any
  ): DiffReport {
    const lines: DiffLine[] = [];

    // 1. Status Code Check
    if (expectedStatus !== actualStatus) {
      lines.push({
        path: "$status",
        type: "CHANGED",
        expected: expectedStatus,
        actual: actualStatus,
        breaking: true,
        message: `Expected HTTP status ${expectedStatus} but received ${actualStatus}`,
      });
    }

    // 2. Body Structural Diff
    this.diffRecursive("$", expectedBody, actualBody, expectedSchema, lines);

    // 3. Summarize counts
    let added = 0;
    let removed = 0;
    let changed = 0;
    let hasBreaking = false;
    let hasNonBreaking = false;

    for (const l of lines) {
      if (l.type === "ADDED") added++;
      else if (l.type === "REMOVED") removed++;
      else if (l.type === "CHANGED") changed++;

      if (l.breaking) hasBreaking = true;
      else hasNonBreaking = true;
    }

    let verdict: Verdict = Verdict.PASS;
    if (hasBreaking) {
      verdict = Verdict.BREAKING;
    } else if (hasNonBreaking) {
      verdict = Verdict.NON_BREAKING;
    }

    return {
      verdict,
      summary: {
        added,
        removed,
        changed,
        total: lines.length,
      },
      lines,
    };
  }

  private static diffRecursive(
    currentPath: string,
    expected: any,
    actual: any,
    schema: any,
    lines: DiffLine[]
  ) {
    if (expected === actual) return;

    // Both are objects / dictionaries
    if (this.isPlainObject(expected) && this.isPlainObject(actual)) {
      const expectedKeys = Object.keys(expected);
      const actualKeys = Object.keys(actual);
      const allKeys = new Set([...expectedKeys, ...actualKeys]);

      const requiredKeys = new Set(schema?.required || expectedKeys);

      for (const key of allKeys) {
        const nextPath = `${currentPath}.${key}`;
        const hasExp = key in expected;
        const hasAct = key in actual;

        if (hasExp && !hasAct) {
          // Field was removed
          const isRequired = requiredKeys.has(key);
          lines.push({
            path: nextPath,
            type: "REMOVED",
            expected: expected[key],
            actual: undefined,
            breaking: isRequired, // Required field removed = BREAKING; Optional removed = NON-BREAKING
            message: isRequired
              ? `Required field '${key}' was removed in provider response`
              : `Optional field '${key}' was omitted in provider response`,
          });
        } else if (!hasExp && hasAct) {
          // Field was added -> NON-BREAKING (additive change per §6.6)
          lines.push({
            path: nextPath,
            type: "ADDED",
            expected: undefined,
            actual: actual[key],
            breaking: false,
            message: `New field '${key}' added by provider`,
          });
        } else {
          // Both have key -> compare values
          const childSchema = schema?.properties?.[key];
          this.diffRecursive(nextPath, expected[key], actual[key], childSchema, lines);
        }
      }
      return;
    }

    // Both are arrays
    if (Array.isArray(expected) && Array.isArray(actual)) {
      if (expected.length === 0 && actual.length === 0) return;
      const compareLen = Math.max(expected.length, actual.length);
      const itemSchema = schema?.items;

      for (let i = 0; i < compareLen; i++) {
        const nextPath = `${currentPath}[${i}]`;
        if (i in expected && !(i in actual)) {
          lines.push({
            path: nextPath,
            type: "REMOVED",
            expected: expected[i],
            actual: undefined,
            breaking: true,
            message: `Array item at index [${i}] missing in provider response`,
          });
        } else if (!(i in expected) && i in actual) {
          lines.push({
            path: nextPath,
            type: "ADDED",
            expected: undefined,
            actual: actual[i],
            breaking: false,
            message: `New array item at index [${i}] returned by provider`,
          });
        } else {
          this.diffRecursive(nextPath, expected[i], actual[i], itemSchema, lines);
        }
      }
      return;
    }

    // Primitive values or type mismatches
    const expType = typeof expected;
    const actType = typeof actual;

    if (expType !== actType) {
      lines.push({
        path: currentPath,
        type: "CHANGED",
        expected,
        actual,
        breaking: true,
        message: `Type changed from ${expType} to ${actType}`,
      });
      return;
    }

    // Same type, different values
    if (expected !== actual) {
      // If primitive values differ (e.g. timestamps, IDs), check if schema defines string/number
      // In contract testing, values can vary if types match unless strict exact matching is specified
      lines.push({
        path: currentPath,
        type: "CHANGED",
        expected,
        actual,
        breaking: false,
        message: `Value modified from '${expected}' to '${actual}'`,
      });
    }
  }

  private static isPlainObject(val: any): boolean {
    return val !== null && typeof val === "object" && !Array.isArray(val);
  }
}
